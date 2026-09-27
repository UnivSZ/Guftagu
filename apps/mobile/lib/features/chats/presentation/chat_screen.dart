import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/storage/drift_db.dart';
import '../../../core/theme/app_colors.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:uuid/uuid.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final String conversationId;
  const ChatScreen({super.key, required this.conversationId});
  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  List<dynamic> _messages = [];
  bool _loading = true;
  IO.Socket? _socket;
  String? _myUserId;
  bool _isTyping = false;
  String? _typingUser;
  final _db = AppDatabase();

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _myUserId = await SecureStorage.getUserId();
    await _loadMessages();
    await _connectSocket();
  }

  Future<void> _loadMessages() async {
    try {
      final res = await ApiClient.dio.get('/conversations/${widget.conversationId}/messages', queryParameters: {'limit': 50});
      setState(() { _messages = res.data['messages'] as List; _loading = false; });
      // persist to drift
      for (final m in _messages) {
        await _db.upsertMessage(MessagesCompanion.insert(
          id: m['id'],
          clientMessageId: m['clientMessageId'] ?? const Uuid().v4(),
          conversationId: widget.conversationId,
          senderId: m['senderId'],
          senderName: Value(m['sender']?['displayName']),
          body: Value(m['body']),
          type: Value(m['type'] ?? 'TEXT'),
          sequenceNumber: m['sequenceNumber'] ?? 0,
          createdAt: DateTime.tryParse(m['createdAt'] ?? '') ?? DateTime.now(),
          status: const Value('SENT'),
        ));
      }
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } catch (e) {
      debugPrint('load msg error $e');
      setState(() => _loading = false);
    }
  }

  Future<void> _connectSocket() async {
    final token = await SecureStorage.getAccessToken();
    final baseUrl = ApiClient.dio.options.baseUrl.replaceAll('/api/v1', '');
    _socket = IO.io('$baseUrl/ws', IO.OptionBuilder().setTransports(['websocket']).enableAutoConnect().setAuth({'token': token}).build());
    _socket!.onConnect((_) => debugPrint('WS connected'));
    _socket!.on('message:new', (data) {
      if (data['conversationId'] == widget.conversationId) {
        setState(() { _messages.add(data); });
        _scrollToBottom();
        // mark delivered
        _socket!.emit('message:delivered', {'messageId': data['id']});
      }
    });
    _socket!.on('typing', (data) {
      if (data['conversationId'] == widget.conversationId && data['userId'] != _myUserId) {
        setState(() { _isTyping = data['isTyping']; _typingUser = data['userId']; });
      }
    });
    _socket!.connect();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(_scrollController.position.maxScrollExtent + 200, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    }
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final clientId = const Uuid().v4();
    final pending = {
      'id': 'pending_$clientId',
      'clientMessageId': clientId,
      'conversationId': widget.conversationId,
      'senderId': _myUserId,
      'body': text,
      'type': 'TEXT',
      'sequenceNumber': (_messages.isNotEmpty ? (_messages.last['sequenceNumber'] ?? 0) : 0) + 1,
      'createdAt': DateTime.now().toIso8601String(),
      'status': 'PENDING',
      'sender': {'displayName': 'You'},
    };
    setState(() { _messages.add(pending); _controller.clear(); });
    _scrollToBottom();

    // Enqueue offline
    await _db.enqueue(QueuedMessagesCompanion.insert(clientMessageId: clientId, conversationId: widget.conversationId, body: Value(text)));

    try {
      // Try WS first
      if (_socket != null && _socket!.connected) {
        _socket!.emitWithAck('message:send', {
          'conversationId': widget.conversationId,
          'clientMessageId': clientId,
          'body': text,
          'type': 'TEXT',
        }, ack: (data) {
          if (data != null && data['message'] != null) {
            setState(() {
              final idx = _messages.indexWhere((m) => m['clientMessageId'] == clientId);
              if (idx != -1) _messages[idx] = data['message'];
            });
            _db.dequeue(clientId);
          }
        });
      } else {
        // HTTP fallback
        final res = await ApiClient.dio.post('/conversations/${widget.conversationId}/messages', data: {
          'clientMessageId': clientId,
          'body': text,
          'type': 'TEXT',
        });
        setState(() {
          final idx = _messages.indexWhere((m) => m['clientMessageId'] == clientId);
          if (idx != -1) _messages[idx] = res.data;
        });
        _db.dequeue(clientId);
      }
    } catch (e) {
      debugPrint('send error $e');
      // keep in queue for retry
    }
  }

  @override
  void dispose() {
    _socket?.dispose();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
        actions: [IconButton(icon: const Icon(Icons.more_vert), onPressed: () {})],
      ),
      body: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.wallpaperDark : AppColors.wallpaperLight,
        ),
        child: Column(
          children: [
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      itemCount: _messages.length,
                      itemBuilder: (context, i) {
                        final m = _messages[i];
                        final isMe = m['senderId'] == _myUserId || m['sender']?['displayName'] == 'You';
                        final isPending = m['status'] == 'PENDING' || (m['id'] as String).startsWith('pending_');
                        return Align(
                          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                            decoration: BoxDecoration(
                              color: isMe ? (isDark ? AppColors.outgoingDark : AppColors.outgoingLight) : (isDark ? AppColors.incomingDark : AppColors.incomingLight),
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(16),
                                topRight: const Radius.circular(16),
                                bottomLeft: Radius.circular(isMe ? 16 : 4),
                                bottomRight: Radius.circular(isMe ? 4 : 16),
                              ),
                              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0,1))],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (m['replyTo'] != null) Container(
                                  padding: const EdgeInsets.all(6),
                                  margin: const EdgeInsets.only(bottom: 6),
                                  decoration: BoxDecoration(color: Colors.black.withOpacity(0.06), borderRadius: BorderRadius.circular(8), border: const Border(left: BorderSide(color: AppColors.primary, width: 3))),
                                  child: Text(m['replyTo']['body'] ?? '', style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
                                ),
                                Text(m['body'] ?? '', style: const TextStyle(fontSize: 15, height: 1.35)),
                                const SizedBox(height: 4),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(_formatTime(m['createdAt']), style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                                    if (isMe) ...[
                                      const SizedBox(width: 4),
                                      Icon(
                                        isPending ? Icons.access_time : Icons.done_all,
                                        size: 14,
                                        color: isPending ? Colors.grey : AppColors.primary,
                                      ),
                                    ],
                                    if (m['isEdited'] == true) const Padding(padding: EdgeInsets.only(left: 4), child: Text('edited', style: TextStyle(fontSize: 9, fontStyle: FontStyle.italic))),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            if (_isTyping) Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4), child: Align(alignment: Alignment.centerLeft, child: Text('Typing...', style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontStyle: FontStyle.italic)))),
            SafeArea(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                color: Theme.of(context).colorScheme.surface,
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.emoji_emotions_outlined), onPressed: () {}),
                    IconButton(icon: const Icon(Icons.attach_file), onPressed: () {}),
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        minLines: 1,
                        maxLines: 5,
                        decoration: InputDecoration(
                          hintText: 'Message',
                          filled: true,
                          fillColor: Theme.of(context).colorScheme.surfaceVariant,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                        onChanged: (v) {
                          if (v.isNotEmpty) _socket?.emit('typing:start', {'conversationId': widget.conversationId});
                          else _socket?.emit('typing:stop', {'conversationId': widget.conversationId});
                        },
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    CircleAvatar(
                      backgroundColor: AppColors.primary,
                      child: IconButton(icon: const Icon(Icons.send, color: Colors.white, size: 20), onPressed: _send),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(dynamic iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.hour}:${dt.minute.toString().padLeft(2,'0')}';
    } catch (_) { return ''; }
  }
}
