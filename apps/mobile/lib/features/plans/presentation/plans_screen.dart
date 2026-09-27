import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';

class PlansScreen extends StatefulWidget {
  final String conversationId;
  const PlansScreen({super.key, required this.conversationId});
  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  List<dynamic> _plans = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await ApiClient.dio.get('/conversations/${widget.conversationId}/plans');
      setState(() { _plans = res.data as List; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Future<void> _createPlan() async {
    final titleCtrl = TextEditingController();
    final locCtrl = TextEditingController();
    final minCtrl = TextEditingController(text: '6');
    DateTime? selectedDate = DateTime.now().add(const Duration(days: 1));
    await showDialog(context: context, builder: (c) => AlertDialog(
      title: const Text('New Plan'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title e.g. Sunday Cricket')),
        TextField(controller: locCtrl, decoration: const InputDecoration(labelText: 'Location e.g. College Ground')),
        TextField(controller: minCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Min participants')),
        const SizedBox(height: 8),
        Text(selectedDate.toString()),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
        FilledButton(onPressed: () async {
          Navigator.pop(c);
          try {
            await ApiClient.dio.post('/conversations/${widget.conversationId}/plans', data: {
              'title': titleCtrl.text,
              'description': 'Plan created from app',
              'locationText': locCtrl.text,
              'minParticipants': int.tryParse(minCtrl.text) ?? 2,
              'options': [{'startAt': selectedDate!.toIso8601String(), 'timeZone': 'Asia/Kolkata'}]
            });
            _load();
          } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error $e'))); }
        }, child: const Text('Create')),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Plans')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _plans.isEmpty ? const Center(child: Text('No plans yet. Create one!')) : ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _plans.length,
        itemBuilder: (context, i) {
          final p = _plans[i];
          final rsvps = p['rsvps'] as List? ?? [];
          final inCount = rsvps.where((r) => r['status'] == 'IN').length;
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p['title'], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                if (p['locationText'] != null) Text('${p['locationText']}', style: const TextStyle(color: Colors.grey)),
                const SizedBox(height: 8),
                Text('Min: ${p['minParticipants'] ?? '-'} • In: $inCount', style: const TextStyle(fontSize: 12)),
                const SizedBox(height: 12),
                Row(children: [
                  _RsvpButton(label: "I'm in", color: AppColors.primary, onTap: () => _rsvp(p['id'], 'IN')),
                  const SizedBox(width: 8),
                  _RsvpButton(label: 'Maybe', color: Colors.orange, onTap: () => _rsvp(p['id'], 'MAYBE')),
                  const SizedBox(width: 8),
                  _RsvpButton(label: "Can't", color: Colors.grey, onTap: () => _rsvp(p['id'], 'CANT')),
                ]),
                if (p['options'] != null) ...[
                  const SizedBox(height: 12),
                  ...((p['options'] as List).map((opt) => ListTile(dense: true, title: Text(opt['startAt']), trailing: ElevatedButton(child: const Text('Vote'), onPressed: () => _vote(p['id'], opt['id']))))),
                ],
              ]),
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(onPressed: _createPlan, backgroundColor: AppColors.primary, child: const Icon(Icons.add, color: Colors.white)),
    );
  }

  Future<void> _rsvp(String planId, String status) async {
    try { await ApiClient.dio.post('/plans/$planId/rsvp', data: {'status': status}); _load(); } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error $e'))); }
  }
  Future<void> _vote(String planId, String optionId) async {
    try { await ApiClient.dio.post('/plans/$planId/vote', data: {'optionId': optionId}); _load(); } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error $e'))); }
  }
}

class _RsvpButton extends StatelessWidget {
  final String label; final Color color; final VoidCallback onTap;
  const _RsvpButton({required this.label, required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return InkWell(onTap: onTap, child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(20), border: Border.all(color: color)), child: Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600))));
  }
}
