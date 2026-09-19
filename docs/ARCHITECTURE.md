# DEPTH 0.3 architecture

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
| `world/LevelGenerator.js` | Four arcade modes plus the authored story entry | Fresh RNG per world; UTC daily seed |
| `world/StoryLevel.js` | Authored La huella geometry, clue, pads and gate | Fresh world for every run; precise manual movement |
| `story/SequencePuzzle.js` | Distinct-contact sequence 1 → 3 → 2 | Wrong inputs reset progress; solve is latched |
| `story/StoryProgress.js` | Discovery, journal, puzzle events and gate | Runs after movement and before distance/finish checks |
| `story/StoryData.js` | Shared narrative text and chapter names | Script data; later chapters are not playable |
| `render/StoryRenderer.js` | Incomplete rings, pad symbols and gate state | Numbers and shapes accompany color and audio |
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
explicit. Native `dialog` provides focus trapping for pause, results, story introduction and journal.
Story starts in `ready` behind its introduction; the begin button enters `running`.
Opening the journal pauses simulation, and closing it explicitly resumes. Game hotkeys
are ignored while focus is inside a dialog, so Space and Escape cannot leak into play.

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

## Story level

Story forces manual movement and disables combat. Its world supplies a 270 units/s
speed in both directions and a response coefficient of 14 for more deliberate
landing. Arcade retains its existing speed, momentum and controls.

Physics reports the platform currently supporting a downward landing. The sequence
controller remembers that contact, so standing still counts once. Leaving and landing
again is a fresh input. Mistakes clear the sequence without damage or clue loss.
The solve bonus is awarded once; revisiting pads never awards it again.

The locked gate clamps horizontal travel across the entire playable height before
scoring distance or testing completion. Neither dash nor an airborne route bypasses
it. After solving, crossing the echo location reveals the message even if the player
is above the ring, avoiding a missed story beat. The message is repeated at completion.

The journal contains only discoveries from the current run plus the prologue. It is
not persisted or unlocked by an arcade record. Restart makes a fresh puzzle and world.
The 100-level narrative outline is a roadmap; only La huella is playable in Story.

## Deliberate limits

- Swept expanded rectangles approximate sphere collisions conservatively at corners.
- Rails implement a single-valued y(x) arc, not 360-degree loops or energy conservation.
- Local scores are editable by their owner; there is no trusted global leaderboard.
- Best records persist; in-progress campaigns and settings do not yet persist.
- Gamepad, remappable input, full nonvisual play, replays and custom level editing are pending.
- Real browser/device performance and visual accessibility require the browser gate.
- No backend, analytics, accounts, telemetry transmission, AI requests or Actions workflow.
