import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, bootstrapAuthSession } from '../../services/firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    let isMounted = true;

    if (!auth) {
      return;
    }

    const initAuth = async () => {
      try {
        // Subscribe immediately. UI is never blocked by auth bootstrap.
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (!isMounted) return;
          setUser(firebaseUser ?? null);
        });

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
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const logout = async () => {
    if (auth) await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
