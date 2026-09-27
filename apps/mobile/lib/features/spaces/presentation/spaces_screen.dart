import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';

class SpacesScreen extends StatefulWidget {
  const SpacesScreen({super.key});
  @override
  State<SpacesScreen> createState() => _SpacesScreenState();
}

class _SpacesScreenState extends State<SpacesScreen> {
  List<dynamic> _conversations = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await ApiClient.dio.get('/conversations');
      setState(() { _conversations = (res.data as List).where((c) => c['type'] == 'GROUP').toList(); _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Spaces')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _conversations.length,
        itemBuilder: (context, i) {
          final c = _conversations[i];
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  CircleAvatar(backgroundColor: AppColors.primaryContainer, child: Text((c['displayName'] ?? c['name'] ?? '?')[0])),
                  const SizedBox(width: 12),
                  Expanded(child: Text(c['displayName'] ?? c['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16))),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: Text(c['theme'] ?? 'DEFAULT', style: const TextStyle(fontSize: 10, color: AppColors.primary))),
                ]),
                if (c['quote'] != null) ...[
                  const SizedBox(height: 12),
                  Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceVariant, borderRadius: BorderRadius.circular(12)), child: Row(children: [const Icon(Icons.format_quote, size: 16, color: AppColors.primary), const SizedBox(width: 8), Expanded(child: Text('"${c['quote']}"', style: const TextStyle(fontStyle: FontStyle.italic)))])),
                ],
                const SizedBox(height: 12),
                Row(children: [
                  _SpaceAction(icon: Icons.event, label: 'Plans', onTap: () {}),
                  const SizedBox(width: 16),
                  _SpaceAction(icon: Icons.photo_library, label: 'Media', onTap: () {}),
                  const SizedBox(width: 16),
                  _SpaceAction(icon: Icons.push_pin, label: 'Pinned', onTap: () {}),
                ]),
              ]),
            ),
          );
        },
      ),
    );
  }
}

class _SpaceAction extends StatelessWidget {
  final IconData icon; final String label; final VoidCallback onTap;
  const _SpaceAction({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return InkWell(onTap: onTap, child: Row(children: [Icon(icon, size: 18, color: AppColors.primary), const SizedBox(width: 4), Text(label, style: const TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w500))]));
  }
}
