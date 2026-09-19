# Local validation

Run `npm run validate` for regression, syntax and complete campaign/expedition gates.
Reports are written to ignored `build/validation/report.md`, `report.json`, `levels.md`
and `levels.json`. The command uses Node directly and returns nonzero on failure.
No dependency installation is needed.

Separate commands: `npm test`, `npm run check`, `npm run audit:levels`.

`story.test.js` retains the first-level regressions. `campaign.test.js` covers ten
rule families, every campaign room, a demanding 36-room expedition, deterministic
seeds, bounded generation, binary boards, deadlines, saves, imports and migration.
`helpers/story-player.js` solves with movement/jump/swap inputs. It knows the solution
and physics; its times and lack of errors do not measure human difficulty or enjoyment.

Real Chromium UI checks are optional: [playtest instructions](../docs/PLAYTEST.md).
They are not reported as passed in this environment. Inspect the screenshots manually,
and separately assess audio, touch ergonomics, readability and human pacing.
