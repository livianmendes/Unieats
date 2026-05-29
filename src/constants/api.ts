import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getLanApiUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (!host) {
    return null;
  }

  return `http://${host}:3100/api`;
}

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
  (Platform.OS === 'web' ? 'http://localhost:3100/api' : getLanApiUrl()) ||
  'http://localhost:3100/api';
