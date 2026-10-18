import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function MobileControls({ onInput }) {
  const handleTouchStart = (dir) => (e) => {
    e.preventDefault();
    onInput(dir);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    onInput(0);
  };

  return (
    <div className="mobile-controls">
      <button
        type="button"
        onTouchStart={handleTouchStart(-1)}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => onInput(-1)}
        onMouseUp={() => onInput(0)}
        aria-label="Steer Left"
        style={touchBtnStyle}
      >
        <ChevronLeft size={38} color="var(--neon-cyan)" />
      </button>

      <button
        type="button"
        onTouchStart={handleTouchStart(1)}
        onTouchEnd={handleTouchEnd}
        onMouseDown={() => onInput(1)}
        onMouseUp={() => onInput(0)}
        aria-label="Steer Right"
        style={touchBtnStyle}
      >
        <ChevronRight size={38} color="var(--neon-cyan)" />
      </button>
    </div>
  );
}

const touchBtnStyle = {
  pointerEvents: 'auto',
  width: '76px',
  height: '76px',
  borderRadius: '50%',
  background: 'rgba(6, 15, 33, 0.75)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '2px solid rgba(0, 240, 255, 0.5)',
  boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  outline: 'none',
  touchAction: 'none'
};
