import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/network/api_client.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const SizedBox(height: 12),
          ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: const Text('Profile'),
            subtitle: const Text('Username, bio, avatar'),
            onTap: () {},
          ),
          const Divider(),
          ListTile(leading: const Icon(Icons.lock_outline), title: const Text('Privacy'), subtitle: const Text('Read receipts, last seen, blocks'), onTap: () {}),
          ListTile(leading: const Icon(Icons.notifications_outlined), title: const Text('Notifications'), subtitle: const Text('Push preferences, private previews'), onTap: () {}),
          ListTile(leading: const Icon(Icons.storage_outlined), title: const Text('Storage'), subtitle: const Text('Media, cache, data usage'), onTap: () {}),
          ListTile(leading: const Icon(Icons.info_outline), title: const Text('About Guftagu'), subtitle: const Text('Dev info, version, privacy policy'), onTap: () => context.push('/about')),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () async {
              await SecureStorage.clear();
              if (context.mounted) context.go('/login');
            },
          ),
          ListTile(
            leading: const Icon(Icons.delete_forever, color: Colors.red),
            title: const Text('Delete Account', style: TextStyle(color: Colors.red)),
            subtitle: const Text('Permanently delete your account and data'),
            onTap: () async {
              final confirm = await showDialog<bool>(context: context, builder: (c) => AlertDialog(title: const Text('Delete Account?'), content: const Text('Messages remain with recipients per policy. This cannot be undone.'), actions: [TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.pop(c, true), style: FilledButton.styleFrom(backgroundColor: Colors.red), child: const Text('Delete'))]));
              if (confirm == true) {
                try {
                  await ApiClient.dio.delete('/users/me');
                  await SecureStorage.clear();
                  if (context.mounted) context.go('/login');
                } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
              }
            },
          ),
          const SizedBox(height: 24),
          const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('Security: Transport encryption (TLS) only in v1. E2EE not yet implemented. See docs/SECURITY.md', style: TextStyle(fontSize: 11, color: Colors.grey))),
        ],
      ),
    );
  }
}
