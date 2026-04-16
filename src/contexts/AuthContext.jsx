import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut } from '../../services/firebase';
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
        // Wait for potential redirect result
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Logged in via redirect:", result.user.email);
          setUser(result.user);
        }
      } catch (e) {
        console.error("Redirect login error:", e);
        // Explicitly handle common redirect errors
        if (e.code === 'auth/account-exists-with-different-credential') {
          alert("An account already exists with the same email address but different sign-in credentials.");
        }
      } finally {
        // Only after redirect check, start the observer
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
