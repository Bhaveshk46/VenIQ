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

// Initialize Firebase services with descriptive diagnostics to help debug deployment (Cloud Run)
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseInitError = null;
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
    
    console.log("Firebase services initialized successfully");
  } catch (error) {
    firebaseInitError = error;
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.group("Firebase Configuration Diagnostics");
  console.warn("Firebase was not initialized. Check your environment variables.");
  console.table({
    "VITE_FIREBASE_API_KEY": firebaseConfig.apiKey ? (isPlaceholder(firebaseConfig.apiKey) ? "MISSING (Placeholder detected)" : "Present") : "MISSING",
    "VITE/EXPO FIREBASE_AUTH_DOMAIN": firebaseConfig.authDomain ? "Present" : "MISSING",
    "VITE_FIREBASE_PROJECT_ID": firebaseConfig.projectId ? (isPlaceholder(firebaseConfig.projectId) ? "MISSING (Placeholder detected)" : "Present") : "MISSING",
    "VITE_FIREBASE_DATABASE_URL": firebaseConfig.databaseURL ? "Present" : "MISSING",
    "Environment": import.meta.env.MODE
  });
  console.info("Note: If deploying to Cloud Run, ensure these are added in the Build Triggers variables section.");
  console.groupEnd();
}

export const app = firebaseApp;
export const auth = firebaseAuth;
export const db = firebaseDb;
export const isFirebaseReady = Boolean(app && auth && db);
export const firebaseDiagnostics = {
  mode: import.meta.env.MODE,
  hasApiKey: Boolean(firebaseConfig.apiKey),
  hasAuthDomain: Boolean(firebaseConfig.authDomain),
  hasDatabaseURL: Boolean(firebaseConfig.databaseURL),
  hasProjectId: Boolean(firebaseConfig.projectId),
  initError: firebaseInitError ? String(firebaseInitError?.message || firebaseInitError) : null,
};

export const isMobileUserAgent = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const withTimeout = (promise, timeoutMs) =>
  Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => {
        console.warn(`Auth bootstrap timed out after ${timeoutMs}ms.`);
        resolve(null);
      }, timeoutMs);
    }),
  ]);

export const bootstrapAuthSession = async () => {
  if (!auth) return null;
  if (authBootstrapPromise) return authBootstrapPromise;

  authBootstrapPromise = (async () => {
    try {
      // Ensure persistence is set BEFORE checking redirect results
      await setPersistence(auth, browserLocalPersistence);

      if (isMobileUserAgent()) {
        console.log("📱 Mobile device detected, checking redirect results...");
        // Increased timeout for mobile redirect handling to ensure slow connections don't drop state
        await withTimeout(getRedirectResult(auth), MOBILE_REDIRECT_TIMEOUT_MS * 2);
      }
    } catch (error) {
      console.error("❌ Auth bootstrap failed:", error);
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("✅ Auth session restored for:", currentUser.email);
    }
    return currentUser ?? null;
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
