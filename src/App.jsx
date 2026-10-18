import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { StartScreen } from './components/StartScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverScreen } from './components/GameOverScreen';
import { MobileControls } from './components/MobileControls';
import { soundManager } from './audio/SoundManager';

export default function App() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const hudRef = useRef(null);

  const [gameState, setGameState] = useState('START'); // 'START' | 'PLAYING' | 'GAME_OVER'
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted());
  const [gameOverStats, setGameOverStats] = useState(null);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('astrovanguard_highscore') || '0', 10);
  });

  // Handle Game Over
  const handleGameOver = useCallback((stats) => {
    setGameOverStats(stats);
    setHighScore(stats.highScore);
    setGameState('GAME_OVER');
  }, []);

  // Handle HUD Updates at 60fps without triggering React re-renders
  const handleHUDUpdate = useCallback((stats) => {
    if (hudRef.current) {
      hudRef.current.updateStats(stats);
    }
  }, []);

  // Handle Floating Dodge Alerts
  const handleDodgeAlert = useCallback((dodgeData) => {
    if (hudRef.current) {
      hudRef.current.showDodgeAlert(dodgeData);
    }
  }, []);

  // Start mission
  const handleStartMission = useCallback(() => {
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  // Restart mission
  const handleRestartMission = useCallback(() => {
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.restart();
    }
  }, []);

  // Initialize GameEngine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onGameOver: handleGameOver,
      onHUDUpdate: handleHUDUpdate,
      onDodgeAlert: handleDodgeAlert,
      onAutoStart: handleStartMission,
      onRestart: handleRestartMission
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [handleGameOver, handleHUDUpdate, handleDodgeAlert, handleStartMission, handleRestartMission]);

  // Audio mute toggle
  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  // Mobile virtual steering
  const handleVirtualInput = (dir) => {
    if (engineRef.current) {
      engineRef.current.setVirtualInput(dir);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Three.js Canvas Container */}
      <div 
        ref={containerRef} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} 
      />

      {/* Atmospheric CRT & Vignette Overlays */}
      <div className="scanlines" />
      <div className="vignette" />

      {/* Screen Views */}
      {gameState === 'START' && (
        <StartScreen
          onStart={handleStartMission}
          highScore={highScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'PLAYING' && (
        <>
          <GameHUD
            ref={hudRef}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
          <MobileControls onInput={handleVirtualInput} />
        </>
      )}

      {gameState === 'GAME_OVER' && gameOverStats && (
        <GameOverScreen
          stats={gameOverStats}
          onRestart={handleRestartMission}
        />
      )}
    </div>
  );
}
