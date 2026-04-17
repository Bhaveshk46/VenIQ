import React, { useState, useEffect } from 'react';
import { onValue } from 'firebase/database';
import { feedRef } from '../../services/firebase';
import { Activity, Clock, AlertCircle } from 'lucide-react';

export default function LiveFeedScreen() {
  const [feed, setFeed] = useState([
    { id: 'initial', text: 'Welcome to Stadium Live Updates. We keep you informed about crowd levels.', timeLabel: 'Now', timestamp: Date.now() }
  ]);

  useEffect(() => {
    const unsub = onValue(feedRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const feedArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        setFeed(feedArray);
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="animate-fade-in" style={{ padding: '20px' }}>
      <div className="screen-header" style={{ padding: '20px 0 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="screen-title">Live Updates</h1>
          <p style={{ color: 'var(--text-muted)' }}>Real-time stadium activity.</p>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'fadeIn 1s infinite alternate' }}></div>
          <span style={{ color: '#34D399', fontWeight: 'bold', fontSize: '0.9rem' }}>LIVE</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {feed.map((item, index) => (
          <div 
            key={item.id} 
            className="glass-panel" 
            style={{ 
              padding: '20px', 
              display: 'flex', gap: '16px',
              animation: `fadeIn 0.5s ease forwards ${index * 0.1}s`,
              opacity: 0,
              transform: 'translateY(10px)',
              borderLeft: '4px solid #10B981'
            }}
          >
            <div style={{ 
              minWidth: '40px', height: '40px', borderRadius: '12px', 
              background: 'rgba(255,255,255,0.05)', 
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: '#34D399'
            }}>
              <AlertCircle size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {item.timeLabel}
                </span>
                <span style={{ color: '#f8fafc', fontSize: '0.8rem', opacity: 0.5 }}>
                  {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p style={{ color: 'white', lineHeight: '1.5', margin: 0, fontSize: '1rem' }}>
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
