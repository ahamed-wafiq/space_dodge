import React, { useEffect } from 'react';
import { Play, Volume2, VolumeX, Shield, Zap } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

export function StartScreen({ onStart, highScore, isMuted, onToggleMute }) {
  const handleStart = () => {
    soundManager.playClick();
    onStart();
  };

  const handleMute = (e) => {
    e.stopPropagation();
    soundManager.playClick();
    onToggleMute();
  };

  // Keyboard shortcut: Space, Enter, or Arrow Keys automatically launch mission
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="screen-overlay" onClick={handleStart}>
      {/* Background radial glow */}
      <div 
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,240,255,0.18) 0%, rgba(3,7,18,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Glassmorphic Card */}
      <div 
        className="glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '22px',
          zIndex: 30
        }}
      >
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: 'var(--neon-cyan)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            fontWeight: 700
          }}>
            <Shield size={16} /> SYSTEM: ONLINE
          </div>

          <button
            onClick={handleMute}
            type="button"
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              color: isMuted ? '#94a3b8' : 'var(--neon-cyan)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '1px'
            }}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
          </button>
        </div>

        {/* Title */}
        <div>
          <h1 
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 900,
              letterSpacing: '3px',
              background: 'linear-gradient(180deg, #ffffff 20%, #00f0ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 25px rgba(0, 240, 255, 0.5)',
              margin: '0 0 6px 0'
            }}
          >
            SPACE DODGE
          </h1>
          <div 
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              letterSpacing: '3px',
              color: 'var(--neon-orange)',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            // ALIEN CANYON: VOLCANIC TRENCH RUN
          </div>
        </div>

        {/* High Score Pill */}
        <div 
          style={{
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            borderRadius: '24px',
            padding: '8px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Zap size={18} color="var(--neon-orange)" />
          <span style={{ fontSize: '0.85rem', letterSpacing: '2px', color: '#94a3b8' }}>HIGH RECORD:</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
            {highScore.toLocaleString()} PTS
          </span>
        </div>

        {/* Controls Guide */}
        <div 
          style={{
            width: '100%',
            background: 'rgba(2, 6, 23, 0.75)',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700 }}>
            MISSION CONTROLS
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={kbdStyle}>A</kbd>
              <span style={{ color: '#64748b' }}>or</span>
              <kbd style={kbdStyle}>←</kbd>
              <span style={{ color: '#e2e8f0', marginLeft: '4px', fontWeight: 600 }}>STEER LEFT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={kbdStyle}>D</kbd>
              <span style={{ color: '#64748b' }}>or</span>
              <kbd style={kbdStyle}>→</kbd>
              <span style={{ color: '#e2e8f0', marginLeft: '4px', fontWeight: 600 }}>STEER RIGHT</span>
            </div>
          </div>
        </div>

        {/* Big Launch Button */}
        <button
          onClick={handleStart}
          type="button"
          className="cyber-btn pulse-glow"
          style={{
            width: '100%',
            padding: '18px 32px',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          <Play size={22} fill="currentColor" />
          START MISSION [SPACE]
        </button>
      </div>
    </div>
  );
}

const kbdStyle = {
  background: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(0, 240, 255, 0.5)',
  boxShadow: '0 2px 0 rgba(0, 240, 255, 0.35)',
  borderRadius: '4px',
  padding: '4px 10px',
  fontFamily: 'var(--font-display)',
  fontSize: '0.9rem',
  color: 'var(--neon-cyan)',
  fontWeight: 800
};
