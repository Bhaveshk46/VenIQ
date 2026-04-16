import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { onValue } from 'firebase/database';
import { crowdLevelsRef, matchRef } from '../../services/firebase';
import { VENUE_LOCATIONS } from '../../utils/directions';
import ZoneBottomSheet from '../components/ZoneBottomSheet';
import { useAuth } from '../contexts/AuthContext';
import { useStadium } from '../contexts/StadiumContext';

// Memoized Marker Component for Performance (Efficiency) & Accessibility
const MapMarker = memo(({ zone, color, onClick }) => (
  <div 
    onClick={() => onClick(zone)} 
    role="button"
    aria-label={`${zone.name || zone.id}, Capacity: ${zone.level || 'Normal'}`}
    style={{ 
      position: 'absolute', top: `${zone.top}%`, left: `${zone.left}%`, 
      transform: 'translate(-50%, -50%)', width: '22px', height: '22px', 
      borderRadius: '50%', backgroundColor: color, border: '2px solid white', 
      boxShadow: `0 0 10px ${color}`, cursor: 'pointer', zIndex: 20 
    }}
  >
    <div style={{ 
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
      borderRadius: '50%', background: 'inherit', animation: 'fadeIn 1.5s infinite alternate', 
      opacity: 0.5 
    }} />
  </div>
));

export default function MapScreen() {
  const { user, logout } = useAuth();
  const { setSelectedZone: setContextZone, setMatchData: setContextMatch, setCrowdLevels: setContextCrowd } = useStadium();
  const location = useLocation();
  const navigate = useNavigate();
  const [crowdLevels, setCrowdLevels] = useState({});
  const [matchData, setMatchData] = useState({ time: 0, status: 'Pre-match' });
  const [selectedZone, setSelectedZone] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [highlightSeat, setHighlightSeat] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => { setContextZone(selectedZone); }, [selectedZone, setContextZone]);
  useEffect(() => { setContextMatch(matchData); }, [matchData, setContextMatch]);
  useEffect(() => { setContextCrowd(crowdLevels); }, [crowdLevels, setContextCrowd]);

  const handleMarkerClick = useCallback((zone) => {
    setSelectedZone(zone);
  }, []);

  const handleFilterClick = useCallback((id) => {
    setActiveFilter(id);
  }, []);

  useEffect(() => {
    if (selectedZone) setHasScrolled(false);
  }, [selectedZone]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SECTOR_ANGLES = useMemo(() => ({
    block_a: { start: -22.5, end: 22.5 },
    block_b: { start: 22.5, end: 67.5 },
    block_c: { start: 67.5, end: 112.5 },
    block_d: { start: 112.5, end: 157.5 },
    block_e: { start: 157.5, end: 202.5 },
    block_f: { start: 202.5, end: 247.5 },
    block_g: { start: 247.5, end: 292.5 },
    block_h: { start: 292.5, end: 337.5 },
  }), []);

  useEffect(() => {
    const unsubCrowd = onValue(crowdLevelsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setCrowdLevels(data);
    });
    const unsubMatch = onValue(matchRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setMatchData(data);
    });
    return () => { unsubCrowd(); unsubMatch(); };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const seatId = searchParams.get('seat');
    if (seatId) {
      const parts = seatId.split('-');
      if (parts.length === 3) {
        const blockName = `block_${parts[0].toLowerCase()}`;
        const tierRow = parseInt(parts[1], 10);
        let tierId = tierRow > 30 ? 'vip' : tierRow > 15 ? 'club' : 'lower';
        if (VENUE_LOCATIONS[blockName]) {
          setSelectedZone({ id: blockName, ...VENUE_LOCATIONS[blockName], level: crowdLevels[blockName] || 'green' });
          setHighlightSeat({ blockCode: parts[0], rowName: `${parts[0]}${parts[1]}`, seatNo: parseInt(parts[2], 10), tierId });
        }
      }
      navigate('/', { replace: true });
    }
  }, [location.search, navigate]);

  const getMarkerColor = (type) => {
    switch (type) {
      case 'gate': return '#3b82f6';
      case 'food': return '#f59e0b';
      case 'restroom': return '#8b5cf6';
      case 'aid': return '#ef4444';
      case 'merch': return '#ec4899';
      case 'seat': return '#10b981';
      default: return '#7f77dd';
    }
  };

  const zones = useMemo(() => {
    return Object.keys(VENUE_LOCATIONS)
      .filter(id => activeFilter === 'all' || VENUE_LOCATIONS[id].type === activeFilter)
      .map(id => ({ id, ...VENUE_LOCATIONS[id], level: crowdLevels[id] || 'green' }));
  }, [activeFilter, crowdLevels]);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }} className="animate-fade-in">
      
      {/* Header */}
      <div style={{ margin: 'calc(env(safe-area-inset-top, 0px) + 4px) 12px 0 12px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(17, 24, 39, 0.9)', backdropFilter: 'blur(15px)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: '800', letterSpacing: '0.5px' }}>STADIUM MAP</h1>
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#6ee7b7' }}>LIVE • {matchData?.status || 'Pre-match'}</p>
        </div>
        <div ref={profileRef}>
          <button onClick={() => setProfileOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #7f77dd, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>{(user?.displayName || 'U')[0].toUpperCase()}</div>
          </button>
          {profileOpen && (
            <div style={{ position: 'absolute', top: '48px', right: 0, background: 'rgba(17,24,39,1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '8px', minWidth: '180px', zIndex: 100 }}>
              <button onClick={() => { setProfileOpen(false); logout(); }} style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: '600', textAlign: 'left', cursor: 'pointer' }}>Sign Out</button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div 
        style={{ display: 'flex', overflowX: 'auto', gap: '8px', padding: '10px 16px 4px 16px', flexShrink: 0 }}
        role="tablist"
        aria-label="Stadium filters"
      >
        {['all', 'food', 'restroom', 'seat', 'gate', 'aid', 'merch'].map(id => (
            <button 
              key={id} 
              onClick={() => handleFilterClick(id)} 
              role="tab"
              aria-selected={activeFilter === id}
              aria-label={`Filter by ${id}`}
              style={{ 
                padding: '10px 20px', borderRadius: '40px', 
                background: activeFilter === id ? 'linear-gradient(135deg, #7f77dd, #635ac7)' : 'rgba(255,255,255,0.06)', 
                color: activeFilter === id ? 'white' : '#94a3b8', 
                border: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', 
                fontSize: '0.85rem', whiteSpace: 'nowrap',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: `scale(${activeFilter === id ? 1.05 : 1})`,
                boxShadow: activeFilter === id ? '0 4px 15px rgba(127,119,221,0.3)' : 'none'
              }}
              onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onPointerUp={(e) => e.currentTarget.style.transform = `scale(${activeFilter === id ? 1.05 : 1})`}
            >
              {id.toUpperCase()}
            </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div 
        className="dual-mode-container" 
        onScrollCapture={() => setHasScrolled(true)} 
        onTouchMove={() => setHasScrolled(true)} 
        onWheel={() => setHasScrolled(true)}
      >
        
        {/* Map Container */}
        <div className="map-section" style={{ flexDirection: 'column' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 'calc(100vh - 220px)', aspectRatio: '1/1' }}>
            <img 
              src="https://storage.googleapis.com/veniq-assets/stadium_map.png" 
              alt="Wankhede Stadium Map Layout" 
              style={{ width: '100%', height: '100%', opacity: 0.85 }} 
            />
            {zones.map((zone) => (
              <MapMarker 
                key={zone.id} 
                zone={zone} 
                color={getMarkerColor(zone.type)} 
                onClick={handleMarkerClick} 
              />
            ))}
          </div>

        {/* Legend Ribbon */}
        {!selectedZone && (
          <div style={{ padding: '0 16px 24px', display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
            <div 
              role="complementary"
              aria-label="Map color legend"
              style={{ 
                display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 16px', 
                padding: '12px 20px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)', 
                borderRadius: '100px', border: '1px solid rgba(255,255,255,0.12)', 
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxWidth: '100%' 
              }}
            >
              {[
                { color: '#3b82f6', label: 'Gates' },
                { color: '#f59e0b', label: 'Food' },
                { color: '#8b5cf6', label: 'Restrooms' },
                { color: '#ef4444', label: 'Medical' },
                { color: '#10b981', label: 'Seating' },
                { color: '#ec4899', label: 'Store' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                  <span style={{ color: '#cbd5e1', fontSize: '0.68rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scroll Hint (Mobile Only) */}
        {selectedZone && !hasScrolled && (
          <div className="mobile-scroll-hint">
             <span style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px' }}>Scroll for Info</span>
             <ChevronDown size={18} color="#a39dfa" />
          </div>
        )}
        </div>

        {/* Info Area */}
        <div className={`info-section ${selectedZone ? 'active' : ''}`}>
          <ZoneBottomSheet selectedZone={selectedZone} match={matchData} onClose={() => { setSelectedZone(null); setHighlightSeat(null); }} highlightSeat={highlightSeat} />
        </div>
      </div>
    </div>
  );
}
