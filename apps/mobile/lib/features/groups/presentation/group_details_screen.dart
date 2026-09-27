import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import 'package:go_router/go_router.dart';

class GroupDetailsScreen extends StatefulWidget {
  final String conversationId;
  const GroupDetailsScreen({super.key, required this.conversationId});
  @override
  State<GroupDetailsScreen> createState() => _GroupDetailsScreenState();
}

class _GroupDetailsScreenState extends State<GroupDetailsScreen> {
  dynamic _conv;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await ApiClient.dio.get('/conversations/${widget.conversationId}');
      setState(() { _conv = res.data; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));
    final members = _conv['members'] as List? ?? [];
    return Scaffold(
      appBar: AppBar(title: Text(_conv['name'] ?? 'Group')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_conv['description'] != null) Text(_conv['description']),
          const SizedBox(height: 16),
          if (_conv['quote'] != null) Card(child: Padding(padding: const EdgeInsets.all(12), child: Text('"${_conv['quote']}"', style: const TextStyle(fontStyle: FontStyle.italic)))),
          const SizedBox(height: 16),
          Row(children: [
            ElevatedButton.icon(icon: const Icon(Icons.event), label: const Text('Plans'), onPressed: () => context.push('/groups/${widget.conversationId}/plans')),
            const SizedBox(width: 12),
            ElevatedButton.icon(icon: const Icon(Icons.quiz), label: const Text('Trivia'), onPressed: () async {
              try {
                final res = await ApiClient.dio.post('/conversations/${widget.conversationId}/trivia/start', data: {'questionCount': 5});
                final sessionId = res.data['session']['id'];
                if (mounted) context.push('/groups/${widget.conversationId}/trivia/$sessionId');
              } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
            }),
          ]),
          const SizedBox(height: 24),
          Text('Members (${members.length})', style: const TextStyle(fontWeight: FontWeight.w600)),
          ...members.map((m) => ListTile(leading: CircleAvatar(child: Text(m['user']['displayName'][0])), title: Text(m['user']['displayName']), subtitle: Text(m['role']))),
        ],
      ),
    );
  }
}
