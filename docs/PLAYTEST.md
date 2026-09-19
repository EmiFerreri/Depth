# Local playtest checklist

Start with Node 20+ and `npm start`. Open http://127.0.0.1:8000.

## Story playtest: La huella

1. Select Historia (default), start and read the introduction. The world must not
   move until you press SEGUIR SU HUELLA. Escape returns to the menu.
2. Start again. Without touching keys, Nox must remain still. Move right with D or
   the touch arrow and approach the incomplete ring. The objective announces a clue.
3. Open ECOS (or E). Read the prologue and new clue. Time and position must stop.
   Space, P and R inside the dialog must not jump, pause again or restart. Escape
   resumes. The hint is available only after discovering the clue.
4. Stand below the left platform (1), release movement and jump onto it. Confirm
   one pulse and progress 1/3. Staying on it must not advance or reset progress.
5. Walk off and land on the middle platform (2): progress resets, HP stays full and
   the clue remains in ECOS. Return to the ground before trying again.
6. Land on 1, then 3, then 2. Walk under the middle platform or use repeated airborne
   jumps to skip it while moving to 3. The seal changes to PASO ABIERTO only after
   all three correct landings. Try dash and high jumps against the seal before solving.
7. Cross the open gate. The first echo appears in the journal and on the results
   screen at the exit. No fleeting toast should be the only way to read it.
8. Retry: the clue, sequence and gate reset. Compare the best record after reloading.
   Story has one playable level; the next chapter is a teaser, not a continue button.
9. Repeat with sound OFF and reduced motion ON. Numbers, pulse circles, text and
   gate shape must explain the puzzle. With sound ON, verify 1/2/3 audible pulses.
10. On a phone, check the objective panel, jump/arrow controls and ECOS at portrait
    and landscape sizes. Open/close the journal using touch; try simultaneous move/jump.

## Arcade regression playtest

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
story introduction/journal/restart, arcade start, movement/jump, pause/resume, focus
loss, mobile layout/controls and page errors. Full story completion is covered by
the engine test and the human checklist above, not the browser smoke.
Inspect screenshots manually; automated assertions do not establish visual polish.

## Design questions to measure

- Can a new player discover jump, dash and a boost in 30 seconds without explanation?
- Is landing on a rail predictable? Does leaving it preserve a useful trajectory?
- Do damage and respawn feel readable rather than arbitrary?
- Does a second Sprint attempt improve time or combo? Which feedback explains why?
- Do wider hazards and higher routes create choices rather than just more repetition?

Capture observations locally. There is no telemetry service or online leaderboard.
