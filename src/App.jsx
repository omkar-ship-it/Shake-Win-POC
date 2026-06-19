import { useCallback, useState } from 'react';
import { useShake } from './useShake';
import './App.css';

const REWARDS = [
  '🎉 ₹50 off your next visit',
  '☕ Free coffee on us!',
  '🎁 Mystery gift waiting for you',
  '💥 10% off your entire bill',
  '🌟 Double loyalty points today',
  '🍰 Complimentary dessert',
];

function pickReward() {
  return REWARDS[Math.floor(Math.random() * REWARDS.length)];
}

export default function App() {
  const [phase, setPhase] = useState('idle'); // idle | shaking | revealed
  const [reward, setReward] = useState(null);
  const [shakeCount, setShakeCount] = useState(0);

  const handleShake = useCallback(() => {
    setShakeCount(c => c + 1);
    setPhase('shaking');

    setTimeout(() => {
      setReward(pickReward());
      setPhase('revealed');
    }, 600);
  }, []);

  const { permissionState, requestPermission } = useShake(handleShake);

  function reset() {
    setPhase('idle');
    setReward(null);
  }

  function handleTriggerButton() {
    if (permissionState === 'needs-prompt') {
      requestPermission();
      return;
    }
    handleShake();
  }

  return (
    <div className="app">
      <header className="header">
        <span className="logo">⚡ Shake &amp; Win</span>
        <span className="badge">POC</span>
      </header>

      <main className="stage">
        <div className={`phone ${phase === 'shaking' ? 'phone--shaking' : ''}`}>
          {phase === 'revealed' ? (
            <div className="phone__reward">
              <div className="reward-emoji">🎊</div>
              <p className="reward-text">{reward}</p>
            </div>
          ) : (
            <div className="phone__idle">
              <div className="shake-icon">📱</div>
              <p>{phase === 'shaking' ? 'Shaking…' : 'Shake me!'}</p>
            </div>
          )}
        </div>

        <div className="instructions">
          {permissionState === 'unsupported' && (
            <p className="status status--warn">
              Motion not supported on this device.<br />Use the button below to simulate.
            </p>
          )}
          {permissionState === 'denied' && (
            <p className="status status--error">
              Motion access denied. Enable it in Settings → Safari → Motion &amp; Orientation.
            </p>
          )}
          {permissionState === 'granted' && phase === 'idle' && (
            <p className="status">Shake your phone to reveal a reward!</p>
          )}
          {permissionState === 'needs-prompt' && (
            <p className="status">Tap the button to enable shake detection.</p>
          )}
        </div>

        <div className="actions">
          {phase === 'revealed' ? (
            <button className="btn btn--secondary" onClick={reset}>
              Shake Again
            </button>
          ) : (
            <button
              className="btn btn--primary"
              onClick={handleTriggerButton}
              disabled={phase === 'shaking'}
            >
              {permissionState === 'needs-prompt'
                ? 'Enable Shake Detection'
                : phase === 'shaking'
                ? 'Shaking…'
                : 'Tap to Shake (Desktop)'}
            </button>
          )}
        </div>

        {shakeCount > 0 && (
          <p className="shake-count">Shakes detected: {shakeCount}</p>
        )}
      </main>

      <footer className="debug">
        <code>permissionState: {permissionState}</code>
      </footer>
    </div>
  );
}
