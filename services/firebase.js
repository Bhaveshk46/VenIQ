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
  browserLocalPersistence
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_PROJECT_ID ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` : undefined,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

// Initialize Firebase services with descriptive diagnostics to help debug deployment (Cloud Run)
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

const isPlaceholder = (val) => !val || val === 'replace_in_gcp_console' || val.includes('your_');

if (firebaseConfig.apiKey && firebaseConfig.projectId && !isPlaceholder(firebaseConfig.apiKey)) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getDatabase(firebaseApp);
    
    // Set persistence (async, fire-and-forget)
    setPersistence(firebaseAuth, browserLocalPersistence).catch(err => console.error("Firebase persistence error:", err));
    console.log("Firebase services initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.group("Firebase Configuration Diagnostics");
  console.warn("Firebase was not initialized. Check your environment variables.");
  console.table({
    "VITE_FIREBASE_API_KEY": firebaseConfig.apiKey ? (isPlaceholder(firebaseConfig.apiKey) ? "MISSING (Placeholder detected)" : "Present") : "MISSING",
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

export const crowdLevelsRef = db ? ref(db, 'crowdLevels') : null;
export const matchRef = db ? ref(db, 'match') : null;
export const feedRef = db ? ref(db, 'feed') : null;

export const googleProvider = new GoogleAuthProvider();
export { set, ref, get, onValue, push, signOut, onAuthStateChanged, signInWithPopup, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink };
