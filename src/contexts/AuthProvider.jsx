import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, bootstrapAuthSession, isMobileUserAgent } from '../../services/firebase';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(!!auth);
  
  const forceLogin = (firebaseUser) => {
    setUser(firebaseUser);
    setInitializing(false);
  };

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    if (!auth) {
      return;
    }

    const initAuth = async () => {
      try {
        const isMobile = isMobileUserAgent();

        // 1. Subscribe to auth changes immediately.
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (!isMounted) return;
          setUser(firebaseUser ?? null);
          
          // On desktop, we can flip initializing as soon as we get the first state.
          // On mobile, we wait for bootstrap (getRedirectResult) to be 100% sure.
          if (!isMobile) {
            setInitializing(false);
          }
        });

        // 2. Bootstrap auth (checks redirect results). 
        // This is the critical "anchor" for mobile login stability.
        const bootstrapUser = await bootstrapAuthSession();
        
        if (isMounted) {
          if (bootstrapUser) {
            setUser(bootstrapUser);
          }
          // NOW we can finally say we're initialized on mobile.
          setInitializing(false);
        }
      } catch (e) {
        console.error("❌ Auth initialization error:", e);
        if (isMounted) setInitializing(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const logout = async () => {
    if (auth) {
      setInitializing(true);
      await signOut(auth);
      setInitializing(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, initializing, logout, forceLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
