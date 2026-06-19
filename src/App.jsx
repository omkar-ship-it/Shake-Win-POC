import { useCallback, useEffect, useRef, useState } from 'react';
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

// Fires onTick every 16ms while the button is held, simulating continuous motion events
function SimulateButton({ onTick }) {
  const intervalRef = useRef(null);

  function start() {
    onTick();
    intervalRef.current = setInterval(onTick, 16);
  }
  function stop() {
    clearInterval(intervalRef.current);
  }
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <button
      className="btn btn--ghost"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
    >
      Hold to Simulate Shake
    </button>
  );
}

// Bar color: grey → amber → green
function barColor(pct) {
  if (pct < 50) return '#6b7280';
  if (pct < 80) return '#f59e0b';
  return '#6bc670';
}

// Contextual hint based on intensity
function hint(pct, phase) {
  if (phase === 'revealed') return '';
  if (pct === 0)   return 'Shake your phone to fill the bar!';
  if (pct < 40)   return 'Keep going…';
  if (pct < 70)   return 'Shake harder! 💪';
  if (pct < 100)  return 'Almost there! 🔥';
  return 'Hold it! ⚡';
}

export default function App() {
  const [phase, setPhase] = useState('idle'); // idle | revealed
  const [reward, setReward] = useState(null);
  const [shakeCount, setShakeCount] = useState(0);

  const handleShake = useCallback(() => {
    setShakeCount(c => c + 1);
    setReward(pickReward());
    setPhase('revealed');
  }, []);

  const { permissionState, requestPermission, intensity, simulateShake, resetIntensity } = useShake(handleShake);

  function reset() {
    resetIntensity();
    setPhase('idle');
    setReward(null);
  }

  const color = barColor(intensity);
  const isAtMax = intensity >= 100;

  return (
    <div className="app">
      <header className="header">
        <span className="logo">⚡ Shake &amp; Win</span>
        <span className="badge">POC</span>
      </header>

      <main className="stage">

        {/* Phone graphic */}
        <div className={`phone ${isAtMax && phase === 'idle' ? 'phone--maxed' : ''}`}>
          {phase === 'revealed' ? (
            <div className="phone__reward">
              <div className="reward-emoji">🎊</div>
              <p className="reward-text">{reward}</p>
            </div>
          ) : (
            <div className="phone__idle">
              <div className="shake-icon" style={{ transform: `scale(${1 + intensity * 0.004})` }}>📱</div>
              <p className="idle-label">Shake me!</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {phase !== 'revealed' && (
          <div className="meter">
            <div className="meter__track">
              <div
                className={`meter__fill ${isAtMax ? 'meter__fill--pulse' : ''}`}
                style={{ width: `${intensity}%`, background: color }}
              />
            </div>
            <div className="meter__labels">
              <span className="meter__pct" style={{ color }}>{intensity}%</span>
              <span className="meter__hint">{hint(intensity, phase)}</span>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="instructions">
          {permissionState === 'unsupported' && (
            <p className="status status--warn">
              Motion API not available — use the button to simulate.
            </p>
          )}
          {permissionState === 'denied' && (
            <p className="status status--error">
              Motion access denied.<br />
              Settings → Safari → Motion &amp; Orientation Access.
            </p>
          )}
          {permissionState === 'needs-prompt' && (
            <p className="status">Tap below to enable shake detection.</p>
          )}
        </div>

        {/* Actions */}
        <div className="actions">
          {phase === 'revealed' ? (
            <button className="btn btn--secondary" onClick={reset}>
              Shake Again
            </button>
          ) : permissionState === 'needs-prompt' ? (
            <button className="btn btn--primary" onClick={requestPermission}>
              Enable Shake Detection
            </button>
          ) : (permissionState === 'unsupported' || permissionState === 'granted') && (
            <SimulateButton onTick={simulateShake} />
          )}
        </div>

        {shakeCount > 0 && phase !== 'revealed' && (
          <p className="shake-count">Rewards won: {shakeCount}</p>
        )}
      </main>

      <footer className="debug">
        <code>permissionState: {permissionState} · intensity: {intensity}</code>
      </footer>
    </div>
  );
}
