import React, { useState, useEffect } from 'react';
import { X, Clock, Navigation, ChevronLeft, Store, Users, MapPin, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPredictionData, getSensorInsights } from '../../utils/crowdSimulation';
import { NORTH_SHOPS, SOUTH_SHOPS, SEATING_GROUPS } from '../utils/constants';
// Removed recharts imports

function SeatingChart({ rows, blockName, highlightSeat }) {
  const rowHeight = 24;
  const seatWidth = 12;
  const aisleWidth = 15;
  const seatsPerSegment = 4;
  const totalRows = rows.length;
  const [hoveredSeat, setHoveredSeat] = useState(null);

  return (
    <div style={{ width: '100%', position: 'relative', marginTop: '16px', touchAction: 'pan-y' }}>
      {/* Custom Tooltip */}
      {hoveredSeat && (
        <div style={{
          position: 'absolute',
          left: `${hoveredSeat.x}px`,
          top: `${hoveredSeat.y - 30}px`,
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '4px 10px',
          borderRadius: '8px',
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          pointerEvents: 'none',
          zIndex: 100,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animation: 'fadeIn 0.1s ease-out'
        }}>
          <span style={{ color: '#34D399' }}>Row {hoveredSeat.row}</span>
          <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.2)' }} />
          <span>Seat {hoveredSeat.no}</span>
        </div>
      )}

      <svg
        viewBox={`0 0 300 ${(totalRows * rowHeight) + 60}`}
        style={{ width: '100%', height: 'auto' }}
        role="img"
        aria-label={`Seating layout for ${blockName}`}
      >
        <title>Seating layout for {blockName}</title>
        <defs>
          <filter id="blockShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.2" />
            <feOffset dx="0.2" dy="0.2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {rows.map((rowName, rowIndex) => {
          const y = 30 + (rowIndex * rowHeight);
          const totalSeatWidth = (seatsPerSegment * 3 * seatWidth) + (2 * aisleWidth);
          const startX = 60 + (240 - totalSeatWidth) / 2;

          return (
            <g key={rowName}>
              <text x={startX - 22} y={y + 7.5} fill="#94a3b8" fontSize="11" fontWeight="800" textAnchor="middle">{rowName}</text>

              {[...Array(seatsPerSegment * 3)].map((_, seatIndex) => {
                const segment = Math.floor(seatIndex / seatsPerSegment);
                const seatInSegment = seatIndex % seatsPerSegment;

                let x = startX + (seatIndex * seatWidth);
                if (segment >= 1) x += aisleWidth;
                if (segment >= 2) x += aisleWidth;

                const seatNo = (segment + 1) * 100 + (seatInSegment + 1);
                const isHighlighted = highlightSeat && highlightSeat.rowName === rowName && highlightSeat.seatNo === seatNo;

                return (
                  <rect
                    id={isHighlighted ? "highlighted-seat" : undefined}
                    key={`${rowName}-${seatIndex}`}
                    x={x}
                    y={y}
                    width="10"
                    height="10"
                    rx="2"
                    fill={isHighlighted ? "#facc15" : "rgba(16, 185, 129, 0.4)"}
                    stroke={isHighlighted ? "#fff" : "rgba(255, 255, 255, 0.2)"}
                    strokeWidth={isHighlighted ? "1.2" : "0.6"}
                    filter={isHighlighted ? "drop-shadow(0 0 6px rgba(250, 204, 21, 0.9))" : "url(#blockShadow)"}
                    style={{ 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0, 1)', 
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { 
                      // Calculate the SVG relative position for the tooltip
                      const svg = e.currentTarget.ownerSVGElement;
                      const point = svg.createSVGPoint();
                      point.x = x + 5;
                      point.y = y;
                      const ctm = svg.getScreenCTM();
                      const parentRect = svg.parentElement.getBoundingClientRect();
                      
                      // Using the viewBox coordinates is easier since we are relative to the container
                      // We can just use (x, y) normalized to the width if needed, but since the div is in the same relative container
                      // we can just use the viewBox units if it matches 1:1 or calculate the scale.
                      // Simple approach: Percentages of viewBox
                      const pctX = (x + 5) / 300;
                      setHoveredSeat({
                        row: rowName,
                        no: seatNo,
                        x: parentRect.width * pctX,
                        y: (parentRect.height * (y / ((totalRows * rowHeight) + 60)))
                      });

                      if(!isHighlighted) {
                        e.currentTarget.style.fill = '#34D399'; 
                        e.currentTarget.style.stroke = '#fff'; 
                        e.currentTarget.style.transform = 'translateY(-1px)'; 
                      }
                    }}
                    onMouseLeave={(e) => { 
                      setHoveredSeat(null);
                      if(!isHighlighted){
                        e.currentTarget.style.fill = 'rgba(16, 185, 129, 0.4)'; 
                        e.currentTarget.style.stroke = 'rgba(255, 255, 255, 0.2)'; 
                        e.currentTarget.style.transform = 'translateY(0)'; 
                      }
                    }}
                  >
                    {isHighlighted && (
                      <animate 
                        attributeName="opacity" 
                        values="1;0.5;1" 
                        dur="1.5s" 
                        repeatCount="indefinite" 
                      />
                    )}
                  </rect>
                );
              })}
            </g>
          );
        })}
      </svg>
      {/* Field Indicator at the bottom */}
      <div style={{
        marginTop: '12px', padding: '8px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.02)', textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.03)'
      }}>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🏟️ Field Direction (Bottom)
        </p>
      </div>
    </div>
  );
}

function RouteHereButton({ zoneName }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/directions', { state: { destination: zoneName } })}
      aria-label={`Get directions to ${zoneName}`}
      style={{
        width: '100%', padding: '16px', borderRadius: '16px',
        background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        color: 'white', fontWeight: 'bold', fontSize: '1rem',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
        border: 'none', cursor: 'pointer', transition: 'opacity 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <Navigation size={20} /> Get Directions Here
    </button>
  );
}

export default function ZoneBottomSheet({ selectedZone, match, onClose, highlightSeat }) {
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedRowGroup, setSelectedRowGroup] = useState(null);

  // Clear sub-page state when sheet closes, or auto-expand if highlighted
  useEffect(() => {
    if (!selectedZone) {
      setTimeout(() => {
        setSelectedShop(null);
        setSelectedRowGroup(null);
      }, 300); // delay clear until after transition
    } else if (highlightSeat && highlightSeat.tierId) {
      // Small delay to allow the sheet to animate in before opening the tier
      setTimeout(() => {
        const groupToSelect = SEATING_GROUPS.find(g => g.id === highlightSeat.tierId);
        if (groupToSelect) {
          setSelectedRowGroup(groupToSelect);
          // Wait for DOM to render the SeatingChart, then scroll to highlighted seat
          setTimeout(() => {
            const highlightedSeat = document.getElementById('highlighted-seat');
            const chartDiv = document.getElementById('seat-layout-view');
            
            if (highlightedSeat) {
               highlightedSeat.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else if (chartDiv) {
               chartDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }
      }, 400);
    }
  }, [selectedZone, highlightSeat]);

  // if (!selectedZone) return null; // Removed for smooth layout transitions

  const getStatusColor = (level) => {
    switch (level) {
      case 'red': return '#ef4444';
      case 'amber': return '#f59e0b';
      case 'green': return '#10b981';
      default: return '#10B981';
    }
  };

  const getStatusText = (level) => {
    switch (level) {
      case 'red': return 'Very Crowded';
      case 'amber': return 'Moderate';
      case 'green': return 'Quiet';
      default: return 'Unknown';
    }
  };

  const isShopGroup = selectedZone?.id?.includes('shops');
  const isSeatBlock = selectedZone?.id?.includes('block');
  const statusColor = selectedZone ? getStatusColor(selectedZone.level) : 'transparent';

  const sensorInsight = selectedZone && match
    ? getSensorInsights(match.time, selectedZone.type)
    : { reason: "Analyzing...", occupancy: 0 };


  // Helper to get block letter (e.g., "Block A" -> "A")
  const blockLetter = selectedZone?.name?.split(' ').pop() || '';

  // Generate dynamic row labels when a group is selected
  const dynamicRows = selectedRowGroup
    ? Array.from({ length: selectedRowGroup.count }, (_, i) => `${blockLetter}${selectedRowGroup.startNumber + i}`)
    : [];

  const hasSubSelection = selectedShop || selectedRowGroup;

  return (
    <div className="info-panel-container animate-slide-up" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(13, 17, 28, 0.9)',
      backdropFilter: 'blur(20px)',
      color: 'white',
      overflow: 'hidden'
    }}>
      {/* Sticky Header */}
      <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '24px', borderBottom: (isShopGroup || isSeatBlock || hasSubSelection) ? '1px solid rgba(255,255,255,0.05)' : 'none',
            flexShrink: 0
          }}>
            {hasSubSelection ? (
              <button 
                onClick={() => { setSelectedShop(null); setSelectedRowGroup(null); }} 
                aria-label="Go back to zone details"
                style={{ background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold', padding: 0 }}
              >
                <ChevronLeft size={24} /> Back
              </button>
            ) : (
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>{selectedZone.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor }}></div>
                  <span style={{ color: statusColor, fontWeight: '500', fontSize: '0.9rem' }}>
                    {getStatusText(selectedZone.level)}
                  </span>
                </div>
              </div>
            )}
            <button 
              onClick={onClose} 
              aria-label="Close information panel"
              style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%', color: 'white' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '0 24px',
            paddingBottom: 'calc(24px + 80px)' // safe area for bottom nav
          }}>

            {/* SHOP DIRECTORY LIST (Unified Box Design) */}
            {isShopGroup && !selectedShop && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '4px', fontWeight: 'bold' }}>Available Vendors</h3>
                {(selectedZone.id === 'shops_north' ? NORTH_SHOPS : SOUTH_SHOPS).map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => setSelectedShop(shop)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '20px', padding: '24px 20px',
                      display: 'flex', alignItems: 'center', gap: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: 'rgba(163, 157, 250, 0.1)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      color: '#34D399',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      <Store size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, color: 'white', fontSize: '1.2rem', marginBottom: '2px', fontWeight: 'bold' }}>{shop.name}</h4>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{shop.desc.substring(0, 40)}...</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SEATING BLOCK DIRECTORY (Matching User Plan Styles) */}
            {isSeatBlock && !selectedRowGroup && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'white', marginBottom: '4px', fontWeight: 'bold' }}>Seating Tiers</h3>
                {SEATING_GROUPS.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => setSelectedRowGroup(group)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '20px', padding: '24px 20px',
                      display: 'flex', alignItems: 'center', gap: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '16px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      color: '#34D399',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      <Users size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, color: 'white', fontSize: '1.2rem', marginBottom: '2px', fontWeight: 'bold' }}>{group.name}</h4>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', fontWeight: '500' }}>{group.rows}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* INDIVIDUAL SHOP DETAIL */}
            {selectedShop && (
              <div style={{ marginTop: '8px', animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', marginTop: 0 }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '16px',
                    background: 'rgba(163, 157, 250, 0.1)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    color: '#34D399', flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(163, 157, 250, 0.2)'
                  }}>
                    <Store size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', color: 'white', margin: 0 }}>{selectedShop.name}</h2>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedShop.desc}</p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '12px' }}>Current Menu</h3>
                  <div 
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                role="list"
                aria-label={`Menu for ${selectedShop.name}`}
              >
                {selectedShop.menu.map((item, idx) => (
                  <div 
                    key={idx} 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}
                    role="listitem"
                    aria-label={`${item.title}, Price: ${item.price}`}
                  >
                    <span style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '500' }}>{item.title}</span>
                    <span style={{ color: '#6ee7b7', fontSize: '0.9rem', fontWeight: '700', background: 'rgba(110,231,183,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{item.price}</span>
                  </div>
                ))}
              </div>
                </div>
              </div>
            )}

            {/* INDIVIDUAL SEAT GROUP DETAIL */}
            {selectedRowGroup && (
              <div style={{ marginTop: '8px', animation: 'fadeIn 0.3s ease-out' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '8px', marginTop: 0 }}>{selectedZone.name} - {selectedRowGroup.name}</h2>
                <p style={{ color: '#94a3b8', fontSize: '1rem', marginBottom: '24px' }}>{selectedRowGroup.rows}</p>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '20px', padding: '24px 20px', marginBottom: '24px',
                  display: 'flex', alignItems: 'flex-start', gap: '20px'
                }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    color: '#10B981', flexShrink: 0
                  }}>
                    <MapPin size={28} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, color: 'white', marginBottom: '4px', fontSize: '1.1rem', fontWeight: 'bold' }}>How to reach</h4>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      {selectedRowGroup.detail}. Follow the signs for {selectedZone.name} and enter through tunnel Level 1.
                    </p>
                  </div>
                </div>

                <div id="seat-layout-view" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} style={{ color: '#10B981' }} /> Actual Seat Layout
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 16px 0' }}>
                    Detailed level-wise seat arrangement for {selectedZone.name}
                  </p>

                  <SeatingChart rows={dynamicRows} blockName={selectedZone.name} highlightSeat={highlightSeat} />

                  <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
                    * Field is at the bottom of the view
                  </p>
                </div>
              </div>
            )}

            {/* MERCHANDISE STORE CUSTOM BLOCK */}
            {selectedZone.type === 'merch' && (
              <div style={{ marginTop: '16px', animation: 'fadeIn 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(127,119,221,0.05))', borderRadius: '20px', padding: '24px', border: '1px solid rgba(236,72,153,0.2)' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingBag size={20} color="#ec4899" />
                    Team Superstore
                  </h3>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                    Get your official team jerseys, caps, flags, and player memorabilia. Custom jersey printing available at Counter 3.
                  </p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ padding: '6px 12px', background: 'rgba(236,72,153,0.15)', color: '#ec4899', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>Jerseys</span>
                    <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', borderRadius: '8px', fontSize: '0.75rem' }}>Accessories</span>
                    <span style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', borderRadius: '8px', fontSize: '0.75rem' }}>Memorabilia</span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                     <div style={{ flex: 1 }}>
                       <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Match Day Hours</p>
                       <p style={{ margin: '4px 0 0 0', color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>3:00 PM - 11:30 PM</p>
                     </div>
                     <div style={{ flex: 1 }}>
                       <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Queue Status</p>
                       <p style={{ margin: '4px 0 0 0', color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold' }}>Light Queue</p>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE SENSOR DASHBOARD (Replaces Graph - Hidden for Seats) */}
            {(!isShopGroup && !isSeatBlock) && (
              <div style={{
                marginBottom: '24px', marginTop: hasSubSelection ? '16px' : 0,
                animation: 'fadeIn 0.3s ease-out',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '20px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', background: statusColor,
                        boxShadow: `0 0 10px ${statusColor}`,
                        animation: 'pulse 1.5s infinite'
                      }}></div>
                      Live Sensor #{(selectedZone?.id?.length || 0) + 100}
                    </h3>
                    <p style={{ fontSize: '1.25rem', color: 'white', fontWeight: 'bold', marginTop: '8px', marginBottom: 0 }}>
                      {sensorInsight.occupancy}% Occupancy
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                    {match?.status || 'Live'}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px', borderLeft: `4px solid ${statusColor}` }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                    <span style={{ color: '#94a3b8', fontWeight: '500' }}>Insight: </span>
                    {sensorInsight.reason}
                  </p>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: '#64748b' }}>
                  <Clock size={12} />
                  Last verification: Just now
                </div>
              </div>
            )}

            {(!isShopGroup && !isSeatBlock || hasSubSelection) && (
              <RouteHereButton zoneName={selectedZone?.name} />
            )}
          </div>

    </div>
  );
}
