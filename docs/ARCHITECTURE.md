# DEPTH 0.2 architecture

The playable entry is `index.html` → `src/main.js`. Modules are native ES modules,
with no framework, production package dependencies, build service or remote API.

| Module | Responsibility | Boundary |
|---|---|---|
| `core/Game.js` | State transitions, score, combat, pickups, checkpoints | Receives one input snapshot and a fixed step; emits events |
| `core/Time.js` | 120 Hz accumulator, bounded catch-up | Display timing cannot alter physics step size |
| `core/Input.js` | Keyboard, mouse and multipointer touch | Edge-triggered jump/dash; clears controls on focus loss |
| `physics/PlayerPhysics.js` | Integration, bounds, platforms, rail entry | Coordinates independent of screen dimensions |
| `physics/Collision.js` | Segment sweeps and one-way platform crossing | Pure functions, unit tested |
| `physics/RailPhysics.js` | Parametric rail samples and tangent motion | Stylized game physics; not an energy-conserving simulator |
| `world/LevelGenerator.js` | Four modes, four chunk patterns, seeded variations | Fresh RNG per world; UTC daily seed |
| `render/Renderer.js` | Canvas, camera, trails, event particles | Render-only randomness never affects layout or score |
| `audio/Audio.js` | Short synthesized feedback tones | Starts after user gesture; disconnects completed oscillators |
| `core/Storage.js` | Validated, bounded local best scores and times | Failures handled; practice/standard and auto/manual records separated |
| `main.js` | DOM, dialogs, mode selection, HUD and integration | No DOM dependency in engine tests |

Simulation units: fixed world height 720, sphere radius 14; velocities in units/s,
gravity in units/s². Render scaling and screen rotation do not regenerate objects.
`Game.step()` is driven at 1/120 s by `FixedClock`; callers should use that clock.
At most 12 physics steps execute per rendered frame, discarding excess real time
after a stall. Timers measure simulated active play, not wall-clock time.

## Lifecycle

`ready → running → paused → running → finished`. Restart constructs a new Game
with the selected mode/seed and clears input, clock, camera and temporary effects.
On blur or document hiding, play pauses and held controls are released. Resume is
explicit. The two modal dialogs provide keyboard focus trapping via native `dialog`.

## Scoring and progression

Score comes from new forward distance, once-only pickups/rail rewards, defeated
drones and a completion time bonus. Standing still does not generate points.
Going backwards does not re-award distance. Every sector has a safe checkpoint;
three hits return the sphere there. Rewards already collected stay consumed.
Practice prevents checkpoint resets and has separate records. The elapsed timer
continues after damage, so checkpoint resets do not improve time artificially.

The 100-sector mode repeats four authored chunk patterns with deterministic
variations and increasing hazard widths. It is not 100 handcrafted unique levels.
The original campaign and level prototypes remain under `game/` for reference.

## Deliberate limits

- Swept expanded rectangles approximate sphere collisions conservatively at corners.
- Rails implement a single-valued y(x) arc, not 360-degree loops or energy conservation.
- Local scores are editable by their owner; there is no trusted global leaderboard.
- Best records persist; in-progress campaigns and settings do not yet persist.
- Gamepad, remappable input, full nonvisual play, replays and custom level editing are pending.
- Real browser/device performance and visual accessibility require the browser gate.
- No backend, analytics, accounts, telemetry transmission, AI requests or Actions workflow.
