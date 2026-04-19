import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, isFirebaseReady } from '../../services/firebase';
import VenIQLogo from '../components/VenIQLogo';
import { useAuth } from '../hooks/useAuth';

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginScreen() {
  const { forceLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parallax effect removed to improve performance/cleanliness

  // Note: Redirect results are now handled centrally in AuthContext/firebase.js
  // to prevent race conditions and ensure reliable session restoration on mobile.


  const handleGoogleLogin = async () => {
    setError('');
    
    if (!auth || !isFirebaseReady) {
      setError('Firebase is not initialized. Please ensure environment variables are correctly set.');
      return;
    }

    setLoading(true);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
      if (isMobile) {
        // Attempt popup first on mobile. Many modern mobile browsers handle it fine 
        // and it avoids the domain-mismatch "loop" issues of redirects.
        try {
          const cred = await signInWithPopup(auth, googleProvider);
          if (cred && cred.user) {
            forceLogin(cred.user);
            return;
          }
        } catch (popupErr) {
          console.warn("Mobile popup blocked or failed, falling back to redirect:", popupErr);
          // Only fallback to redirect if popup was actually blocked or failed
          await signInWithRedirect(auth, googleProvider);
        }
      } else {
        const cred = await signInWithPopup(auth, googleProvider);
        if (cred && cred.user) {
          forceLogin(cred.user);
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      if (!auth) {
        setError('Configuration error: Auth service is missing.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked! Trying redirect instead...');
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirErr) {
          setError(`Sign-in failed: ${redirErr.message}`);
        }
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError(`Sign-in failed: ${err.message || 'Please check your connection.'}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Dynamic Animated Background */}
      <div className="blob blob-1" style={{ background: 'radial-gradient(circle, #064E3B 0%, rgba(6, 78, 59, 0) 70%)' }}></div>
      <div className="blob blob-2" style={{ background: 'radial-gradient(circle, #10B981 0%, rgba(16, 185, 129, 0) 70%)' }}></div>
      <div className="grid-overlay" style={{ opacity: 0.1 }}></div>
      <div className="arena-texture"></div>

      {/* Main Glassmorphic Card */}
      <div className="login-card" style={{ border: '2px solid rgba(16, 185, 129, 0.1)', borderRadius: '12px', background: 'rgba(8, 12, 20, 0.85)' }}>
        <div className="login-header">
          <VenIQLogo size={100} className="floating-logo" />
          <h1 className="brand-title" style={{ fontSize: '3.5rem', fontStyle: 'italic', fontWeight: '900', color: '#fff', background: 'none', WebkitTextFillColor: 'initial' }}>
            Ven<span style={{ color: '#10B981' }}>IQ</span>
          </h1>
          <p className="brand-subtitle" style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', color: '#10B981' }}>Arena Access Restricted</p>
        </div>

        <div className="login-body">
          <button 
            className={`google-btn ${loading ? 'loading' : ''}`}
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{ background: '#10B981', borderRadius: '4px', border: 'none', height: '60px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="btn-scan"></div>
            <div className="btn-glow" style={{ background: 'linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.4), transparent)' }}></div>
            {loading ? (
              <div className="btn-loading-content">
                <div className="spinner" style={{ borderTopColor: '#000' }}></div>
                <span style={{ color: '#000' }}>VALIDATING PASS...</span>
              </div>
            ) : (
              <div className="btn-content" style={{ gap: '12px', color: '#000' }}>
                <GoogleIcon />
                <span style={{ fontSize: '0.9rem', letterSpacing: '1px', fontWeight: '900' }}>GET ARENA PASS</span>
              </div>
            )}
          </button>

          {error && (
            <div className="error-message">
              <span>SYSTEM ERROR: {error}</span>
            </div>
          )}
        </div>

        <div className="login-footer" style={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>
          By entering, you agree to the <a href="#" style={{ color: '#10B981' }}>Arena Code of Conduct</a>
        </div>
      </div>
    </div>
  );
}
