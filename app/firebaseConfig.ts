export interface PublicFirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const firebaseConfig: PublicFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export type RequiredFirebaseConfigKey =
  | 'EXPO_PUBLIC_FIREBASE_API_KEY'
  | 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'
  | 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'
  | 'EXPO_PUBLIC_FIREBASE_APP_ID';

interface RequiredFirebaseConfigEntry {
  envKey: RequiredFirebaseConfigKey;
  value?: string;
}

const requiredConfigEntries = [
  {
    envKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
    value: firebaseConfig.apiKey,
  },
  {
    envKey: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    value: firebaseConfig.authDomain,
  },
  {
    envKey: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    value: firebaseConfig.projectId,
  },
  {
    envKey: 'EXPO_PUBLIC_FIREBASE_APP_ID',
    value: firebaseConfig.appId,
  },
] as const satisfies readonly RequiredFirebaseConfigEntry[];

export function getMissingFirebaseConfigKeys(
  entries: readonly RequiredFirebaseConfigEntry[] = requiredConfigEntries,
): RequiredFirebaseConfigKey[] {
  return entries
    .filter(({ value }) => !value)
    .map(({ envKey }) => envKey);
}

export const missingFirebaseConfigKeys = getMissingFirebaseConfigKeys();

export const isFirebaseConfigured = missingFirebaseConfigKeys.length === 0;
