import { useEffect, useRef, useState } from 'react';

// Minimum acceleration delta to count as "shaking" (low so any shake registers)
const MIN_DELTA = 5;
// Charge added per ~16ms frame while shaking — 2.4% → full in ~2.5s
const CHARGE_PER_FRAME = 2.4;
// Charge lost per frame while still — drains in ~1.5s
const DECAY_PER_FRAME = 3.0;

export function useShake(onShake) {
  const [permissionState, setPermissionState] = useState('unknown');
  const [intensity, setIntensity] = useState(0); // 0–100, shown in the progress bar

  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const chargeRef = useRef(0);          // 0-100: accumulated shake time
  const isShakingRef = useRef(false);   // true when a motion event fired recently
  const lastMotionAt = useRef(0);
  const rafId = useRef(null);
  const firedRef = useRef(false);

  // rAF loop: charge while shaking, decay while still, fire at 100
  useEffect(() => {
    if (permissionState !== 'granted') return;

    function tick() {
      const timeSinceMotion = Date.now() - lastMotionAt.current;
      isShakingRef.current = timeSinceMotion < 80;

      if (isShakingRef.current) {
        chargeRef.current = Math.min(100, chargeRef.current + CHARGE_PER_FRAME);
      } else {
        chargeRef.current = Math.max(0, chargeRef.current - DECAY_PER_FRAME);
      }

      setIntensity(Math.round(chargeRef.current));

      if (!firedRef.current && chargeRef.current >= 100) {
        firedRef.current = true;
        if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
        onShake();
      }

      rafId.current = requestAnimationFrame(tick);
    }

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [permissionState, onShake]);

  // Motion event listener — marks device as actively shaking
  useEffect(() => {
    if (permissionState !== 'granted') return;

    function handleMotion(e) {
      const accel = e.accelerationIncludingGravity;
      if (!accel) return;

      const { x = 0, y = 0, z = 0 } = accel;
      const prev = lastAccel.current;

      const delta = Math.sqrt(
        Math.pow(x - prev.x, 2) +
        Math.pow(y - prev.y, 2) +
        Math.pow(z - prev.z, 2)
      );

      lastAccel.current = { x, y, z };

      if (delta > MIN_DELTA) {
        lastMotionAt.current = Date.now();
      }
    }

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionState]);

  // Simulate sustained shaking for desktop — keeps lastMotionAt fresh while held
  function simulateShake() {
    if (firedRef.current) return;
    lastMotionAt.current = Date.now();
  }

  function resetIntensity() {
    chargeRef.current = 0;
    firedRef.current = false;
    setIntensity(0);
  }

  // On mount: detect permission needs
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setPermissionState('unsupported');
      return;
    }
    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      setPermissionState('granted');
      return;
    }
    setPermissionState('needs-prompt');
  }, []);

  async function requestPermission() {
    try {
      const result = await DeviceMotionEvent.requestPermission();
      setPermissionState(result === 'granted' ? 'granted' : 'denied');
    } catch {
      setPermissionState('denied');
    }
  }

  return { permissionState, requestPermission, intensity, simulateShake, resetIntensity };
}
