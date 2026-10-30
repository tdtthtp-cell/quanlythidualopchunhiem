import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'class_config'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using cache or retry.');
    }
    return false;
  }
}
