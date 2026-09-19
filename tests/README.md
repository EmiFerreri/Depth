# Validation

Run `npm test` for Node regression tests, and `npm run check` for syntax/JSON checks.
No dependency installation is needed for these commands.

Real Chromium UI checks are optional: see [playtest instructions](../docs/PLAYTEST.md).
The implementation environment could not complete that browser gate; it is not
reported as passed. Browser screenshots must be inspected manually.

`story.test.js` covers the landing sequence, mistakes, gate sweeps at different
heights, forced manual control, journal discovery, pause/restart and reward farming.
A complete control-driven run walks/jumps through a wrong attempt, the correct
sequence, the first echo and the exit. It never teleports to solve the puzzle.
