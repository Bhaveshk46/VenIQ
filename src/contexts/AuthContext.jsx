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

    if (!auth) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Ensure persistence is locked in
        await setPersistence(auth, browserLocalPersistence);

        // Explicit Mobile Check: Only wait for redirect result on mobile to keep desktop flow fast
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          console.log("📱 Mobile initialization: Waiting for redirect result...");
          const result = await getRedirectResult(auth);
          if (result?.user) {
            console.log("✅ Mobile redirect login successful:", result.user.email);
            setUser(result.user);
          }
        }
      } catch (e) {
        console.error("❌ Auth initialization error:", e);
      } finally {
        // ✅ Start observer AFTER redirect handling (on mobile) or immediately (on desktop)
        // By assigning to the outer scope variable, the cleanup function will have access to it
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser ?? null);
          setLoading(false);
        });
      }
    };

    initAuth();

    // ✅ Cleanup properly unsubscribes using the variable in the outer scope
    return () => {
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
