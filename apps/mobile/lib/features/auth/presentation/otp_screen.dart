import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../core/theme/app_colors.dart';

class OtpScreen extends StatefulWidget {
  final String phone;
  const OtpScreen({super.key, required this.phone});
  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _verify() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient.dio.post('/auth/verify-otp', data: {
        'phone': widget.phone,
        'code': _otpController.text.trim(),
        'platform': 'android',
        'deviceName': 'Pixel Emulator',
      });
      final accessToken = res.data['accessToken'] as String;
      final refreshToken = res.data['refreshToken'] as String;
      final userId = res.data['user']?['id'] as String?;
      await SecureStorage.saveTokens(accessToken: accessToken, refreshToken: refreshToken, userId: userId);
      if (mounted) context.go('/chats');
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Enter OTP')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Code sent to ${widget.phone}', style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 16),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: '6-digit code', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loading ? null : _verify,
              style: FilledButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 16)),
              child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Verify & Continue'),
            ),
          ],
        ),
      ),
    );
  }
}
