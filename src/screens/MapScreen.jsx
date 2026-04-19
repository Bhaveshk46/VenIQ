import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import { onValue } from 'firebase/database';
import { crowdLevelsRef, matchRef } from '../../services/firebase';
import { VENUE_LOCATIONS } from '../../utils/directions';
import {
  STADIUM_MAP_EDGE_MASK,
  STADIUM_MAP_ASPECT_BOX,
} from '../utils/mapLayout';
import ZoneBottomSheet from '../components/ZoneBottomSheet';
import { useAuth } from '../hooks/useAuth';
import { useStadium } from '../hooks/useStadium';
import VenIQLogo from '../components/VenIQLogo';

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
    setHasScrolled(false);
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
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


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
          // Use Promise.resolve or setTimeout to defer state updates and avoid synchronous cascading render warning
          Promise.resolve().then(() => {
            setSelectedZone({ id: blockName, ...VENUE_LOCATIONS[blockName], level: crowdLevels[blockName] || 'green' });
            setHasScrolled(false);
            setHighlightSeat({ blockCode: parts[0], rowName: `${parts[0]}${parts[1]}`, seatNo: parseInt(parts[2], 10), tierId });
          });
        }
      }
      navigate('/', { replace: true });
    }
  }, [location.search, navigate, crowdLevels]);

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
      
      {/* Arena Scoreboard Header - Revamped Split Layout */}
      <div style={{ 
        margin: 'calc(env(safe-area-inset-top, 0px) + 8px) 12px 0 12px', 
        zIndex: 100, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 18px', 
        background: 'rgba(8, 12, 20, 0.9)', 
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(16, 185, 129, 0.4)', 
        borderBottom: '4px solid rgba(16, 185, 129, 0.6)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        position: 'relative' 
      }}>
        {/* Left: Branding & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <VenIQLogo size={32} />
          <div>
            <h1 style={{ 
              margin: 0, 
              fontFamily: "'Outfit', sans-serif", 
              fontWeight: '900', 
              fontSize: '1.4rem', 
              lineHeight: 1,
              letterSpacing: '0.5px',
              color: 'white'
            }}>
              Ven<span style={{ color: '#10B981' }}>IQ</span>
            </h1>
            <div style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#10B981', fontWeight: '900', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981', animation: 'pulse 1.5s infinite' }}></span>
              {matchData?.status?.toUpperCase() || 'PRE-MATCH'}
            </div>
          </div>
        </div>

        {/* Right: Account Profile */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          
          {/* Profile Trigger */}
          <button 
            type="button"
            ref={profileRef}
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="Toggle user profile menu"
            aria-haspopup="true"
            aria-expanded={profileOpen}
            style={{ 
              width: '42px', height: '42px', borderRadius: '50%', 
              background: 'rgba(16, 185, 129, 0.1)', border: '2px solid rgba(16, 185, 129, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              boxShadow: profileOpen ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
              transition: 'all 0.3s',
              padding: 0
            }}
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <UserIcon size={20} color="#10B981" />
            )}
            
            {profileOpen && (
              <div style={{ 
                position: 'absolute', top: 'calc(100% + 12px)', right: 0, 
                background: '#0a0d14', border: '1px solid #10B981', 
                borderRadius: '12px', padding: '12px', width: '160px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.8)', zIndex: 200,
                animation: 'fadeIn 0.2s'
              }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                   <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>LOGGED IN AS</p>
                   <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'white', fontWeight: '900', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName || 'User'}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); logout(); }}
                  style={{ 
                    width: '100%', padding: '10px', background: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ff4d4d', 
                    fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', 
                    alignItems: 'center', gap: '10px', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </button>
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
            ...STADIUM_MAP_ASPECT_BOX,
            margin: '0 auto',
            maskImage: STADIUM_MAP_EDGE_MASK,
            WebkitMaskImage: STADIUM_MAP_EDGE_MASK,
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

        {/* Info Area - Only rendered when a zone is selected to prevent extra empty space */}
        {selectedZone && (
          <div className="info-section active">
            <ZoneBottomSheet selectedZone={selectedZone} match={matchData} onClose={() => { setSelectedZone(null); setHighlightSeat(null); }} highlightSeat={highlightSeat} />
          </div>
        )}
      </div>
    </div>
  );
}
