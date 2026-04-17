import React from 'react';
import VenIQLogo from './VenIQLogo';
import { Sparkles } from 'lucide-react';

const SplashScreen = ({ message = "PREPARING YOUR ARENA..." }) => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo-container">
          <VenIQLogo size={120} className="floating-logo" />
          <div className="splash-glow"></div>
        </div>
        
        <h1 className="splash-title">VenIQ</h1>
        <div className="splash-loader">
          <div className="splash-progress"></div>
        </div>
        
        <div className="splash-footer">
          <Sparkles size={16} className="splash-icon-pulse" />
          <span className="splash-message">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
