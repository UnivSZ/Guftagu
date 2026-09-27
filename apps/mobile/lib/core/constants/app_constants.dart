class AppConstants {
  static const appName = 'Guftagu';
  static const androidAppId = 'com.ruhikreguftagu.saad';
  static const iosBundleId = 'com.ruhikreguftagu.saad';

  // API
  static const defaultApiBaseUrl = 'http://10.0.2.2:3000/api/v1'; // Android emulator
  static const iosSimulatorBaseUrl = 'http://localhost:3000/api/v1';
  static const prodBaseUrl = 'https://api.guftagu.example.com/api/v1'; // placeholder

  static const wsPath = '/ws';

  // Limits
  static const maxImageSize = 10 * 1024 * 1024;
  static const maxVoiceSize = 5 * 1024 * 1024;
  static const maxFileSize = 50 * 1024 * 1024;

  // Pagination
  static const messagesPageSize = 50;

  // Dev
  static const allowDevAuth = true;
  static const devOtp = '000000';

  // Themes
  static const curatedThemes = ['DEFAULT', 'SAFFRON_DUSK', 'MONSOON', 'BAZAAR', 'HIMALAYA', 'PAPER'];
}
