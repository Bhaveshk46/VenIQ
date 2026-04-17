import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
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
  const mapContainerRef = useRef(null);

  useEffect(() => { setContextZone(selectedZone); }, [selectedZone, setContextZone]);
  useEffect(() => { setContextMatch(matchData); }, [matchData, setContextMatch]);
  useEffect(() => { setContextCrowd(crowdLevels); }, [crowdLevels, setContextCrowd]);

  const handleMarkerClick = useCallback((zone) => {
    setSelectedZone(zone);
    setTimeout(() => {
      if (mapContainerRef.current) {
        mapContainerRef.current.scrollTo({ top: mapContainerRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 150);
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
      default: return '#10B981';
    }
  };

  const zones = useMemo(() => {
    return Object.keys(VENUE_LOCATIONS)
      .filter(id => activeFilter === 'all' || VENUE_LOCATIONS[id].type === activeFilter)
      .map(id => ({ id, ...VENUE_LOCATIONS[id], level: crowdLevels[id] || 'green' }));
  }, [activeFilter, crowdLevels]);

  return (
    <div ref={mapContainerRef} style={{ position: 'relative', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', userSelect: 'none' }} className="animate-fade-in">
      
      {/* Arena Scoreboard Header */}
      <div style={{ margin: 'calc(env(safe-area-inset-top, 0px) + 8px) 12px 0 12px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: '#010409', border: '2px solid rgba(16, 185, 129, 0.4)', borderRightWidth: '8px', boxShadow: '10px 10px 0 rgba(16, 185, 129, 0.1)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Profile Trigger */}
          <div 
            ref={profileRef}
            onClick={() => setProfileOpen(!profileOpen)}
            style={{ 
              width: '40px', height: '40px', borderRadius: '12px', 
              background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative'
            }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px' }} />
            ) : (
              <UserIcon size={20} color="#10B981" />
            )}
            
            {profileOpen && (
              <div style={{ 
                position: 'absolute', top: 'calc(100% + 12px)', left: 0, 
                background: '#010409', border: '1px solid #10B981', 
                borderRadius: '12px', padding: '8px', width: '140px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 200,
                animation: 'fadeIn 0.2s'
              }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); logout(); }}
                  style={{ 
                    width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', 
                    border: 'none', borderRadius: '8px', color: '#ff4d4d', 
                    fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', 
                    alignItems: 'center', gap: '8px', cursor: 'pointer' 
                  }}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '0.85rem', color: '#10B981', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>VENIQ LIVE</h1>
            <p style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: '900', fontStyle: 'italic' }}>WANKHEDE ARENA</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 'bold' }}>MATCH STATUS</div>
          <div style={{ fontSize: '0.9rem', color: '#10B981', fontWeight: '900' }}>● {matchData?.status?.toUpperCase() || '2ND HALF'}</div>
        </div>
      </div>

      {/* Sporty Performance Filters */}
      <div 
        style={{ display: 'flex', overflowX: 'auto', gap: '4px', padding: '12px 12px 4px 12px', flexShrink: 0 }}
        role="tablist"
      >
        {['all', 'food', 'restroom', 'seat', 'gate', 'aid', 'merch'].map(id => (
            <button 
              key={id} 
              onClick={() => handleFilterClick(id)} 
              style={{ 
                padding: '12px 24px', 
                background: activeFilter === id ? '#10B981' : 'rgba(255,255,255,0.03)', 
                color: activeFilter === id ? '#000' : '#fff', 
                border: activeFilter === id ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                fontWeight: '900', 
                fontSize: '0.75rem', 
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'all 0.1s ease',
                clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0% 100%)', // Refined Sporty Angles
                minWidth: '120px'
              }}
            >
              {id}
            </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div 
        className="dual-mode-container" 
        onScrollCapture={() => setHasScrolled(true)} 
        onTouchMove={() => setHasScrolled(true)} 
        onWheel={() => setHasScrolled(true)}
        style={{ padding: '0 12px' }}
      >
        
        {/* Map Container - Arena Edition Console */}
        <div className="map-section" style={{ 
          flexDirection: 'column', 
          background: 'rgba(1, 4, 9, 0.4)', 
          borderRadius: '24px', 
          border: '1px solid rgba(16, 185, 129, 0.1)',
          padding: '12px',
          marginTop: '40px', // Shifted downward as requested
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          position: 'relative'
        }}>
          {/* Breadcrumb removed as requested */}

          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: 'calc(100vh - 320px)', 
            aspectRatio: '1/1', 
            margin: '0 auto',
            maskImage: 'radial-gradient(circle, black 82%, transparent 98%)', // Expansive mask for edge visibility
            WebkitMaskImage: 'radial-gradient(circle, black 82%, transparent 98%)'
          }}>
            <img 
              src="/emerald_map.png" 
              alt="Wankhede Stadium Map Layout" 
              style={{ width: '100%', height: '100%', opacity: 0.9, objectFit: 'contain' }} 
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

          {/* Integrated Legend Bottom Bar */}
          {!selectedZone && (
            <div style={{ 
              marginTop: '20px', 
              padding: '12px 0 4px 0', 
              borderTop: '1px solid rgba(16, 185, 129, 0.1)',
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: '8px 16px' 
            }}>
              {[
                { color: '#3b82f6', label: 'Gates' },
                { color: '#f59e0b', label: 'Food' },
                { color: '#8b5cf6', label: 'Restrooms' },
                { color: '#ef4444', label: 'Medical' },
                { color: '#10b981', label: 'Seating' },
                { color: '#ec4899', label: 'Store' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* Scroll Hint (Mobile Only) */}
        {selectedZone && !hasScrolled && (
          <div className="mobile-scroll-hint">
             <span style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.5px' }}>Scroll for Info</span>
             <ChevronDown size={18} color="#34D399" />
          </div>
        )}

        {/* Info Area */}
        <div className={`info-section ${selectedZone ? 'active' : ''}`}>
          <ZoneBottomSheet selectedZone={selectedZone} match={matchData} onClose={() => { setSelectedZone(null); setHighlightSeat(null); }} highlightSeat={highlightSeat} />
        </div>
      </div>
    </div>
  );
}
