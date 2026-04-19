import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, get } from 'firebase/database';
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

const MOBILE_REDIRECT_TIMEOUT_MS = 5000;

const getFirebaseEnv = (viteKey, expoKey) => {
  const value = import.meta.env[viteKey] || import.meta.env[expoKey];
  return typeof value === 'string' ? value.trim() : value;
};

const firebaseConfig = {
  apiKey: getFirebaseEnv('VITE_FIREBASE_API_KEY', 'EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getFirebaseEnv('VITE_FIREBASE_AUTH_DOMAIN', 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getFirebaseEnv('VITE_FIREBASE_DATABASE_URL', 'EXPO_PUBLIC_FIREBASE_DATABASE_URL'),
  projectId: getFirebaseEnv('VITE_FIREBASE_PROJECT_ID', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let authBootstrapPromise = null;

const isPlaceholder = (val) => !val || val === 'replace_in_gcp_console' || val.includes('your_');

if (
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.authDomain &&
  !isPlaceholder(firebaseConfig.apiKey)
) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getDatabase(firebaseApp);
  } catch {
    // Silent fail for production security compliance
  }
}

export const app = firebaseApp;
export const auth = firebaseAuth;
export const db = firebaseDb;
export const isFirebaseReady = Boolean(app && auth && db);

export const isMobileUserAgent = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => {
        resolve(null);
      }, timeoutMs);
    }),
  ]);

export const bootstrapAuthSession = async () => {
  if (!auth) return null;
  if (authBootstrapPromise) return authBootstrapPromise;

  authBootstrapPromise = (async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (isMobileUserAgent()) {
        await withTimeout(getRedirectResult(auth), MOBILE_REDIRECT_TIMEOUT_MS * 2);
      }
    } catch {
      // Intentionally silent
    }
    return auth.currentUser ?? null;
  })();

  return authBootstrapPromise;
};

export const crowdLevelsRef = db ? ref(db, 'crowdLevels') : null;
export const matchRef = db ? ref(db, 'match') : null;
export const feedRef = db ? ref(db, 'feed') : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { 
  set, 
  ref, 
  get, 
  onValue, 
  push, 
  signOut, 
  onAuthStateChanged, 
  signInWithPopup, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect,
  getRedirectResult
};
