import 'package:flutter/material.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 88, height: 88,
              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(22), boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0,4))]),
              child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 44),
            ),
            const SizedBox(height: 16),
            const Text('Guftagu', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
            const SizedBox(height: 4),
            const Text('Familiar, dependable, thoughtfully designed.', style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _AboutRow(icon: Icons.person, label: 'Dev', value: 'Saad Hussain'),
                    const Divider(height: 24),
                    _AboutRow(icon: Icons.people, label: 'Co-Dev', value: 'Ashad Ahamad'),
                    const Divider(height: 24),
                    _AboutRow(icon: Icons.tag, label: 'Version', value: '0.1.0+1 (alpha)'),
                    const Divider(height: 24),
                    _AboutRow(icon: Icons.apps, label: 'Android ID', value: AppConstants.androidAppId),
                    const Divider(height: 24),
                    _AboutRow(icon: Icons.apple, label: 'iOS Bundle', value: AppConstants.iosBundleId),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.6),
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Our Mission', style: TextStyle(fontWeight: FontWeight.w600)),
                  SizedBox(height: 8),
                  Text('Guftagu means conversation in Urdu. We build a messenger that feels like WhatsApp/Telegram (95% familiar) but adds thoughtful group features: Planning Cards for decisions, curated Spaces for groups, and a lightweight Trivia game. No fake activity, no copied logos.', style: TextStyle(fontSize: 13, height: 1.5)),
                  SizedBox(height: 16),
                  Text('Security Note', style: TextStyle(fontWeight: FontWeight.w600)),
                  SizedBox(height: 8),
                  Text('v1 uses TLS transport encryption + at-rest encryption + authenticated endpoints. End-to-end encryption is NOT yet implemented. Do not use for sensitive conversations until audited E2EE (MLS/Signal) is shipped. See SECURITY.md', style: TextStyle(fontSize: 12, height: 1.4, color: Colors.grey)),
                ]),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Made with ❤️ in Bihar, India', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class _AboutRow extends StatelessWidget {
  final IconData icon; final String label; final String value;
  const _AboutRow({required this.icon, required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 20, color: AppColors.primary),
      const SizedBox(width: 12),
      Text(label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
      const Spacer(),
      Flexible(child: Text(value, style: const TextStyle(fontSize: 13), textAlign: TextAlign.right)),
    ]);
  }
}
