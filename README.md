# DEPTH /02

**Find your flow.** A minimalist 2D momentum platformer built around a sphere,
continuous movement and functional color. Native JavaScript, Canvas 2D and Web Audio.

Version **0.2.0** adds a connected game engine and a new playable entry. The original
prototypes remain available. This is an actively developed game foundation;
browser/device sign-off is still pending, as documented in the audit.

## Play locally

Install Node.js 20 or newer, open a terminal in this repository, then:

```powershell
npm start
```

Open **http://127.0.0.1:8000**. No `npm install`, build step, API key or account is
needed for the game or default tests. The server binds only to your own machine.
Native ES modules require HTTP; opening the new root HTML as a file shows instructions.
The original standalone prototypes in `game/` can still be opened directly.

## Modes

| Mode | Route | Goal |
|---|---|---|
| Flow | 10 sectors | Learn the movement and chain pickups |
| Sprint | 3 sectors | Improve your completion time |
| Daily | 6 sectors, shared UTC-date seed | Retry the same daily layout |
| Campaign | 100 sectors / 10 rounds | Sustain flow through the longer route |

The new campaign combines four reusable route patterns with seeded variations.
It is not a claim of 100 unique handcrafted levels. Daily is generated locally;
there is no scheduled job, server or global leaderboard.

## Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move | A/D or left/right arrows | Arrow buttons |
| Jump, including midair | Space / W / up arrow | Jump or tap the canvas |
| Dash | Shift | Dash |
| Shoot | J forward, or hold mouse to aim | Fire forward |
| Fast fall | S / down arrow | — |
| Pause | P / Escape or pause button | Pause button |
| Restart current route | R or pause dialog | Restart in pause dialog |

Auto-advance, practice mode and reduced motion are selectable in the menu.
Practice prevents checkpoint resets; standard and practice records stay separate.

## Implemented

- Fixed 120 Hz simulation, frame-rate independence tests and bounded catch-up.
- Curve riding, infinite jumps, dash cooldown, drones and swept projectile collisions.
- Boost rings, shield, low gravity, combos and sector checkpoints.
- Persistent best scores/times, corruption handling and blocked-storage fallback.
- Keyboard/mouse/touch controls, focus-loss pause, native dialogs and reduced motion.
- Responsive monochrome interface, functional color and synthesized sound feedback.
- Local server and tests with no production or default test dependencies.

## Quality checks

```powershell
npm test
npm run check
```

These test the engine, world generation, regressions and syntax. A scripted player
also completes all four modes, including the 100-sector route. Real browser testing
requires the optional [browser smoke and playtest](docs/PLAYTEST.md); its execution
was blocked in the implementation environment. Passing simulation tests is not a
substitute for human playtesting or a visual/device audit.

## Repository

- `index.html`, `styles/`, `src/main.js` — new playable UI.
- `src/core`, `physics`, `world`, `entities`, `render`, `audio` — working engine modules.
- `tests/`, `tools/` — local validation and preview server.
- `game/` — original campaign, levels 1–7 and 7B; selected legacy fixes included.
- `archive/` — unchanged historical standalone variants.
- `docs/` — [architecture](docs/ARCHITECTURE.md), [audit](docs/AUDIT-2026-09-19.md),
  [story](docs/story-bible.md), [roadmap](docs/technical-roadmap.md), import provenance.
- `prompts/` — original design and engineering prompts.

## Next milestone

Run the Windows/phone browser gates, tune movement with human playtests, then add
controller input, custom key bindings, save/resume, proper 360-degree loop constraints
and richer authored routes. See [CHANGELOG.md](CHANGELOG.md).

## Costs and data

No GitHub Actions workflow, automatic deployment, analytics or paid API calls.
Records remain in the browser. No license was added by this change; this repository
is not being relicensed as open-source by the implementation.
