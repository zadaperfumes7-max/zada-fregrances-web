import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Get Firestore - CRITICAL: Must use firestoreDatabaseId from config
const dbId = firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId;
console.log('[Firebase] Initializing Firestore with Database ID:', dbId || 'default (undefined)');
export const db = getFirestore(app, dbId as any);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection Test
async function testConnection() {
  try {
    // Attempt to read a dummy doc to verify connection and config
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
    console.log('[Firebase] Connection test triggered (may fail with permissions, but config is valid)');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("[Firebase] Connection failed: Please check your Firebase configuration or network.");
    }
  }
}
testConnection();

// Auth Helpers
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  const errInfo = {
    error: errMessage,
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    errorStack: error instanceof Error ? error.stack : undefined
  };

  console.error('[Firestore Error Details]', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
