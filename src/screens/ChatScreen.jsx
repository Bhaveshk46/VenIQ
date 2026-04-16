import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap, MapPin } from 'lucide-react';
import { getGeminiResponse } from '../../services/gemini';
import { useStadium } from '../contexts/StadiumContext';
import { MAX_CHAT_INPUT_LENGTH } from '../utils/constants';

const SUGGESTED_PROMPTS = [
  "🏪 What shops are near me?",
  "🚻 Where's the restroom?",
  "🏥 How do I reach Medical Bay?",
  "🚪 Which exit gate is nearest?",
  "🛍️ Where's the merch store?",
  "🚕 How do I get home after the match?",
];

export default function ChatScreen() {
  const { selectedZone, matchData, crowdLevels } = useStadium();

  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', text: "Hey! I'm VenIQ ✨\n\nI'm your official stadium concierge. Ask me for directions, the best snacks, or help finding your gate!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const scrollViewRef = useRef(null);

  // Handle cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTop = scrollViewRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text) => {
    let userMsg = (text || input).trim();
    if (!userMsg || cooldown > 0) return;

    // SECURITY FIX: Sanitize input (strip simple HTML tags) and limit length
    userMsg = userMsg.replace(/<[^>]*>?/gm, '').substring(0, MAX_CHAT_INPUT_LENGTH);
    
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    setLoading(true);
    setCooldown(8); // Start 8s cooldown to respect API rate limit

    const context = {
      matchTime: matchData?.time || 0,
      matchStatus: matchData?.status || 'Pre-match',
      crowdLevels,
      userZone: selectedZone ? {
        name: selectedZone.name,
        type: selectedZone.type,
        id: selectedZone.id,
      } : null,
    };

    // Format history for Gemini (last 6 messages)
    // CRITICAL: Gemini requires history to start with a 'user' role.
    let history = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
    }));

    // Find the first user message and slice the history from there
    const firstUserIndex = history.findIndex(h => h.role === 'user');
    if (firstUserIndex !== -1) {
      history = history.slice(firstUserIndex);
    } else {
      history = []; // Default to empty if no user message yet (though handled by handleSend)
    }

    // Keep only the last 6 messages of history for efficiency
    history = history.slice(-6);

    const reply = await getGeminiResponse(userMsg, context, history);
    setMessages(prev => [...prev, { id: Date.now().toString() + 'bot', role: 'assistant', text: reply }]);
    setLoading(false);
  };

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#080c14' }}>

      {/* Header */}
      <div style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '16px',
        background: 'rgba(17, 24, 39, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div aria-hidden="true" style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #7f77dd, #a39dfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(127,119,221,0.3)' }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>AI Concierge</h1>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6ee7b7', display: 'inline-block' }}></span>
                Powered by Gemini
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(127,119,221,0.15)', border: '1px solid rgba(127,119,221,0.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', color: '#a39dfa' }}>
              <Zap size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {matchData?.status || 'Pre-match'}
            </div>
          </div>
        </div>

        {/* Zone Context Badge */}
        {selectedZone && (
          <div style={{ marginTop: '10px', background: 'rgba(127,119,221,0.1)', border: '1px solid rgba(127,119,221,0.2)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.78rem', color: '#c4c0f5', display: 'flex', alignItems: 'center', gap: '6px', animation: 'fadeIn 0.3s' }}>
            <MapPin size={12} color="#a39dfa" />
            <span>Currently viewing: <strong style={{ color: 'white' }}>{selectedZone.name}</strong> — Ask me anything about this zone!</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollViewRef} 
        role="log"
        aria-live="polite"
        style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}
      >

        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex', gap: '10px',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            maxWidth: '88%', animation: 'fadeIn 0.3s ease-out'
          }}>
            <div 
              aria-hidden="true"
              style={{ minWidth: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, background: msg.role === 'user' ? '#7f77dd' : 'rgba(255,255,255,0.08)', boxShadow: msg.role === 'user' ? '0 4px 12px rgba(127,119,221,0.4)' : 'none' }}>
              {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="#a39dfa" />}
            </div>
            <div 
              role="article"
              aria-label={msg.role === 'user' ? "You said" : "VenIQ said"}
              style={{ padding: '11px 15px', borderRadius: '18px', borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '18px', borderTopRightRadius: msg.role === 'user' ? '4px' : '18px', background: msg.role === 'user' ? 'linear-gradient(135deg, #7f77dd 0%, #635ac7 100%)' : 'rgba(255,255,255,0.04)', border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none', boxShadow: msg.role === 'user' ? '0 4px 20px rgba(127,119,221,0.2)' : '0 2px 8px rgba(0,0,0,0.2)' }}>
              <p style={{ color: 'white', lineHeight: '1.6', fontSize: '0.92rem', margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }} aria-label="VenIQ is thinking">
            <div style={{ minWidth: '30px', height: '30px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.08)', flexShrink: 0 }}>
              <Bot size={14} color="#a39dfa" />
            </div>
            <div style={{ padding: '14px 18px', borderRadius: '18px', borderTopLeftRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7f77dd', animation: `bounce 1.2s ${delay}s infinite ease-in-out` }} />
              ))}
            </div>
          </div>
        )}

        {/* Suggestion chips */}
        {showSuggestions && (
          <div style={{ marginTop: '4px', animation: 'fadeIn 0.5s' }} role="complementary" aria-label="Suggested questions">
            <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 10px', textAlign: 'center' }}>Quick questions:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {SUGGESTED_PROMPTS.map(prompt => (
                <button 
                  key={prompt} 
                  onClick={() => handleSend(prompt)} 
                  aria-label={`Ask: ${prompt}`}
                  style={{ padding: '7px 13px', background: 'rgba(127,119,221,0.08)', border: '1px solid rgba(127,119,221,0.2)', borderRadius: '20px', color: '#c4c0f5', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div 
        style={{ padding: '12px 14px', background: 'rgba(15, 20, 35, 0.98)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '10px', alignItems: 'center' }}
        role="form"
        aria-label="Send message to concierge"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={loading || cooldown > 0}
          placeholder={cooldown > 0 ? `Cooling down (${cooldown}s)...` : "Ask anything..."}
          aria-label="Message input field"
          style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', fontSize: '0.92rem', opacity: cooldown > 0 ? 0.6 : 1 }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim() || cooldown > 0}
          aria-label="Send message"
          title="Send message"
          style={{ minWidth: '46px', height: '46px', borderRadius: '50%', background: (!input.trim() || loading || cooldown > 0) ? 'rgba(127,119,221,0.3)' : 'linear-gradient(135deg, #7f77dd, #635ac7)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: (loading || cooldown > 0) ? 'wait' : 'pointer', boxShadow: (!input.trim() || loading || cooldown > 0) ? 'none' : '0 4px 15px rgba(127,119,221,0.4)', transition: 'all 0.3s' }}
        >
          <Send size={17} color="white" />
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.6; } 30% { transform: translateY(-6px); opacity: 1; } }
      `}</style>
    </div>
  );
}
