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

const RADIUS = 100;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 628.3

function ringColor(pct) {
  if (pct < 50) return '#6b7280';
  if (pct < 80) return '#f59e0b';
  return '#6bc670';
}

function hint(pct) {
  if (pct === 0)  return 'Shake your phone!';
  if (pct < 40)  return 'Keep going…';
  if (pct < 70)  return 'Shake harder! 💪';
  if (pct < 100) return 'Almost there! 🔥';
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

  const color = ringColor(intensity);
  const isAtMax = intensity >= 100;
  const offset = CIRCUMFERENCE * (1 - intensity / 100);

  return (
    <div className="app">
      <header className="header">
        <span className="logo">⚡ Shake &amp; Win</span>
        <span className="badge">POC</span>
      </header>

      <main className="stage">

        {/* Circular progress ring */}
        <div className={`ring-wrap ${isAtMax && phase === 'idle' ? 'ring-wrap--maxed' : ''}`}>
          <svg className="ring-svg" viewBox="0 0 240 240" width="240" height="240">
            {/* Track */}
            <circle className="ring-track" cx="120" cy="120" r={RADIUS} />
            {/* Fill */}
            <circle
              className="ring-fill"
              cx="120" cy="120" r={RADIUS}
              style={{
                stroke: color,
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset: offset,
              }}
            />
          </svg>

          {/* Content inside the ring */}
          <div className="ring-center">
            {phase === 'revealed' ? (
              <div className="ring-reward">
                <span className="reward-emoji">🎊</span>
                <p className="reward-text">{reward}</p>
              </div>
            ) : (
              <>
                <span className="ring-pct" style={{ color }}>{intensity}%</span>
                <span className="ring-hint">{hint(intensity)}</span>
              </>
            )}
          </div>
        </div>

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

    </div>
  );
}
