import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, isFirebaseReady, getRedirectResult } from '../../services/firebase';
import VenIQLogo from '../components/VenIQLogo';
import { useAuth } from '../contexts/AuthContext';

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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax effect for background blobs
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle post-redirect authentication
  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth).then((result) => {
      if (result && result.user) {
        forceLogin(result.user);
      }
    }).catch(err => {
      console.error("Redirect auth error:", err);
      // Optional: setError(err.message);
    });
  }, [auth]);

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
        await signInWithRedirect(auth, googleProvider);
      } else {
        const cred = await signInWithPopup(auth, googleProvider);
        if (cred && cred.user) {
          // Immediately redirect to main map screen by overriding state 
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
      <div 
        className="blob blob-1" 
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
      ></div>
      <div 
        className="blob blob-2"
        style={{ transform: `translate(${-mousePos.x * 1.5}px, ${-mousePos.y * 1.5}px)` }}
      ></div>
      <div className="grid-overlay"></div>

      {/* Main Glassmorphic Card */}
      <div className="login-card">
        <div className="login-header">
          <VenIQLogo size={100} className="floating-logo" />
          <h1 className="brand-title">VenIQ</h1>
          <p className="brand-subtitle">The Intelligence Behind The Arena</p>
        </div>

        <div className="login-body">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`google-btn ${loading ? 'loading' : ''}`}
            aria-label="Sign in with Google"
          >
            {loading ? (
              <span className="btn-loading-content">
                <div className="spinner"></div>
                Authenticating...
              </span>
            ) : (
              <span className="btn-content">
                <GoogleIcon /> Continue with Google
              </span>
            )}
            <div className="btn-glow"></div>
          </button>

          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>By signing in, you agree to our <a href="#">Terms of Service</a> & <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </div>
  );
}
