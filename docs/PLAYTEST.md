# Local playtest checklist

Start with Node 20+ and `npm start`. Open http://127.0.0.1:8000.

## Five-minute human test

1. Flow: start without touching keys. Confirm automatic forward motion and a visible
   first rail. Tap Space to leave the rail; tap again for a midair jump.
2. Dash with Shift, confirm cooldown and momentum feedback. Collect a green boost
   ring, then a shield or blue low-gravity pickup. Observe their different effects.
3. Cross a sector, take three hits and verify return to that checkpoint; confirm
   collected rewards do not respawn. Enter practice mode and compare the behavior.
4. Pause with P/Escape and resume using the dialog. Change tabs while holding D/J:
   returning must show pause and must not keep moving/firing from a stale input.
5. Complete Sprint. Verify the results, local record and retry. Reload and confirm
   the record remains. Toggle practice/auto-advance: records must stay separate.
6. Phone/tablet: check no horizontal scrolling, visible HUD and separate jump/dash/fire
   controls, simultaneous move/jump, pointer release and rotation without world changes.
7. Enable reduced motion: no particle bursts, trails or hit shake. Toggle sound and
   inspect fullscreen fallback. A denied audio/storage/fullscreen capability must not crash.

## Optional automated browser gate

The default tests have zero dependencies. To run real Chromium UI checks locally:

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
```

In one terminal: `npm start`. In a second:

```powershell
node tests/browser-smoke.mjs
```

Screenshots go to ignored `build/screenshots/`. This checks menu mode changes,
start, movement/jump, pause/resume, focus loss, mobile layout/controls and page errors.
Inspect screenshots manually; automated assertions do not establish visual polish.

## Design questions to measure

- Can a new player discover jump, dash and a boost in 30 seconds without explanation?
- Is landing on a rail predictable? Does leaving it preserve a useful trajectory?
- Do damage and respawn feel readable rather than arbitrary?
- Does a second Sprint attempt improve time or combo? Which feedback explains why?
- Do wider hazards and higher routes create choices rather than just more repetition?

Capture observations locally. There is no telemetry service or online leaderboard.
