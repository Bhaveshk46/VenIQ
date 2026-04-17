import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, isFirebaseReady } from '../../services/firebase';
import VenIQLogo from '../components/VenIQLogo';

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    
    if (!auth || !isFirebaseReady) {
      setError('Firebase is not initialized. If you are on the live site, please ensure that your environment variables (VITE_FIREBASE_API_KEY, etc.) are correctly set in the Google Cloud dashboard.');
      return;
    }

    setLoading(true);

    // Check if the user is on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
      if (isMobile) {
        console.log("Mobile device detected, using redirect flow");
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.log("Desktop device detected, using popup flow");
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err) {
      console.error("Auth error:", err);
      // Ensure we catch the specific case where signInWithPopup/Redirect might be passed a null auth
      if (!auth) {
        setError('Configuration error: Auth service is missing.');
        setLoading(false);
        return;
      }
      
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked! Trying redirect instead...');
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirErr) {
          setError(`Sign-in failed: ${redirErr.message}`);
          setLoading(false);
        }
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
        setLoading(false);
      } else {
        setError(`Sign-in failed: ${err.message || 'Please check your connection.'}`);
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#080c14', flexDirection: 'column', gap: '20px'
      }}>
        <VenIQLogo size={60} className="floating-logo" />
        <div style={{ color: '#64748b', fontFamily: 'Outfit, sans-serif' }}>Securing Session...</div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080c14', padding: '24px'
    }}>
      <div style={{
        background: 'rgba(17, 24, 39, 0.7)', backdropFilter: 'blur(16px)',
        borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)',
        padding: '48px 32px', maxWidth: '380px', width: '100%',
        textAlign: 'center', animation: 'fadeIn 0.5s ease-out',
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)'
      }}>
        {/* New Animated SVG Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <VenIQLogo size={90} className="floating-logo" />
        </div>

        <h1 style={{
          margin: '0 0 8px', fontSize: '2rem', fontFamily: 'Outfit, sans-serif',
          background: 'linear-gradient(135deg, #fff 0%, #a39dfa 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>VenIQ</h1>

        <p style={{ color: '#64748b', margin: '0 0 40px', fontSize: '0.95rem' }}>
          Smart Stadium Navigation
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          aria-label="Sign in with Google"
          style={{
            width: '100%', padding: '16px 20px', borderRadius: '16px',
            background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
            color: '#0f172a', fontWeight: '700', fontSize: '1.05rem',
            border: '1px solid rgba(255,255,255,1)', cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.4)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: loading ? 'scale(0.98)' : 'scale(1)',
          }}
          onMouseEnter={(e) => { 
            if (!loading) { 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
              e.currentTarget.style.boxShadow = '0 20px 30px -10px rgba(0,0,0,0.5), 0 10px 15px -10px rgba(0,0,0,0.5)';
              e.currentTarget.style.filter = 'brightness(1.02)';
            } 
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.transform = 'translateY(0)'; 
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.4)';
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          {loading ? (
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid #cbd5e1', borderTopColor: '#7f77dd', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              Authenticating...
            </span>
          ) : (
            <><GoogleIcon /> Continue with Google</>
          )}
        </button>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '16px' }}>{error}</p>
        )}

        <p style={{ color: '#334155', fontSize: '0.78rem', marginTop: '24px' }}>
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
