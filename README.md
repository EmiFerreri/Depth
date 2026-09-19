# DEPTH /100

DEPTH is a minimalist 2D momentum platformer built around a sphere moving through a continuous world.

## Core identity

- White / black / gray world.
- Color only appears on mechanically meaningful objects.
- Momentum and flow are the central gameplay language.
- Levels transition continuously with no loading/cutscene interruption.
- Player expression comes from rails, jumps, dashes, curves, loops, gravity, portals and powers.
- Story is environmental and mechanical rather than exposition-heavy.

## Current playable files

Open `game/index.html` in a browser.

Included:
- Level 001
- Level 002
- Level 003 PRO MINIMAL
- Levels 004, 005, 006 and 007 PRO
- Level 007B alternative scenario
- DEPTH /100 prototype

## Campaign structure

100 levels, organized in 10 rounds of 10:

1. Initiation
2. Velocity
3. Rails
4. Combat
5. Gravity
6. Surfaces
7. Portals
8. Mastery
9. Spectrum
10. Ascension

## Technical direction

The current playable builds are self-contained HTML/Canvas prototypes.

The target architecture is represented in `/src`:

- `core/` — loop, time, input
- `physics/` — player physics, collision, rail physics
- `world/` — chunks, levels, procedural grammar
- `entities/` — player, enemies, projectiles
- `mechanics/` — momentum, combo, powers
- `render/` — renderer, camera, particles
- `config/` — balance and progression
- `tests/` — physics and level validation

## Next milestone: DEPTH Physics 2.0

Prioritize:
1. true momentum conservation
2. robust rail constraints
3. perfect rail entry / exit
4. 360-degree loops
5. continuous collision detection
6. dynamic camera lead
7. one handcrafted 30-second "perfect flow" segment

Do not scale content further until movement feels excellent.

## Narrative

See `docs/story-bible.md`.

## AI development prompts

See `prompts/`.

## Run locally

Open `index.html` (project launcher) or `game/index.html` directly in a modern desktop browser.
No package installation or build step is required for the standalone prototypes.
You can also serve this directory locally:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Then open http://127.0.0.1:8000. Consult each prototype's on-screen controls.

## Implementation status

Playable game logic, styles and rendering currently live inside the HTML files in
`game/`. The JavaScript modules in `src/` are architecture scaffolding, not a fully
connected replacement engine. The campaign is a prototype, not 100 individually
finished production levels. The tests in `tests/README.md` are planned, not implemented.
Earlier independent versions are preserved in `archive/`.

## Automation

This repository includes no GitHub Actions workflow or automatic deployment.
Playing locally needs no API key, AI service or paid request.

## Import provenance

Imported from the original DEPTH_PROJECT.zip and subsequent standalone DEPTH HTML
prototypes. `docs/import-sources.json` records original filenames and SHA-256 hashes.
Gameplay files are preserved byte-for-byte; only the launcher, project inventory and
repository documentation were updated for this import. No open-source license was
added by this import.
