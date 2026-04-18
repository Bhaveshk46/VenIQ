import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { 
  Navigation, MapPin, Car, Train, Bus, Bike, 
  Clock, AlertTriangle, User as UserIcon, LogOut,
  Coffee, ShoppingBag, PlusSquare, Tent, Search, Loader
} from 'lucide-react';

const GEOCODING_KEY = import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY;
const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const STADIUM_LAT = 18.9384;
const STADIUM_LNG = 72.8253;

function loadMapsSDK(apiKey) {
  return new Promise((resolve) => {
    if (window.google && window.google.maps) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// Get place autocomplete suggestions
async function getPlaceSuggestions(input) {
  if (!input || input.length < 2) return [];
  await loadMapsSDK(MAPS_KEY);
  return new Promise((resolve) => {
    const svc = new window.google.maps.places.AutocompleteService();
    svc.getPlacePredictions(
      { input: input + ', Mumbai', componentRestrictions: { country: 'in' }, types: ['geocode', 'establishment'] },
      (preds, status) => resolve(status === 'OK' ? preds : [])
    );
  });
}

// Fetch driving directions and return rich result with km
async function fetchLiveDirections(originLat, originLng, destLat, destLng) {
  await loadMapsSDK(MAPS_KEY);
  return new Promise((resolve) => {
    const service = new window.google.maps.DirectionsService();
    service.route({
      origin: new window.google.maps.LatLng(originLat, originLng),
      destination: new window.google.maps.LatLng(destLat, destLng),
      travelMode: window.google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: false,
    }, (result, status) => {
      if (status === 'OK' && result.routes.length > 0) {
        const leg = result.routes[0].legs[0];
        const distKm = leg.distance.value / 1000; // real km
        resolve({
          duration: leg.duration.text,
          durationSecs: leg.duration.value,
          distance: leg.distance.text,
          distKm,
          steps: leg.steps.slice(0, 6).map(s => s.instructions.replace(/<[^>]+>/g, ''))
        });
      } else {
        resolve(null);
      }
    });
  });
}

async function geocodeArea(area) {
  await loadMapsSDK(MAPS_KEY);
  return new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: area }, (results, status) => {
      if (status === 'OK' && results.length > 0) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        console.error('Geocoding failed:', status);
        resolve(null);
      }
    });
  });
}


import { VENUE_LOCATIONS } from '../../utils/directions';
import StadiumLayoutHint from '../components/StadiumLayoutHint';

const INSIDE_LOCATIONS = [
  { group: 'Gates', items: Object.values(VENUE_LOCATIONS).filter(v => v.type === 'gate').map(v => v.name) },
  { group: 'Seating', items: Object.values(VENUE_LOCATIONS).filter(v => v.type === 'seat').map(v => v.name) },
  { group: 'Facilities', items: Object.values(VENUE_LOCATIONS).filter(v => ['food', 'restroom', 'aid', 'merch'].includes(v.type)).map(v => v.name) }
];

// 15+ Hardcoded Routes inside the stadium
const HARDCODED_ROUTES = {
  'Gate A-Block A': { time: '~2 min walk', dist: '~120m', steps: ['Enter through Gate A security check.', 'Take the immediate stairs to Level 1.', 'Follow the blue concourse line to Block A entrances.'] },
  'Gate B-Food Court North': { time: '~3 min walk', dist: '~180m', steps: ['Enter Gate B and turn left on the main concourse.', 'Walk past Block B and C.', 'Food Court North will be on your right beside the escalators.'] },
  'Block D-Restroom Level 1': { time: '~1 min walk', dist: '~50m', steps: ['Exit Block D towards the rear stairs.', 'Descend to Level 1 concourse.', 'Restrooms are directly opposite stairwell 4.'] },
  'Gate C-Medical Bay': { time: '~2 min walk', dist: '~100m', steps: ['Enter Gate C emergency bypass lane.', 'Head straight down the West corridor.', 'Medical Bay is the double red doors on the left.'] },
  'Block H-Merchandise Store': { time: '~4 min walk', dist: '~250m', steps: ['Exit Block H to the upper concourse.', 'Take the escalator down to Ground Level.', 'Walk towards the main atrium.', 'The Store is next to Gate A.'] },
  'Food Court South-Block F': { time: '~2 min walk', dist: '~90m', steps: ['Exit Food Court South and turn right.', 'Walk past the VIP elevators.', 'Take ramp up to Block F entrance.'] },
  'Gate D-VIP Entrance': { time: '~1 min walk', dist: '~40m', steps: ['From Gate D, head to the dedicated fast-track lane.', 'The VIP Entrance is located in the adjacent glass pavilion.'] },
  'Block B-Food Court South': { time: '~5 min walk', dist: '~300m', steps: ['Exit Block B and merge onto the circular concourse.', 'Walk clockwise passing Blocks C, D, and E.', 'Food Court South is located just after Block E.'] },
  'Gate A-Press Box': { time: '~4 min walk', dist: '~200m', steps: ['Enter Gate A and locate the media elevator bank.', 'Take Elevator M to Level 4.', 'Follow signs for Press & Broadcasting.'] },
  'Restroom Level 2-Block C': { time: '~2 min walk', dist: '~80m', steps: ['Exit Restroom Level 2.', 'Walk straight down the Level 2 concourse.', 'Enter Block C via portals 3 or 4.'] },
  'Gate B-Restroom Level 1': { time: '~2 min walk', dist: '~110m', steps: ['Enter Gate B.', 'Turn right towards the East stairs.', 'Restrooms are located beneath the stairwell.'] },
  'Block E-Gate C': { time: '~3 min walk', dist: '~150m', steps: ['Exit Block E downwards to the concourse.', 'Turn left and walk until you see the West Exits.', 'Proceed through Gate C turnstiles.'] },
  'Food Court North-Medical Bay': { time: '~3 min walk', dist: '~180m', steps: ['Exit Food Court North towards the central hub.', 'Take the corridor towards Gate C.', 'Medical Bay is located halfway down on the right.'] },
  'Merchandise Store-Block A': { time: '~1 min walk', dist: '~60m', steps: ['Exit the Store and turn left on the ground concourse.', 'Take the short ramp up to Level 1.', 'Block A portals are immediately ahead.'] },
  'Gate A-Merchandise Store': { time: '< 1 min walk', dist: '~20m', steps: ['Enter Gate A main atrium.', 'The Merchandise Store is immediately to your right.'] },
};

// --- Custom searchable location picker ---
function LocationPicker({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = React.useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = INSIDE_LOCATIONS.map(g => ({
    group: g.group,
    items: g.items.filter(i => i.toLowerCase().includes(query.toLowerCase()))
  })).filter(g => g.items.length > 0);

  const selectedLabel = value || '';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setQuery(''); }}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${open ? '#10B981' : 'rgba(255,255,255,0.12)'}`,
          color: selectedLabel ? 'white' : '#64748b', fontSize: '0.95rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', outline: 'none', transition: 'border 0.2s',
          boxShadow: open ? '0 0 0 2px rgba(127,119,221,0.2)' : 'none'
        }}
      >
        <span>{selectedLabel || placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: '#111827', border: '1px solid rgba(127,119,221,0.3)',
          borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          overflow: 'hidden', animation: 'fadeIn 0.15s'
        }}>
          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search location..."
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', fontSize: '0.88rem', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          {/* Option list */}
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '20px', margin: 0 }}>No results</p>
            )}
            {filtered.map(g => (
              <div key={g.group}>
                <p style={{ margin: 0, padding: '8px 14px 4px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#10B981', fontWeight: 'bold' }}>{g.group}</p>
                {g.items.map(item => (
                  <div
                    key={item}
                    onClick={() => { onChange(item); setOpen(false); }}
                    style={{
                      padding: '11px 16px', cursor: 'pointer', fontSize: '0.93rem',
                      color: item === value ? '#34D399' : 'white',
                      background: item === value ? 'rgba(127,119,221,0.15)' : 'transparent',
                      borderLeft: item === value ? '3px solid #10B981' : '3px solid transparent',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { if (item !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (item !== value) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


import { useAuth } from '../contexts/AuthContext';

export default function DirectionsScreen() {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = React.useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const location = useLocation();
  const locationState = location.state || {};

  const [activeTab, setActiveTab] = useState('inside');

  // Tab 1 State: Inside Stadium
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [aiRoute, setAiRoute] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showRoute, setShowRoute] = useState(false);

  // FIX: Don't auto-call Gemini on every dropdown change — too expensive.
  // Instead, expose a manual trigger function called by a button click.
  const fetchAiRoute = () => {
    if (!fromLoc || !toLoc || fromLoc === toLoc || activeTab !== 'inside') return;
    let active = true;
    setAiLoading(true);
    setAiRoute(null);
    setShowRoute(false);
    import('../../services/gemini').then(({ getGeminiDirections }) => {
      getGeminiDirections(fromLoc, toLoc).then(r => {
        if (active) {
          if (r) setAiRoute(r);
          setShowRoute(true);
          setAiLoading(false);
        }
      });
    }).catch(() => {
      if (active) {
        setShowRoute(true);
        setAiLoading(false);
      }
    });
    return () => { active = false; };
  };

  // Pre-fill destination from "Route Here" button on the map
  useEffect(() => {
    if (locationState?.destination) {
      setActiveTab('inside');
      setToLoc(locationState.destination);
      // Clear after consuming so navigating back doesn't re-set it
      // Note: In React Router v6, we don't usually manually clear history state like this
      // as it might interfere with navigation. It's better to just use the state once.

    }
  }, []);

  // Tab 2 State: Travel Planner
  const [area, setArea] = useState('');
  const [direction, setDirection] = useState('arriving'); // 'arriving' or 'departing'
  const [liveRoutes, setLiveRoutes] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [areaSearched, setAreaSearched] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [transportStats, setTransportStats] = useState(null);

  // Helper to calculate realistic transport costs based on real KM
  const calculateTransportStats = (distKm) => {
    if (!distKm) return null;
    
    // Base rates
    const uberBase = 60 + (distKm * 18);
    const olaBase = 50 + (distKm * 16);
    const bikeBase = 25 + (distKm * 8);
    
    // Multiplier for match day surge
    const surgeMultiplier = 1.35;

    return {
      uber: `₹${Math.round(uberBase * surgeMultiplier)} - ${Math.round(uberBase * surgeMultiplier * 1.2)}`,
      ola: `₹${Math.round(olaBase * surgeMultiplier)} - ${Math.round(olaBase * surgeMultiplier * 1.15)}`,
      bike: `₹${Math.round(bikeBase * surgeMultiplier)}`,
      auto: distKm > 40 ? 'Unavailable' : `₹${Math.round(distKm * 21)}`,
      time: distKm > 30 ? `~${Math.round(distKm * 2.5)} min` : `~${Math.round(distKm * 2)} min`
    };
  };

  // Autocomplete debounced effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (area.length > 2 && !areaSearched) {
        const results = await getPlaceSuggestions(area);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [area, areaSearched]);

  const handleLiveRoutes = async (targetArea = null) => {
    const searchArea = targetArea || area;
    if (!searchArea.trim()) return;
    setLiveLoading(true);
    setLiveError('');
    setLiveRoutes(null);
    try {
      const coords = await geocodeArea(searchArea);
      if (!coords) { setLiveError('Could not find that area. Try a landmark or neighbourhood name.'); setLiveLoading(false); return; }
      
      let originLat, originLng, destLat, destLng;
      if (direction === 'arriving') {
        originLat = coords.lat; originLng = coords.lng;
        destLat = STADIUM_LAT; destLng = STADIUM_LNG;
      } else {
        originLat = STADIUM_LAT; originLng = STADIUM_LNG;
        destLat = coords.lat; destLng = coords.lng;
      }
      
      const route = await fetchLiveDirections(originLat, originLng, destLat, destLng);
      if (route) {
        setLiveRoutes(route);
        setAreaSearched(searchArea);
        setArea(searchArea);
        setTransportStats(calculateTransportStats(route.distKm));
        setShowSuggestions(false);
      } else {
        setLiveError('No route found specifically for driving to/from the stadium at this time.');
      }
    } catch (err) {
      setLiveError('Connectivity issue with Google Maps. Please check your network.');
    }
    setLiveLoading(false);
  };

  // Helpers internal (Fallback when AI fails or is loading)
  const getHeuristicRoute = () => {
    if (!fromLoc || !toLoc) return null;
    const vLocFrom = Object.values(VENUE_LOCATIONS).find(v => v.name === fromLoc);
    const vLocTo = Object.values(VENUE_LOCATIONS).find(v => v.name === toLoc);
    if (!vLocFrom || !vLocTo) return null;

    let steps = [];
    let time = '~3 mins';
    let dist = '~150m';

    // Step 1
    if (vLocFrom.type === 'seat') steps.push(`Exit ${fromLoc.split(' ')[0]} to the inner concourse.`);
    else if (vLocFrom.type !== 'gate') steps.push(`Walk from ${fromLoc} onto the primary walkway.`);
    else steps.push(`Pass the boundary at ${fromLoc} and enter the main ring.`);

    // Step 2: Transit
    const isNorth = (l) => l.top < 40;
    const isSouth = (l) => l.top > 60;
    
    if (isNorth(vLocFrom) && isSouth(vLocTo)) {
      steps.push('Cross the central stadium spine from the North to the South pavilion.');
      time = '~6 mins'; dist = '~300m';
    } else if (isSouth(vLocFrom) && isNorth(vLocTo)) {
      steps.push('Follow the main circular path from the South side to the North.');
      time = '~6 mins'; dist = '~300m';
    } else {
      steps.push('Follow the overhead directional signs along your current concourse.');
    }

    // Step 3
    if (vLocTo.type === 'seat') steps.push(`Enter ${toLoc.split(' ')[0]} via the marked portal.`);
    else if (vLocTo.type === 'gate') steps.push(`Head towards the exit structures at ${toLoc}.`);
    else steps.push(`Look for the sign above ${toLoc} — you have arrived.`);

    return { time, dist, steps };
  };

  const handleShortcut = (dest) => {
    setToLoc(dest);
    setShowRoute(false);
    setAiRoute(null);
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto', color: 'white', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header */}
      <div style={{ 
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '24px',
        background: 'rgba(17, 24, 39, 0.8)', 
        backdropFilter: 'blur(10px)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Find Your Way</h1>
          </div>
        </div>
        <div 
          role="tablist"
          aria-label="Navigation modes"
          style={{ display: 'flex', gap: '8px', marginTop: '16px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}
        >
          <button 
            onClick={() => setActiveTab('inside')}
            role="tab"
            aria-selected={activeTab === 'inside'}
            aria-label="Directions inside the stadium"
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'inside' ? '#10B981' : 'transparent', color: activeTab === 'inside' ? 'white' : '#94a3b8', fontWeight: 'bold', transition: 'all 0.3s' }}
          >
            Inside Stadium
          </button>
          <button 
            onClick={() => setActiveTab('travel')}
            role="tab"
            aria-selected={activeTab === 'travel'}
            aria-label="Travel planner to and from the stadium"
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: activeTab === 'travel' ? '#10B981' : 'transparent', color: activeTab === 'travel' ? 'white' : '#94a3b8', fontWeight: 'bold', transition: 'all 0.3s' }}
          >
            Travel Planner
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* =========================================================
            TAB 1: INSIDE STADIUM WAYFINDING
            ========================================================= */}
        {activeTab === 'inside' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s' }}>
            
            {/* Shortcuts */}
            <div role="complementary" aria-label="Quick navigation shortcuts">
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '12px' }}>Quick Access</h3>
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                {[
                  { label: 'Restroom', icon: <Tent size={18} />, dest: 'West Restrooms' },
                  { label: 'Food', icon: <Coffee size={18} />, dest: 'North Concourse Shops' },
                  { label: 'Medical', icon: <PlusSquare size={18} />, dest: 'Primary Medical Center' },
                  { label: 'Merch', icon: <ShoppingBag size={18} />, dest: 'Official Merchandise Store' },

                ].map(s => (
                  <button 
                    key={s.label} 
                    onClick={() => handleShortcut(s.dest)} 
                    aria-label={`Route to nearest ${s.label}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px', color: 'white', whiteSpace: 'nowrap',
                      boxShadow: toLoc === s.dest ? '0 0 15px rgba(127,119,221,0.2)' : 'none',
                      borderColor: toLoc === s.dest ? '#10B981' : 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <span style={{ color: '#10B981' }}>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selectors */}
            <div 
              role="form"
              aria-label="Routing selectors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label id="origin-label" style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>📍 I am at:</label>
                <LocationPicker value={fromLoc} onChange={loc => { setFromLoc(loc); setShowRoute(false); setAiRoute(null); }} placeholder="Select your current location..." aria-labelledby="origin-label" />
              </div>
              <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(127,119,221,0.15)', border: '1px solid rgba(127,119,221,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Navigation size={13} color="#34D399" />
                </div>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>
              <div>
                <label id="dest-label" style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}>🎯 I want to go to:</label>
                <LocationPicker value={toLoc} onChange={loc => { setToLoc(loc); setShowRoute(false); setAiRoute(null); }} placeholder="Select destination..." aria-labelledby="dest-label" />
              </div>
            </div>

            {/* ✨ AI Directions Trigger Button */}
            <button
              onClick={fetchAiRoute}
              disabled={aiLoading || !fromLoc || !toLoc || fromLoc === toLoc}
              aria-label={aiLoading ? "Calculating AI Route" : "Get AI Directions"}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: (aiLoading || !fromLoc || !toLoc || fromLoc === toLoc) ? 'rgba(127,119,221,0.15)' : 'linear-gradient(135deg, #10B981, #34D399)',
                color: (aiLoading || !fromLoc || !toLoc || fromLoc === toLoc) ? '#64748b' : 'white', 
                fontWeight: '700', fontSize: '1rem', 
                cursor: aiLoading ? 'wait' : (!fromLoc || !toLoc || fromLoc === toLoc) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: (aiLoading || !fromLoc || !toLoc || fromLoc === toLoc) ? 'none' : '0 4px 20px rgba(127,119,221,0.35)', transition: 'all 0.2s',
                letterSpacing: '0.5px'
              }}
            >
              {aiLoading
                ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Getting AI Route...</>
                : <><Navigation size={18} /> Get AI Directions ✨</>
              }
            </button>

            {/* Routing Results */}
            {showRoute && fromLoc && toLoc && fromLoc !== toLoc && (
              <div 
                key={`${fromLoc}-${toLoc}-${aiRoute ? 'ai' : 'heu'}`} 
                style={{ animation: 'fadeIn 0.5s' }}
                role="region"
                aria-label="Route details"
              >
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <span aria-label={`Estimated time: ${(aiRoute || getHeuristicRoute())?.time}`} style={{ padding: '6px 12px', background: 'rgba(127,119,221,0.2)', color: '#34D399', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14}/> {(aiRoute || getHeuristicRoute())?.time}</span>
                  <span aria-label={`Distance: ${(aiRoute || getHeuristicRoute())?.dist}`} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Navigation size={14}/> {(aiRoute || getHeuristicRoute())?.dist}</span>
                </div>

                <div 
                  role="list"
                  aria-label="Directions steps"
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  {(aiRoute || getHeuristicRoute())?.steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      role="listitem"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '4px solid #10B981', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                    >
                      <div aria-hidden="true" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(127,119,221,0.2)', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>{idx + 1}</div>
                      <p style={{ margin: 0, color: 'white', lineHeight: '1.5' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Same map asset + % coords as Map tab (replaces schematic ellipse SVG). */}
            <div style={{ marginTop: '20px', padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', textAlign: 'center' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '20px' }}>Stadium Layout Hint</h3>
              <StadiumLayoutHint fromName={fromLoc} toName={toLoc} />
            </div>

          </div>
        )}

        {/* =========================================================
            TAB 2: TRAVEL PLANNER
            ========================================================= */}
        {activeTab === 'travel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s' }}>
            
            {/* Input & Context */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button onClick={() => setDirection('arriving')} style={{ flex: 1, padding: '10px', background: direction === 'arriving' ? 'rgba(127,119,221,0.2)' : 'transparent', color: direction === 'arriving' ? '#34D399' : '#94a3b8', border: '1px solid', borderColor: direction === 'arriving' ? '#10B981' : 'rgba(255,255,255,0.1)', borderRadius: '8px 0 0 8px' }}>Home ➔ Stadium</button>
                <button onClick={() => setDirection('departing')} style={{ flex: 1, padding: '10px', background: direction === 'departing' ? 'rgba(127,119,221,0.2)' : 'transparent', color: direction === 'departing' ? '#34D399' : '#94a3b8', border: '1px solid', borderColor: direction === 'departing' ? '#10B981' : 'rgba(255,255,255,0.1)', borderRadius: '0 8px 8px 0' }}>Stadium ➔ Home</button>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
                <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}/> 
                {direction === 'arriving' ? 'Match starts 7:30 PM — Plan to arrive by 7:00 PM' : 'Match ends approx 11:00 PM — Major traffic delays expected'}
              </p>
              
              <div style={{ marginBottom: '16px', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input 
                      type="text" 
                      placeholder={direction === 'arriving' ? "Enter your area/neighborhood (e.g. Bandra, Andheri)" : "Enter destination area"}
                      value={area}
                      onChange={e => { setArea(e.target.value); setAreaSearched(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleLiveRoutes()}
                      onFocus={() => area.length > 2 && setSuggestions.length > 0 && setShowSuggestions(true)}
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, 
                        background: '#1e293b', borderRadius: '12px', marginTop: '8px',
                        border: '1px solid rgba(255,255,255,0.1)', zIndex: 60,
                        overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}>
                        {suggestions.map((p, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setArea(p.description);
                              handleLiveRoutes(p.description);
                            }}
                            style={{ 
                              padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', 
                              cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              transition: 'all 0.2s', background: 'transparent'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(127,119,221,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ color: 'white', fontWeight: '500' }}>{p.structured_formatting.main_text}</span>
                            <span style={{ marginLeft: '8px', fontSize: '0.8rem', opacity: 0.7 }}>{p.structured_formatting.secondary_text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Route Results */}
            {liveLoading && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#34D399' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ margin: 0, color: '#94a3b8' }}>Fetching live routes from Google...</p>
              </div>
            )}

            {liveError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#fca5a5', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <AlertTriangle size={18} /><p style={{ margin: 0 }}>{liveError}</p>
              </div>
            )}

            {liveRoutes && (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <div style={{ background: 'rgba(127,119,221,0.08)', border: '1px solid rgba(127,119,221,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                  <h3 style={{ color: '#34D399', margin: '0 0 12px', fontSize: '1rem' }}>
                    🗺️ Live Route: {areaSearched} {direction === 'arriving' ? '→ Stadium' : '← Stadium'}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '6px 12px', background: 'rgba(127,119,221,0.2)', color: '#34D399', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14}/> {liveRoutes.duration}</span>
                    <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Navigation size={14}/> {liveRoutes.distance}</span>
                    <span style={{ padding: '4px 8px', background: 'rgba(6,182,212,0.15)', color: '#67e8f9', borderRadius: '6px', fontSize: '0.75rem' }}>Powered by Google</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {liveRoutes.steps.map((step, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid #0ea5e9', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(14,165,233,0.2)', color: '#7dd3fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>{idx + 1}</div>
                      <p style={{ margin: 0, color: 'white', lineHeight: '1.5', fontSize: '0.9rem' }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Private Transport Cards */}
            <div>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '12px' }}>Private & Cabs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Uber/Ola Pricing Logic */}
                {['Uber', 'Ola'].map(brand => {
                  const cost = transportStats ? (brand === 'Uber' ? transportStats.uber : transportStats.ola) : '₹---';
                  const time = transportStats ? transportStats.time : 'Calculated on search';

                  return (
                    <div key={brand} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', animation: 'fadeIn 0.4s' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car color="white" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: 'white' }}>{brand} Cab</h4>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{time}</span>
                          <span style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 'bold' }}>{cost}</span>
                        </div>
                      </div>
                      <a href={`https://${brand === 'Uber' ? 'm.uber.com' : 'book.olacabs.com'}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: '#10B981', color: 'white', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(127,119,221,0.3)' }}>
                        Book
                      </a>
                    </div>
                  );
                })}

                {/* Bike & Auto */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bike color="white" /></div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: 'white' }}>Rapido Bike</h4>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                      <span style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 'bold' }}>{transportStats ? transportStats.bike : '₹--'}</span>
                    </div>
                  </div>
                  <a href="#" style={{ textDecoration: 'none', background: '#10B981', color: 'white', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Book</a>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', border: transportStats?.auto === 'Unavailable' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car fill="transparent" color="white" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, color: 'white' }}>Auto Rickshaw</h4>
                      {transportStats?.auto === 'Unavailable' && <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Unavailable (Far)</span>}
                    </div>
                    {transportStats?.auto !== 'Unavailable' && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                        <span style={{ color: '#34D399', fontSize: '0.85rem', fontWeight: 'bold' }}>{transportStats ? transportStats.auto : '₹--'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Public Transit Dashboard */}
            <div>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '16px' }}>Transit Hub (Live Board)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Local Train Dashboard */}
                <div style={{ 
                  background: 'rgba(1, 4, 9, 0.6)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  borderRadius: '20px', 
                  padding: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', borderBottomLeftRadius: '12px', fontSize: '0.65rem', color: '#10B981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }} /> LIVE UPDATES
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Train color="#10B981" size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Western Line Local</h4>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>Western Railway Section</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { station: 'Marine Lines', distance: '0.9km', time: 'In 4 mins', platform: 'P2', status: 'On Time', capacity: 'High' },
                      { station: 'Churchgate', distance: '1.8km', time: 'In 9 mins', platform: 'P4', status: 'Exp. Delay', capacity: 'Normal' }
                    ].map((train, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'white', fontWeight: '700', fontSize: '0.95rem' }}>{train.station}</span>
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{train.distance}</span>
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '0.72rem', color: train.status === 'On Time' ? '#10B981' : '#f59e0b', fontWeight: '600' }}>
                            {train.status} • Platform {train.platform}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: '#10B981', fontWeight: '900', fontSize: '1.1rem' }}>{train.time}</div>
                          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>{train.capacity} LOAD</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a href="https://maps.google.com/?q=Marine+Lines+Railway+Station" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', textDecoration: 'none', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '0.85rem', transition: 'all 0.2s' }}>
                    <MapPin size={14} /> View Station Access Maps
                  </a>
                </div>

                {/* BEST Bus Monitor */}
                <div style={{ 
                  background: 'rgba(1, 4, 9, 0.6)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)', 
                  borderRadius: '20px', 
                  padding: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bus color="#10B981" size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>BEST Bus Monitor</h4>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem' }}>Stadium Specialized Routes</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { route: '132', time: 'Arriving', status: 'Blinking', next: '6m' },
                      { route: '123', time: '3 mins', status: 'Ready', next: '12m' }
                    ].map((bus, i) => (
                      <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '4px' }}>ROUTE</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white' }}>{bus.route}</span>
                          <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: 'bold' }}>LTD</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: bus.status === 'Blinking' ? '#10B981' : '#34D399', animation: bus.status === 'Blinking' ? 'pulse 1s infinite' : 'none' }}>
                          {bus.time}
                        </div>
                        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.65rem', color: '#64748b' }}>
                          NEXT: {bus.next}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', fontSize: '0.72rem', color: '#fbbf24', display: 'flex', gap: '8px' }}>
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    Post-match traffic may divert Route 132. Check app for live detour maps.
                  </div>
                </div>

              </div>
            </div>

            {/* Parking Info */}
            <div>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '12px' }}>Self Drive & Parking</h3>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
                <p style={{ color: '#f59e0b', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> Stadium has NO internal public parking.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>Azad Maidan Parking</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', color: '#34D399', fontWeight: 'bold', fontSize: '0.9rem' }}>₹50/hr</span>
                      <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem' }}>0.4km walk</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>Cross Maidan Info</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', color: '#34D399', fontWeight: 'bold', fontSize: '0.9rem' }}>₹40/hr</span>
                      <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem' }}>0.6km walk</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>Marine Lines Lot</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', color: '#34D399', fontWeight: 'bold', fontSize: '0.9rem' }}>₹60/hr</span>
                      <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem' }}>1.2km walk</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
      
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
