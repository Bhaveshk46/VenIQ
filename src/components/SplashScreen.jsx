import React from 'react';
import VenIQLogo from './VenIQLogo';
import { Sparkles } from 'lucide-react';

const SplashScreen = ({ message = "ENTERING THE ARENA..." }) => {
  return (
    <div className="splash-screen">
      <div className="arena-texture"></div>
      <div className="splash-content" style={{ zIndex: 10 }}>
        <div className="splash-logo-container">
          <VenIQLogo size={140} className="floating-logo" />
          <div className="splash-glow" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)' }}></div>
        </div>
        
        <h1 className="splash-title" style={{ color: '#10B981', fontSize: '3.5rem', fontWeight: '900', fontStyle: 'italic', letterSpacing: '4px', textShadow: '0 0 40px rgba(16,185,129,0.4)' }}>VenIQ</h1>
        
        <div className="splash-loader" style={{ height: '4px', width: '240px', background: 'rgba(255,255,255,0.05)', borderRadius: '0' }}>
          <div className="splash-progress" style={{ background: 'linear-gradient(90deg, transparent, #10B981, transparent)', height: '100%' }}></div>
        </div>
        
        <div className="splash-footer" style={{ color: '#10B981', opacity: 0.8 }}>
          <Sparkles size={18} className="splash-icon-pulse" />
          <span className="splash-message" style={{ fontWeight: '900', fontSize: '0.85rem' }}>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
