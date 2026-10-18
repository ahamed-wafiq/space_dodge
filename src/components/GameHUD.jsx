import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Gauge, Clock, Target } from 'lucide-react';

export const GameHUD = forwardRef(function GameHUD({ onToggleMute, isMuted }, ref) {
  const scoreValRef = useRef(null);
  const speedValRef = useRef(null);
  const speedBarRef = useRef(null);
  const timeValRef = useRef(null);
  const multiplierValRef = useRef(null);
  const dodgeCountRef = useRef(null);
  const alertsContainerRef = useRef(null);

  // Expose direct DOM update methods to bypass React re-renders for 60fps stats
  useImperativeHandle(ref, () => ({
    updateStats: ({ score, speed, time, combo, multiplier, dodged }) => {
      if (scoreValRef.current) {
        scoreValRef.current.innerText = score.toLocaleString();
      }
      if (speedValRef.current) {
        speedValRef.current.innerText = `${speed} KM/S`;
      }
      if (speedBarRef.current) {
        const pct = Math.min(100, Math.max(15, (speed / 180) * 100));
        speedBarRef.current.style.width = `${pct}%`;
      }
      if (timeValRef.current) {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 10);
        timeValRef.current.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
      }
      if (dodgeCountRef.current) {
        dodgeCountRef.current.innerText = dodged.toString();
      }
      if (multiplierValRef.current) {
        if (multiplier > 1) {
          multiplierValRef.current.innerText = `${multiplier}X COMBO`;
          multiplierValRef.current.style.opacity = '1';
        } else {
          multiplierValRef.current.style.opacity = '0';
        }
      }
    },

    showDodgeAlert: ({ points, multiplier }) => {
      if (!alertsContainerRef.current) return;
      const el = document.createElement('div');
      el.className = 'dodge-alert';
      el.innerText = `+${points} EVADED! ${multiplier > 1 ? `(${multiplier}X)` : ''}`;
      alertsContainerRef.current.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 850);
    }
  }));

  return (
    <div className="hud-overlay">
      {/* Floating Alerts Container */}
      <div 
        ref={alertsContainerRef} 
        style={{
          position: 'absolute',
          top: '32%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      />

      {/* Top HUD Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        {/* Score & Combo */}
        <div 
          className="glass-panel"
          style={{
            padding: '12px 20px',
            minWidth: '200px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '2px', color: '#94a3b8', fontWeight: 700 }}>
              MISSION SCORE
            </span>
            <span
              ref={multiplierValRef}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                fontWeight: 900,
                color: 'var(--neon-orange)',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                letterSpacing: '1px'
              }}
            >
              1X COMBO
            </span>
          </div>

          <div 
            ref={scoreValRef}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '2px',
              textShadow: '0 0 14px rgba(0, 240, 255, 0.7)'
            }}
          >
            0
          </div>
        </div>

        {/* Survival Timer */}
        <div 
          className="glass-panel"
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Clock size={20} color="var(--neon-cyan)" />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1.5px', fontWeight: 700 }}>
              SURVIVAL TIME
            </div>
            <div 
              ref={timeValRef}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#38bdf8',
                letterSpacing: '1.5px'
              }}
            >
              00:00.0
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        {/* Speedometer & Warp Drive Bar */}
        <div 
          className="glass-panel"
          style={{
            padding: '12px 20px',
            minWidth: '220px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1.5px', fontWeight: 700 }}>
              <Gauge size={16} color="var(--neon-cyan)" />
              WARP VELOCITY
            </div>
            <div 
              ref={speedValRef}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--neon-cyan)',
                textShadow: '0 0 10px rgba(0, 240, 255, 0.7)'
              }}
            >
              38 KM/S
            </div>
          </div>

          {/* Speed Progress Meter */}
          <div 
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(15, 23, 42, 0.9)',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 240, 255, 0.25)'
            }}
          >
            <div 
              ref={speedBarRef}
              style={{
                height: '100%',
                width: '18%',
                background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-orange))',
                boxShadow: '0 0 10px var(--neon-cyan)',
                transition: 'width 0.1s linear'
              }}
            />
          </div>
        </div>

        {/* Dodged Obstacles Pill */}
        <div 
          className="glass-panel"
          style={{
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Target size={20} color="var(--neon-orange)" />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px', fontWeight: 700 }}>
              OBSTACLES DODGED
            </div>
            <div 
              ref={dodgeCountRef}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#fff'
              }}
            >
              0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
