# DEPTH — Technical Roadmap

> This is the original long-term plan. Version 0.2 now implements a connected
> fixed-step engine, checkpoints, seeded routes, touch controls and local tests.
> See [architecture and current limits](ARCHITECTURE.md) and the
> [audit](AUDIT-2026-09-19.md) before treating items below as completed.

## Phase 1 — Movement Foundation
- fixed timestep physics
- momentum conservation
- rail tangent / normal constraints
- proper loop support
- ceiling/floor collision guarantees
- continuous collision detection
- camera lead by velocity
- deterministic replay

## Phase 2 — Level System
- handcrafted gameplay chunks
- gameplay grammar
- chunk compatibility metadata
- deterministic seeded assembly
- route validation
- checkpoints and failure recovery
- skill gates and speed gates

## Phase 3 — Mechanics
- wall ride
- gravity flip
- gravity fields
- cannons
- slingshots
- momentum portals
- destructible surfaces
- bounce materials
- near miss scoring
- trick / style scoring

## Phase 4 — Progression
- 10 rounds × 10 levels
- bosses on every 10th level
- color laws
- secrets
- medals / ranks
- ghost runs
- time trials
- daily seeds
- endless mode

## Phase 5 — Production Quality
- audio-reactive momentum system
- input remapping
- mobile controls
- gamepad
- accessibility
- telemetry
- performance budgets
- automated level validation
