// Firebase has been temporarily removed.
// All exports are mocked to allow the app to function without it.

export const app = {};
export const auth = {};
export const db = {};
export const isFirebaseReady = true;
export const firebaseDiagnostics = { mode: 'mock' };

export const bootstrapAuthSession = async () => ({
  uid: 'mock-user-123',
  displayName: 'Mock User',
  email: 'mock@example.com'
});

export const crowdLevelsRef = 'crowdLevels';
export const matchRef = 'match';
export const feedRef = 'feed';

export const googleProvider = {};

export const set = async () => {};
export const ref = () => {};
export const get = async () => ({ val: () => null });
export const push = async () => {};
export const signOut = async () => {};

export const onAuthStateChanged = (auth, cb) => {
  cb({
    uid: 'mock-user-123',
    displayName: 'Mock User',
    email: 'mock@example.com'
  });
  return () => {}; // Unsubscribe function
};

export const signInWithPopup = async () => {};
export const sendSignInLinkToEmail = async () => {};
export const isSignInWithEmailLink = () => false;
export const signInWithEmailLink = async () => {};
export const setPersistence = async () => {};
export const browserLocalPersistence = {};
export const signInWithRedirect = async () => {};

// Mock onValue to provide static local data
export const onValue = (refPath, cb) => {
  if (refPath === 'crowdLevels') {
    cb({ val: () => ({ block_a: 'green', block_b: 'green', block_c: 'green', block_d: 'amber', block_e: 'green', block_f: 'red', block_g: 'green', block_h: 'green', shops_north: 'red', shops_south: 'amber', rest_w: 'green', rest_e: 'green', gate_north: 'amber', gate_south: 'green', first_aid: 'green', first_aid_2: 'green', merch: 'amber' }) });
  } else if (refPath === 'match') {
    cb({ val: () => ({ time: 25, status: '1st Half' }) });
  } else if (refPath === 'feed') {
    cb({ val: () => ({ 'item_1': { text: 'Welcome to Stadium Live Updates. We keep you informed.', timeLabel: 'Now', timestamp: Date.now() } }) });
  }
  return () => {}; // return unsubscribe fn
};

