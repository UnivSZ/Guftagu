import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

class CallsScreen extends StatefulWidget {
  const CallsScreen({super.key});
  @override
  State<CallsScreen> createState() => _CallsScreenState();
}

class _CallsScreenState extends State<CallsScreen> {
  List<dynamic> _calls = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await ApiClient.dio.get('/calls/history');
      setState(() { _calls = res.data as List; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Calls')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _calls.isEmpty ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.call_outlined, size: 64, color: Colors.grey.shade400), const SizedBox(height: 12), const Text('No calls yet', style: TextStyle(color: Colors.grey)), const SizedBox(height: 8), const Text('One-to-one audio/video calling\nis implemented with WebRTC signalling.\nConfigure STUN/TURN in production.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey))])) : ListView.separated(
        itemCount: _calls.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, i) {
          final call = _calls[i];
          return ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(call['calleeId'] ?? 'Unknown'),
            subtitle: Text('${call['type']} • ${call['status']}'),
            trailing: Icon(call['type'] == 'VIDEO' ? Icons.videocam : Icons.call),
          );
        },
      ),
    );
  }
}
