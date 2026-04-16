import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from '../../services/firebase';
import { getRedirectResult } from 'firebase/auth';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // BUG FIX: Handle redirect result before starting standard observer
    // This allows the app to know "a login is pending" and stay on loading
    const initAuth = async () => {
      try {
        // STEP 1: Set persistence FIRST (critical for locking in mobile session)
        await setPersistence(auth, browserLocalPersistence);
        
        // STEP 2: Check for redirect result (completes the redirect flow)
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("✅ Mobile redirect login successful:", result.user.email);
          setUser(result.user);
        }
      } catch (e) {
        console.error("❌ Auth initialization error:", e);
      } finally {
        // STEP 3: Start standard observer to maintain session
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        });
        return unsubscribe;
      }
    };

    const unsubPromise = initAuth();
    return () => {
      unsubPromise.then(unsub => unsub && unsub());
    };
  }, []);

  const logout = async () => {
    if (auth) await signOut(auth);
  };

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#080c14', color: '#7f77dd', fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
