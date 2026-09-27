import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  static final Dio dio = Dio(BaseOptions(
    baseUrl: _resolveBaseUrl(),
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    headers: {'Content-Type': 'application/json'},
  ))..interceptors.addAll([
      LogInterceptor(requestBody: true, responseBody: false),
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await SecureStorage.getAccessToken();
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
          return handler.next(options);
        },
        onError: (e, handler) async {
          if (e.response?.statusCode == 401) {
            // Try refresh
            final refreshToken = await SecureStorage.getRefreshToken();
            if (refreshToken != null) {
              try {
                final refreshDio = Dio(BaseOptions(baseUrl: _resolveBaseUrl()));
                final res = await refreshDio.post('/auth/refresh', data: {'refreshToken': refreshToken});
                final newAccess = res.data['accessToken'] as String;
                final newRefresh = res.data['refreshToken'] as String;
                final userId = res.data['user']?['id'] as String?;
                await SecureStorage.saveTokens(accessToken: newAccess, refreshToken: newRefresh, userId: userId);
                e.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
                final cloned = await Dio().fetch(e.requestOptions);
                return handler.resolve(cloned);
              } catch (_) {
                await SecureStorage.clear();
              }
            }
          }
          return handler.next(e);
        },
      ),
    ]);

  static String _resolveBaseUrl() {
    // In real app, use flavor / env
    const env = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (env.isNotEmpty) return env;
    return AppConstants.defaultApiBaseUrl;
  }
}
