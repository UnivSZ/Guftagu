import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/storage/drift_db.dart';
import '../../../core/theme/app_colors.dart';
import 'package:drift/drift.dart' as drift;
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
      for (final m in _messages) {
        await _db.upsertMessage(MessagesCompanion.insert(
          id: m['id'],
          clientMessageId: m['clientMessageId'] ?? const Uuid().v4(),
          conversationId: widget.conversationId,
          senderId: m['senderId'],
          senderName: drift.Value(m['sender']?['displayName']),
          body: drift.Value(m['body']),
          type: drift.Value(m['type'] ?? 'TEXT'),
          sequenceNumber: m['sequenceNumber'] ?? 0,
          createdAt: DateTime.tryParse(m['createdAt'] ?? '') ?? DateTime.now(),
          status: const drift.Value('SENT'),
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

    await _db.enqueue(QueuedMessagesCompanion.insert(clientMessageId: clientId, conversationId: widget.conversationId, body: drift.Value(text)));

    try {
      if (_socket != null && _socket!.connected) {
        _socket!.emitWithAck('message:send', {
          'conversationId': widget.conversationId,
          'clientMessageId': clientId,
          'body': text,
          'type': 'TEXT',
        }, ack: (data) {
          debugPrint('WS ack $data');
          setState(() {
            final idx = _messages.indexWhere((m) => m['clientMessageId'] == clientId);
            if (idx != -1) _messages[idx]['status'] = 'SENT';
          });
          _db.dequeue(clientId);
        });
      } else {
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
      setState(() {
        final idx = _messages.indexWhere((m) => m['clientMessageId'] == clientId);
        if (idx != -1) _messages[idx]['status'] = 'FAILED';
      });
    }
  }

  void _onTyping(bool isTyping) {
    _socket?.emit('typing', {'conversationId': widget.conversationId, 'isTyping': isTyping});
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
        actions: [
          IconButton(icon: const Icon(Icons.call), onPressed: () {}),
          IconButton(icon: const Icon(Icons.videocam), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    itemCount: _messages.length + (_isTyping ? 1 : 0),
                    itemBuilder: (ctx, i) {
                      if (_isTyping && i == _messages.length) {
                        return ListTile(title: Text('${_typingUser ?? 'Someone'} is typing...', style: const TextStyle(fontStyle: FontStyle.italic)));
                      }
                      final m = _messages[i];
                      final isMe = m['senderId'] == _myUserId;
                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isMe ? AppColors.primary : Colors.grey[200],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(m['body'] ?? '', style: TextStyle(color: isMe ? Colors.white : Colors.black)),
                              const SizedBox(height: 4),
                              Text(m['status'] ?? 'SENT', style: TextStyle(fontSize: 10, color: isMe ? Colors.white70 : Colors.black54)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    onChanged: (v) => _onTyping(v.isNotEmpty),
                    decoration: const InputDecoration(hintText: 'Type a message', border: OutlineInputBorder()),
                    onSubmitted: (_) => _send(),
                  ),
                ),
                IconButton(icon: const Icon(Icons.send), onPressed: _send),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
