# Shake & Win POC — Context & Progress

## What this is
Browser-based shake-to-reveal reward mechanic. User shakes their phone for ~2.5 seconds, a circular progress ring fills up, then a random reward is revealed.

## Stack
- React + Vite (no backend)
- Deployed via Vercel from `main` branch

## Key files
| File | Role |
|---|---|
| `src/useShake.js` | All motion detection logic — self-contained hook |
| `src/App.jsx` | UI: ring, hints, buttons, reward reveal |
| `src/App.css` | Styles (dark theme `#070707`, green accent `#6bc670`) |

## How the detection works (`useShake.js`)
- Listens to `DeviceMotionEvent` — measures acceleration delta across x/y/z axes
- `MIN_DELTA = 5 m/s²` threshold to count as shaking
- rAF loop runs a charge accumulator (0→100):
  - **+2.4% per frame** while shaking → full in ~2.5s
  - **−3% per frame** while still → drains in ~1.5s
- `onShake()` fires the moment charge hits 100
- **iOS 13+:** requires `DeviceMotionEvent.requestPermission()` via a user gesture button
- **Android / Desktop:** auto-granted, no prompt needed
- Desktop simulate button fires motion ticks on a 16ms interval while held

## UI decisions
- Circular SVG progress ring (radius 100, 240×240, starts from top)
- `stroke-dashoffset` animates charge in real time
- Ring color transitions: grey → amber → green
- At 100%: green glow + rumble CSS animation
- Contextual hints inside ring: "Shake your phone!" → "Keep going…" → "Shake harder! 💪" → "Almost there! 🔥"
- Percentage + hint centered inside ring
- Reward pops in inside ring on reveal (spring animation)
- Haptic: `navigator.vibrate([80, 40, 120])` on reveal

## Commit history
| Hash | Description |
|---|---|
| `8c95ea9` | Remove phone icon from ring center |
| `7d097ce` | Circular SVG progress ring replaces linear bar |
| `ceb1773` | Time-based shake charge — sustain 2.5s to reveal |
| `b5aed60` | Live shake-strength progress bar with hold-to-reveal |
| `adfd580` | Initial Shake & Win POC |

## Next step
Refactor into a reusable `<ShakeAndWin rewards={[...]} />` component:
- `src/ShakeAndWin.jsx` — self-contained (imports `useShake`, owns all state/UI)
- `src/App.jsx` — thin demo that just passes a rewards array in
- Team configures only the `rewards` prop — no need to touch detection logic
