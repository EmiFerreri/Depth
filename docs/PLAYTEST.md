# Local playtest checklist

Run `npm run validate` first. Start with Node 20+ and `npm start`. Open http://127.0.0.1:8000.

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
   Choose SIGUIENTE CÁMARA: level 002 starts and is unlocked in the map. Reload and
   verify that it is still available; level 003 stays locked until 002 is completed.
9. Repeat with sound OFF and reduced motion ON. Numbers, pulse circles, text and
   gate shape must explain the puzzle. With sound ON, verify 1/2/3 audible pulses.
10. On a phone, check the objective panel, jump/arrow controls and ECOS at portrait
    and landscape sizes. Open/close the journal using touch; try simultaneous move/jump.

## Campaign and replay gates

Use an earned save, or a clearly marked local QA backup, to reach later chapters.
Do not treat imported QA achievements as a real player completion.

| Chamber | Exercise | Expected behavior |
|---|---|---|
| 010 | Longer memory and optional relic | Hint remains readable; repeat does not remove earned stars |
| 011 | Reverse the mirrored list | Following it literally fails; reversed order opens the seal |
| 021 | Land with wrong/right horizontal direction | Error states the direction; correct approach advances |
| 031 | Closed versus incomplete rings | A closed-ring copy fails even with the matching visible number |
| 041 | Leave a charging platform early | Its hold resets; completed earlier steps stay |
| 051 | Compare printed timestamps | Chronological order, not left-to-right or label order, solves |
| 061 | Swap Nox/Luma repeatedly | Independent positions; returning to a resting pad does not reactivate it |
| 071 | Toggle any board, then solve left to right | Standing cannot toggle repeatedly; all lights off opens the seal |
| 081 | Land during active music and then silence | Visible countdown explains the window; sound OFF remains playable |
| 095 | Combine constraints and make a late mistake | Completed blocks stay; the next constraint is visible |
| 100 | Approach the final exit with Nox, then Luma | Nox waits; Luma can cross and complete the story |

Progress and replay checks:

1. Complete without relic; repeat with it. Stars accumulate without losing earlier ones.
2. Practice permits completion and relic stars, but does not grant the clean standard star.
3. Export a JSON copy, import it in another browser, and verify chapter selection.
4. Import malformed/oversized JSON. Existing progress must stay intact.
5. Block storage. Play must still work; the warning and export path must remain usable.
6. Start an expedition with a named code, intensity and length. Restart: layout is identical.
7. Complete a room, leave and use CONTINUAR. Resume at the next entrance, not a random route.
8. Expert/Master: pause or open the journal while the memory countdown is active. It freezes.
9. Abismo: confirm bounded platform widths and rhythm windows; more depth must not shrink them forever.
10. Resize/rotate on a high-relic or cooperative chamber. Check the objective panel does not
    obscure the player, relic or touch controls. Inspect short portrait and landscape heights.

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
story introduction/journal/restart, keyboard completion of level 001, save/next, map,
expedition configuration, backup import, switching to Luma, arcade movement, pause,
mobile layout/controls and page errors. All 100 rooms are covered by the engine pilot;
the browser smoke does not claim to complete all of them.
Inspect screenshots manually; automated assertions do not establish visual polish.

## Design questions to measure

- Can a new player discover jump, dash and a boost in 30 seconds without explanation?
- Is landing on a rail predictable? Does leaving it preserve a useful trajectory?
- Do damage and respawn feel readable rather than arbitrary?
- Does a second Sprint attempt improve time or combo? Which feedback explains why?
- Do wider hazards and higher routes create choices rather than just more repetition?

Capture observations locally. There is no telemetry service or online leaderboard.
