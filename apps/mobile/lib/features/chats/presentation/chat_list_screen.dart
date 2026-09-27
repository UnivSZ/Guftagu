import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

class ChatListScreen extends ConsumerStatefulWidget {
  const ChatListScreen({super.key});
  @override
  ConsumerState<ChatListScreen> createState() => _ChatListScreenState();
}

class _ChatListScreenState extends ConsumerState<ChatListScreen> {
  List<dynamic> _conversations = [];
  bool _loading = true;
  String _filter = 'All'; // All, Unread, Groups
  String _search = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.dio.get('/conversations');
      setState(() { _conversations = res.data as List; });
    } catch (e) {
      debugPrint('load conv error $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  List<dynamic> get filtered {
    return _conversations.where((c) {
      final membership = c['membership'];
      final type = c['type'];
      if (_filter == 'Unread' && (membership?['unreadCount'] ?? 0) == 0) return false;
      if (_filter == 'Groups' && type != 'GROUP') return false;
      if (_search.isNotEmpty) {
        final name = (c['displayName'] ?? c['name'] ?? '').toString().toLowerCase();
        if (!name.contains(_search.toLowerCase())) return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Guftagu'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                _FilterChip(label: 'All', selected: _filter == 'All', onTap: () => setState(() => _filter = 'All')),
                const SizedBox(width: 8),
                _FilterChip(label: 'Unread', selected: _filter == 'Unread', onTap: () => setState(() => _filter = 'Unread')),
                const SizedBox(width: 8),
                _FilterChip(label: 'Groups', selected: _filter == 'Groups', onTap: () => setState(() => _filter = 'Groups')),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search conversations',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => Divider(height: 1, indent: 72, color: Theme.of(context).dividerColor),
                      itemBuilder: (context, i) {
                        final c = filtered[i];
                        final unread = c['membership']?['unreadCount'] ?? 0;
                        final isPinned = c['membership']?['isPinned'] ?? false;
                        final isMuted = c['membership']?['mutedUntil'] != null;
                        final lastAt = c['lastMessageAt'] != null ? DateTime.parse(c['lastMessageAt']) : null;
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppColors.primaryContainer,
                            child: Text((c['displayName'] ?? c['name'] ?? '?')[0].toUpperCase(), style: const TextStyle(color: AppColors.primary)),
                          ),
                          title: Row(
                            children: [
                              Expanded(child: Text(c['displayName'] ?? c['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis)),
                              if (isPinned) const Padding(padding: EdgeInsets.only(left: 4), child: Icon(Icons.push_pin, size: 14, color: Colors.grey)),
                              if (isMuted) const Padding(padding: EdgeInsets.only(left: 4), child: Icon(Icons.volume_off, size: 14, color: Colors.grey)),
                            ],
                          ),
                          subtitle: Text(c['lastMessagePreview'] ?? 'No messages yet', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: Theme.of(context).textTheme.bodySmall?.color)),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (lastAt != null) Text(_formatTime(lastAt), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                              if (unread > 0) ...[
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                                  child: Text(unread.toString(), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ],
                          ),
                          onTap: () => context.push('/chats/${c['id']}'),
                        );
                      },
                    ),
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () => _showNewChatSheet(),
        child: const Icon(Icons.chat, color: Colors.white),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final now = DateTime.now();
    if (now.difference(dt).inDays == 0) return '${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    if (now.difference(dt).inDays < 7) return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][dt.weekday-1];
    return '${dt.day}/${dt.month}';
  }

  void _showNewChatSheet() {
    showModalBottomSheet(context: context, builder: (c) => Padding(
      padding: const EdgeInsets.all(16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        ListTile(leading: const Icon(Icons.group_add), title: const Text('New Group'), onTap: () {}),
        ListTile(leading: const Icon(Icons.person_add), title: const Text('New Direct Chat'), onTap: () async {
          Navigator.pop(c);
          final username = await showDialog<String>(context: context, builder: (ctx) {
            final ctrl = TextEditingController();
            return AlertDialog(title: const Text('Username'), content: TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'e.g. saad')), actions: [TextButton(onPressed: () => Navigator.pop(ctx, ctrl.text), child: const Text('Search'))]);
          });
          if (username != null && username.isNotEmpty) {
            try {
              final res = await ApiClient.dio.get('/users/by-username/$username');
              final otherId = res.data['id'];
              final convRes = await ApiClient.dio.post('/conversations/direct', data: {'otherUserId': otherId});
              if (mounted) context.push('/chats/${convRes.data['id']}');
            } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
          }
        }),
      ]),
    ));
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppColors.primary : Colors.transparent),
        ),
        child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: selected ? Colors.white : Theme.of(context).colorScheme.onSurfaceVariant)),
      ),
    );
  }
}
