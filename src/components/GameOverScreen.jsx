import React from 'react';
import { RotateCcw, Trophy, Clock, Target, Gauge, AlertTriangle } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

export function GameOverScreen({ stats, onRestart }) {
  const { finalScore, highScore, survivalTime, obstaclesDodged, maxSpeed, isNewRecord } = stats;

  const handleRestart = () => {
    soundManager.playClick();
    onRestart();
  };

  const mins = Math.floor(survivalTime / 60);
  const secs = Math.floor(survivalTime % 60);
  const ms = Math.floor((survivalTime % 1) * 10);
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;

  return (
    <div className="screen-overlay">
      {/* Background red emergency alert glow */}
      <div 
        style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(255,42,95,0.2) 0%, rgba(3,7,18,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Glassmorphic Panel */}
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '22px',
          borderColor: 'rgba(255, 42, 95, 0.45)',
          boxShadow: '0 0 35px rgba(255, 42, 95, 0.3), inset 0 0 20px rgba(255, 42, 95, 0.1)',
          zIndex: 30
        }}
      >
        {/* Warning Indicator */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--neon-red)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: 800
          }}
        >
          <AlertTriangle size={18} /> CRITICAL HULL COLLAPSE
        </div>

        {/* Title */}
        <div>
          <h1 
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.4rem',
              fontWeight: 900,
              letterSpacing: '3px',
              background: 'linear-gradient(180deg, #ffffff 15%, #ff2a5f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 25px rgba(255, 42, 95, 0.6)',
              margin: '0 0 6px 0'
            }}
          >
            MISSION TERMINATED
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', letterSpacing: '1px' }}>
            Spaceship disintegrated in alien canyon collision.
          </p>
        </div>

        {/* Final Score Banner */}
        <div 
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            position: 'relative'
          }}
        >
          {isNewRecord && (
            <div 
              style={{
                position: 'absolute',
                top: '-12px',
                background: 'linear-gradient(90deg, #ff7700, #ff2a5f)',
                padding: '3px 14px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '1.5px',
                boxShadow: '0 0 15px rgba(255, 119, 0, 0.75)'
              }}
            >
              ★ NEW RECORD ★
            </div>
          )}

          <div style={{ fontSize: '0.8rem', letterSpacing: '2px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            FINAL MISSION SCORE
          </div>
          <div 
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.6rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '2px',
              textShadow: '0 0 18px rgba(0, 240, 255, 0.65)'
            }}
          >
            {finalScore.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#38bdf8' }}>
            <Trophy size={16} color="var(--neon-orange)" />
            <span>RECORD: {highScore.toLocaleString()} PTS</span>
          </div>
        </div>

        {/* Flight Telemetry Grid */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            width: '100%'
          }}
        >
          <div style={statBoxStyle}>
            <Clock size={16} color="var(--neon-cyan)" />
            <span style={statLabelStyle}>TIME</span>
            <span style={statValStyle}>{timeFormatted}</span>
          </div>

          <div style={statBoxStyle}>
            <Target size={16} color="var(--neon-orange)" />
            <span style={statLabelStyle}>DODGED</span>
            <span style={statValStyle}>{obstaclesDodged}</span>
          </div>

          <div style={statBoxStyle}>
            <Gauge size={16} color="var(--neon-emerald)" />
            <span style={statLabelStyle}>MAX VEL</span>
            <span style={statValStyle}>{maxSpeed} KM/S</span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          type="button"
          className="cyber-btn cyber-btn-red"
          style={{
            width: '100%',
            padding: '18px 32px',
            fontSize: '1.15rem',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={22} />
          REDEPLOY SHIP [SPACE]
        </button>
      </div>
    </div>
  );
}

const statBoxStyle = {
  background: 'rgba(2, 6, 23, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '8px',
  padding: '12px 8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
};

const statLabelStyle = {
  fontSize: '0.7rem',
  color: '#94a3b8',
  letterSpacing: '1px',
  fontWeight: 700
};

const statValStyle = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.05rem',
  fontWeight: 800,
  color: '#fff'
};
