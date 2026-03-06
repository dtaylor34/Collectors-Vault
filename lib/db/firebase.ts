import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, onAuthStateChanged, type User,
} from 'firebase/auth';
import {
  getStorage, ref, uploadBytes, getDownloadURL,
} from 'firebase/storage';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'radstash-61837.firebaseapp.com',
  projectId: Constants.expoConfig?.extra?.firebaseProjectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'radstash-61837',
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'radstash-61837.appspot.com',
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const storage = getStorage(app);

// ── Auth helpers ────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  await fbSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ── Storage helpers ─────────────────────────────────────────────

export async function uploadItemPhoto(
  userId: string,
  itemId: string,
  blob: Blob
): Promise<string> {
  const path = `items/${userId}/${itemId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function uploadProfilePhoto(
  userId: string,
  blob: Blob
): Promise<string> {
  const path = `profiles/${userId}_${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

// Strip EXIF before upload (called client-side)
export function stripExif(base64: string): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, 1200);
      canvas.height = Math.min(img.height, 1200 * (img.height / img.width));
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/jpeg',
        0.85
      );
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}
