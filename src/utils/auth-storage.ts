import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'unieats:token';

function getTokenKey() {
  if (typeof window === 'undefined') {
    return TOKEN_KEY;
  }

  const queryScope = new URLSearchParams(window.location.search).get('phone');
  const frameScope = window.name?.startsWith('unieats-')
    ? window.name.replace(/^unieats-/, '')
    : '';
  const scope = queryScope || frameScope;

  if (!scope || !/^[a-z0-9_-]{1,32}$/i.test(scope)) {
    return TOKEN_KEY;
  }

  return `${TOKEN_KEY}:${scope}`;
}

export async function getStoredToken() {
  return AsyncStorage.getItem(getTokenKey());
}

export async function setStoredToken(token: string) {
  await AsyncStorage.setItem(getTokenKey(), token);
}

export async function removeStoredToken() {
  await AsyncStorage.removeItem(getTokenKey());
}
