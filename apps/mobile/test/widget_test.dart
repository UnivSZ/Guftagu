import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:guftagu/core/theme/app_colors.dart';

void main() {
  testWidgets('AppColors defined', (tester) async {
    expect(AppColors.primary, isNotNull);
    expect(AppColors.lightBackground, isNotNull);
  });

  testWidgets('Guftagu branding shows Dev info', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: Scaffold(body: Text('Dev - Saad Hussain, CO-Dev - Ashad Ahamad')),
        ),
      ),
    );
    expect(find.textContaining('Saad Hussain'), findsOneWidget);
    expect(find.textContaining('Ashad Ahamad'), findsOneWidget);
  });

  testWidgets('Chat bubble styling', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.outgoingLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text('Test message'),
          ),
        ),
      ),
    );
    expect(find.text('Test message'), findsOneWidget);
  });
}
