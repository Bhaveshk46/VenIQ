import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, bootstrapAuthSession } from '../../services/firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  
  const forceLogin = (firebaseUser) => {
    setUser(firebaseUser);
    setInitializing(false);
  };

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    if (!auth) {
      setInitializing(false);
      return;
    }

    const initAuth = async () => {
      try {
        // Subscribe immediately.
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (!isMounted) return;
          setUser(firebaseUser ?? null);
          setInitializing(false);
        });

        // Bootstrap auth in the background.
        const bootstrapUser = await bootstrapAuthSession();
        if (isMounted && bootstrapUser) {
          setUser(bootstrapUser);
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
