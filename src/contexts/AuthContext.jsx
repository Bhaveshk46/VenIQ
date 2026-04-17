import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, bootstrapAuthSession } from '../../services/firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still initializing
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;
    let loadingTimeout = null;

    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      // Never block the app forever on mobile/browser edge cases.
      loadingTimeout = window.setTimeout(() => {
        if (!isMounted) return;
        console.warn("⏱️ Auth init timeout reached. Showing login screen fallback.");
        setUser((prev) => (prev === undefined ? null : prev));
        setLoading(false);
      }, 5000);

      // Subscribe first so UI can unblock quickly even if redirect resolution is slow on mobile.
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) return;
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
        setUser(firebaseUser ?? null);
        setLoading(false);
      });

      try {
        // Bootstrap auth in the background; never block initial UI.
        const bootstrapUser = await bootstrapAuthSession();
        if (isMounted && bootstrapUser) {
          setUser(bootstrapUser);
        }
      } catch (e) {
        console.error("❌ Auth initialization error:", e);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      if (unsubscribe) unsubscribe();
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
