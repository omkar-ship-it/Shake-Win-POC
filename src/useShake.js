import { useEffect, useRef, useState } from 'react';

// Acceleration delta needed to hit 100% intensity
const MAX_DELTA = 28;
// How fast intensity decays per animation frame (~60fps → ~0.7% per frame = empty in ~1.4s)
const DECAY_PER_FRAME = 1.8;
// How long intensity must stay at 100% before reward fires (ms)
const HOLD_MS = 300;

export function useShake(onShake) {
  const [permissionState, setPermissionState] = useState('unknown');
  const [intensity, setIntensity] = useState(0); // 0–100, shown in the progress bar

  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const intensityRef = useRef(0);       // live value updated by motion events
  const lastMotionAt = useRef(0);       // timestamp of last motion event
  const fullSince = useRef(null);       // when intensity first hit 100
  const rafId = useRef(null);
  const firedRef = useRef(false);       // prevent double-firing during cooldown

  // rAF loop: decay intensity and watch for the hold-at-100 trigger
  useEffect(() => {
    if (permissionState !== 'granted') return;

    function tick() {
      const now = Date.now();
      const timeSinceMotion = now - lastMotionAt.current;

      // Decay if no recent motion event
      if (timeSinceMotion > 80) {
        intensityRef.current = Math.max(0, intensityRef.current - DECAY_PER_FRAME);
      }

      const val = intensityRef.current;
      setIntensity(Math.round(val));

      // Track how long we've been at 100%
      if (val >= 100) {
        if (fullSince.current === null) fullSince.current = now;

        if (!firedRef.current && now - fullSince.current >= HOLD_MS) {
          firedRef.current = true;
          // Haptic feedback
          if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
          onShake();
        }
      } else {
        fullSince.current = null;
        firedRef.current = false;
      }

      rafId.current = requestAnimationFrame(tick);
    }

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [permissionState, onShake]);

  // Motion event listener — sets raw intensity from acceleration delta
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
      lastMotionAt.current = Date.now();

      // Push intensity up — clamp at 100, don't let it fall from motion events
      const next = Math.min(100, Math.max(intensityRef.current, (delta / MAX_DELTA) * 100));
      intensityRef.current = next;
    }

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionState]);

  // Simulate a shake for desktop testing
  function simulateShake() {
    if (firedRef.current) return;
    let progress = intensityRef.current;
    const interval = setInterval(() => {
      progress = Math.min(100, progress + 12);
      intensityRef.current = progress;
      lastMotionAt.current = Date.now();
      if (progress >= 100) clearInterval(interval);
    }, 30);
  }

  // Reset intensity after reward is revealed
  function resetIntensity() {
    intensityRef.current = 0;
    fullSince.current = null;
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
