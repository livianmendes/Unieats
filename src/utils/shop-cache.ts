import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONE_HOUR_MS = 60 * 60 * 1000;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;

type CacheRecord<T> = {
  savedAt: number;
  data: T;
};

export const SHOP_CACHE_KEYS = {
  products: 'unieats:cache:products',
  sellers: 'unieats:cache:sellers',
  cart: (userId: string) => `unieats:cache:cart:${userId}`,
  orders: (userId: string, scope: 'buyer' | 'seller') => `unieats:cache:orders:${scope}:${userId}`,
};

export async function getCachedData<T>(key: string, maxAgeMs?: number) {
  const raw = await AsyncStorage.getItem(key);

  if (!raw) {
    return null;
  }

  try {
    const record = JSON.parse(raw) as CacheRecord<T>;
    const isExpired = maxAgeMs ? Date.now() - record.savedAt > maxAgeMs : false;

    if (isExpired) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return record.data;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

export async function setCachedData<T>(key: string, data: T) {
  const record: CacheRecord<T> = {
    savedAt: Date.now(),
    data,
  };

  await AsyncStorage.setItem(key, JSON.stringify(record));
}

export async function removeCachedData(key: string) {
  await AsyncStorage.removeItem(key);
}
