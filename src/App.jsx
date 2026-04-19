import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Map, Navigation, MessageCircle, Ticket, Sparkles } from 'lucide-react';

// Auth
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { StadiumProvider } from './contexts/StadiumProvider';
import LoginScreen from './screens/LoginScreen';
import SplashScreen from './components/SplashScreen';

// Lazy Loaded Screens for Efficiency
const MapScreen = lazy(() => import('./screens/MapScreen'));
const DirectionsScreen = lazy(() => import('./screens/DirectionsScreen'));
const ChatScreen = lazy(() => import('./screens/ChatScreen'));
const TicketScreen = lazy(() => import('./screens/TicketScreen'));

// Premium Loading State for Suspense
const ScreenLoader = () => (
  <div style={{ 
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
    gap: '20px', background: '#080c14' 
  }}>
    <div style={{
      width: '50px', height: '50px', borderRadius: '15px',
      background: 'linear-gradient(135deg, #10B981, #34D399)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'pulse 1.5s infinite',
      boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
    }}>
      <Sparkles size={24} color="white" />
    </div>
    <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500', letterSpacing: '1px' }}>LOADING VENIQ...</span>
  </div>
);

function AppContent() {
  const { user, initializing } = useAuth();

  // Show premium splash screen while checking initial session
  if (initializing) {
    return <SplashScreen />;
  }

  // AUTH GATE: If no user, show login
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <StadiumProvider>
      <Router>
        <div className="app-container">
          <main className="screen-content" role="main">
            <Suspense fallback={<ScreenLoader />}>
              <Routes>
                <Route path="/" element={<MapScreen />} />
                <Route path="/directions" element={<DirectionsScreen />} />
                <Route path="/chat" element={<ChatScreen />} />
                <Route path="/ticket" element={<TicketScreen />} />
              </Routes>
            </Suspense>
          </main>

          <nav className="bottom-nav" role="navigation">
            <NavLink 
              to="/" 
              aria-label="Stadium Map"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} 
              end
            >
              <Map className="nav-icon" size={24} />
              <span className="nav-label">Map</span>
            </NavLink>
            
            <NavLink 
              to="/directions" 
              aria-label="Navigation and Directions"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Navigation className="nav-icon" size={24} />
              <span className="nav-label">Directions</span>
            </NavLink>
            
            <NavLink 
              to="/chat" 
              aria-label="AI Concierge Chat"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <MessageCircle className="nav-icon" size={24} />
              <span className="nav-label">Chat</span>
            </NavLink>

            <NavLink 
              to="/ticket" 
              aria-label="My Tickets"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Ticket className="nav-icon" size={24} />
              <span className="nav-label">Tickets</span>
            </NavLink>
          </nav>
        </div>
      </Router>
    </StadiumProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="arena-texture"></div>
      <AppContent />
    </AuthProvider>
  );
}
