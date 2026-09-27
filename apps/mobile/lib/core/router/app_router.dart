import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/chats/presentation/chat_list_screen.dart';
import '../../features/chats/presentation/chat_screen.dart';
import '../../features/spaces/presentation/spaces_screen.dart';
import '../../features/calls/presentation/calls_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/settings/presentation/about_screen.dart';
import '../../features/groups/presentation/group_details_screen.dart';
import '../../features/plans/presentation/plans_screen.dart';
import '../../features/trivia/presentation/trivia_screen.dart';
import '../../shared/widgets/shell_scaffold.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(path: '/login', builder: (c, s) => const LoginScreen()),
      GoRoute(path: '/otp', builder: (c, s) {
        final phone = s.extra as String? ?? '';
        return OtpScreen(phone: phone);
      }),
      ShellRoute(
        builder: (context, state, child) => ShellScaffold(child: child),
        routes: [
          GoRoute(path: '/chats', builder: (c, s) => const ChatListScreen()),
          GoRoute(path: '/spaces', builder: (c, s) => const SpacesScreen()),
          GoRoute(path: '/calls', builder: (c, s) => const CallsScreen()),
          GoRoute(path: '/settings', builder: (c, s) => const SettingsScreen()),
        ],
      ),
      GoRoute(path: '/chats/:id', builder: (c, s) {
        final id = s.pathParameters['id']!;
        return ChatScreen(conversationId: id);
      }),
      GoRoute(path: '/groups/:id', builder: (c, s) => GroupDetailsScreen(conversationId: s.pathParameters['id']!)),
      GoRoute(path: '/groups/:id/plans', builder: (c, s) => PlansScreen(conversationId: s.pathParameters['id']!)),
      GoRoute(path: '/groups/:id/trivia/:sessionId', builder: (c, s) => TriviaScreen(conversationId: s.pathParameters['id']!, sessionId: s.pathParameters['sessionId']!)),
      GoRoute(path: '/about', builder: (c, s) => const AboutScreen()),
    ],
  );
});
