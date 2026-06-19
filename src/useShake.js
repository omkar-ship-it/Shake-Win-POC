import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 15;      // m/s² — acceleration magnitude to count as a shake
const COOLDOWN_MS = 1500;  // ignore further shakes for this long after one fires

export function useShake(onShake) {
  const [permissionState, setPermissionState] = useState('unknown'); // unknown | granted | denied | unsupported
  const lastShakeAt = useRef(0);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });

  // Attach / detach the motion listener
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

      const now = Date.now();
      if (delta > THRESHOLD && now - lastShakeAt.current > COOLDOWN_MS) {
        lastShakeAt.current = now;
        onShake();
      }
    }

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [permissionState, onShake]);

  // On mount: check if permission API exists (iOS 13+) or if we can just listen (Android / older)
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setPermissionState('unsupported');
      return;
    }

    // Android and most browsers fire without a permission prompt
    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      setPermissionState('granted');
      return;
    }

    // iOS 13+ — need explicit user gesture to request
    setPermissionState('needs-prompt');
  }, []);

  // Call this from a button click to trigger the iOS permission prompt
  async function requestPermission() {
    try {
      const result = await DeviceMotionEvent.requestPermission();
      setPermissionState(result === 'granted' ? 'granted' : 'denied');
    } catch {
      setPermissionState('denied');
    }
  }

  return { permissionState, requestPermission };
}
