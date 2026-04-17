import React from 'react';

export default function VenIQLogo({ size = 48, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0px 8px 16px rgba(16, 185, 129, 0.4))' }}
    >
      <defs>
        <linearGradient id="veniq-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064E3B" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="veniq-pin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Stadium Base/Arena Rings */}
      <ellipse cx="50" cy="70" rx="35" ry="12" fill="none" stroke="url(#veniq-grad)" strokeWidth="3" opacity="0.3" />
      <ellipse cx="50" cy="70" rx="25" ry="8" fill="none" stroke="url(#veniq-grad)" strokeWidth="3" opacity="0.6" />
      <ellipse cx="50" cy="70" rx="15" ry="4" fill="url(#veniq-grad)" opacity="0.8" filter="url(#glow)" />

      {/* Futuristic Location Pin */}
      <path 
        d="M50 15 C38 15 30 25 30 38 C30 55 50 78 50 78 C50 78 70 55 70 38 C70 25 62 15 50 15 Z" 
        fill="none" 
        stroke="url(#veniq-pin-grad)" 
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Inner Pin Node */}
      <circle cx="50" cy="38" r="8" fill="#06b6d4" filter="url(#glow)" />
      
      {/* V shape intersecting the center */}
      <path d="M42 32 L50 45 L58 32" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
