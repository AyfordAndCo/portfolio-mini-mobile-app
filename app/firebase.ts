import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import {
  firebaseConfig,
  isFirebaseConfigured,
  missingFirebaseConfigKeys,
} from './firebaseConfig';

export { isFirebaseConfigured, missingFirebaseConfigKeys };

const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig as FirebaseOptions)
  : null;

function createAuth(): Auth | null {
  if (!isFirebaseConfigured) {
    return null;
  }

  return getAuth(firebaseApp!);
}

function createDb(): Firestore | null {
  if (!isFirebaseConfigured) {
    return null;
  }

  return getFirestore(firebaseApp!);
}

export const auth = createAuth();
export const db = createDb();
