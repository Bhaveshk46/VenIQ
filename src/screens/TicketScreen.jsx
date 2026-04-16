import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';

// Generate deterministic seat data from user UID
function generateTicketFromUID(uid) {
  if (!uid) return null;

  // Simple hash from UID string
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash) + uid.charCodeAt(i);
    hash |= 0; // Convert to 32-bit int
  }
  hash = Math.abs(hash);

  const blocks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const tiers = [
    { id: 'lower', name: 'Lower Tier', rowStart: 1, rowEnd: 15 },
    { id: 'club', name: 'Club Level', rowStart: 16, rowEnd: 30 },
    { id: 'vip', name: 'VIP Boxes', rowStart: 31, rowEnd: 35 }
  ];

  const block = blocks[hash % blocks.length];
  const tier = tiers[(hash >> 3) % tiers.length];
  const row = tier.rowStart + (hash % (tier.rowEnd - tier.rowStart + 1));
  const seatSegment = ((hash >> 8) % 3) + 1; // 1, 2, or 3
  const seatInSegment = ((hash >> 11) % 4) + 1; // 1–4
  const seatNo = seatSegment * 100 + seatInSegment;
  const gate = ((hash >> 5) % 4) + 1;

  // Dynamic Date Logic: If it's after 8 PM, show tomorrow, otherwise show today.
  const matchDate = new Date();
  if (matchDate.getHours() >= 20) {
    matchDate.setDate(matchDate.getDate() + 1);
  }

  // Formatting for a premium look
  const dateStr = matchDate.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return {
    eventName: "IPL 2026 — MI vs CSK",
    stadium: "Wankhede Stadium, Mumbai",
    date: dateStr,
    time: "19:30 IST",
    gate: `Gate ${gate}`,
    blockId: `block_${block.toLowerCase()}`,
    blockName: `Block ${block}`,
    tierId: tier.id,
    tierName: tier.name,
    row: `${block}${row}`,
    rowNumber: row,
    seat: `${seatNo}`,
    code: `${block}-${row}-${seatNo}`
  };
}

export default function TicketScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const ticket = useMemo(() => generateTicketFromUID(user?.uid), [user?.uid]);

  const findMySeat = () => {
    if (ticket) {
      navigate(`/?seat=${ticket.code}`);
    }
  };

  if (!ticket) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        No ticket found.
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100%', 
      padding: '24px', 
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 40px)', // Increased padding for safety
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
    }}>
      <div style={{ 
        display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px', width: '100%',
        animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        paddingBottom: '120px' // Extra space at bottom to clear nav
      }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Ticket size={28} color="#7f77dd" /> My Tickets
        </h1>

        <div style={{
          background: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(12px)',
          borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}>
          {/* Ticket Header */}
          <div style={{ background: 'linear-gradient(135deg, #7f77dd 0%, #4f46e5 100%)', padding: '24px', color: 'white' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>{ticket.eventName}</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>{ticket.stadium}</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.9rem', opacity: 0.9 }}>
              <span>📅 {ticket.date}</span>
              <span>⏱️ {ticket.time}</span>
            </div>
          </div>

          {/* Dash Line */}
          <div style={{ height: '0', borderTop: '2px dashed rgba(255,255,255,0.1)', position: 'relative' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0a0f1c', position: 'absolute', left: '-10px', top: '-10px' }}></div>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#0a0f1c', position: 'absolute', right: '-10px', top: '-10px' }}></div>
          </div>

          {/* Ticket Data */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Entry Gate</p>
                <p style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>{ticket.gate}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Block</p>
                <p style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>{ticket.blockName}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Tier</p>
                <p style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 'bold' }}>{ticket.tierName}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Seat</p>
                <p style={{ margin: 0, color: '#f59e0b', fontSize: '1.4rem', fontWeight: '900' }}>{ticket.row} - {ticket.seat}</p>
              </div>
            </div>

            {/* Real QR Code */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <QRCodeSVG
                value={`VENIQ-TICKET:${ticket.code}|${ticket.eventName}|${ticket.stadium}`}
                size={160}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            <button 
              onClick={findMySeat}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #7f77dd 0%, #a39dfa 100%)',
                color: 'white', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', cursor: 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                boxShadow: '0 4px 15px rgba(127, 119, 221, 0.4)'
              }}
            >
              Find My Seat <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
