import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from '../../services/firebase';
import { getRedirectResult } from 'firebase/auth';

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

    if (!auth) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      // Subscribe first so UI can unblock quickly even if redirect resolution is slow on mobile.
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isMounted) return;
        setUser(firebaseUser ?? null);
        setLoading(false);
      });

      try {
        // Keep session across refreshes/reloads.
        await setPersistence(auth, browserLocalPersistence);

        // Resolve redirect result only on mobile, but do not block initial render.
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
          console.log("📱 Mobile initialization: resolving redirect result");
          const result = await getRedirectResult(auth);
          if (isMounted && result?.user) {
            console.log("✅ Mobile redirect login successful:", result.user.email);
            setUser(result.user);
          }
        }
      } catch (e) {
        console.error("❌ Auth initialization error:", e);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
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
