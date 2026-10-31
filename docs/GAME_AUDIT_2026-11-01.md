# GAME AUDIT: 1 Nov 2026 (Games team)
Branch `game/third-person-v1`, built on `pc/canon-pacing-cleanup`. John asked for three things: check the game over, make the graphics better, and go third person in towns, villages and battles while the world map stays top-down.

## 1. How we tested
- Played it in Playwright (Chromium, software WebGL) at 1280×720/800: title, character creator, intro, tutorial, the Ashford area, the world map, settlement sheets, 2D field battle, auto-resolve, and the new 3D scenes.
- `node tests/check-inline.js`: every inline script passes `new Function` (3 of 3).
- `node tests/smoke-3d.js` (serve the repo first): 21 checks, all pass, **no console errors**.
- PC shell: `pc/sync-game.sh`, then Electron 33 under xvfb with `VH_SMOKE`. The 3D module loads over `app://` and a town walk renders offline.

## 2. Bugs and rough edges found
| # | Where | What | Status |
|---|---|---|---|
| 1 | Map | No mouse-wheel zoom. The zoom buttons jump in steps | **Fixed**: smooth zoom on the wheel and the buttons |
| 2 | Menus | Esc does not close a sheet | **Fixed** (battle, story, intro and ending sheets still need a choice) |
| 3 | Map | Settlement names get unreadably small when zoomed out | **Fixed**: labels keep a minimum on-screen size |
| 4 | Map | Realm names ("FLAMEBORNE") draw over towns, caves and their labels | **Softened**: smaller, lower alpha, letter-spaced |
| 5 | Emberfall sheet | Two "Tavern" headings when Kaelren can be recruited | Open (one-line fix in `townBody`) |
| 6 | Map | A lord's label ("Lady Cinder ~32") sits on top of the Emberfall icon | Open (offset lord labels when they are inside a site) |
| 7 | Screen edges | Backup tab, Walk, Save, music and "Next deed" all float over the map and look like debug UI | Open (move Backup and Save into ☰) |
| 8 | Tutorial | "Changing who you are is never free." breaks the no-morals-aloud rule | Open (copy) |
| 9 | Title | "Nine Realms. One fractured world. And the Void that hungers for both." It's unclear what "both" refers to | Open (copy, John's call) |
| 10 | Start | You start inside the 2D Ashford area. The only way to the world map is a small "Map" button | Open (first-time hint) |
| 11 | Perf | Three `getImageData` canvases, only one with `willReadFrequently`. Causes GPU-stall warnings on software GL | Open (minor) |
| 12 | Code | `index.html` is 4 MB and later declarations override earlier ones. That makes it hard to change safely | New systems now go in separate files (`g3d/`) |

## 3. The 10 highest-value improvements (in order)
1. **Third-person towns and battles** (John's ask). **Done as v1**, see §4.
2. **Bring the 2D story hubs into 3D.** Ashford, Emberfall, Highmarch and the other hub areas hold the quest NPCs and dialogue. The 3D walk doesn't host them yet. v2: place the hub NPCs in the 3D streets and reuse `dlgOpen`.
3. **Ranged units and cavalry in 3D battles.** Archers, Stormreach riders and javelins exist in the 2D field but not in 3D yet.
4. **3D sieges.** The 3D battle only draws a wall backdrop. It needs real walls, a gate and ladders.
5. **Better people.** The box people read fine at a distance but look crude up close. Next: one rigged low-poly glTF body with Realm armour swaps, still offline and still small.
6. **Music and ambience per scene.** `mus/town.mp3` and `mus/combat.mp3` already exist. Switch to them while a scene is open.
7. **Graphics setting** (Low/High) in ☰. Auto-quality already lowers the resolution when frames run long.
8. **Clear the screen edges** (bug 7) and add a first-time "open the world map" hint (bug 10).
9. **Copy fixes** (bugs 5, 8, 9) as one small canon-safe pass.
10. **Keep splitting the monolith.** Each new system goes in its own file, as `g3d/` does.

## 4. What was built (third-person v1)
**World map:** still the top-down 2D canvas.

**Town, village and castle walks** (`g3d/scene3d.js`, three.js r160 vendored in `g3d/`, lazy-loaded):
- Every friendly settlement sheet has a **Walk the streets** button, plus a **Walk in when I arrive** toggle. The toggle is on by default for mouse players and off for touch. While you walk, the game is paused.
- Each settlement is generated from its type, size and Realm: streets, plaza and market stalls, the hall or keep, tavern, smithy with forge glow, barracks, writ board, a **Memory Shrine** (standing stones and a lantern; no gods), walls and gate towers for towns and castles, and fields, granary, elder's house and fences for villages. Townsfolk walk the streets and guards stand at the gate.
- Realm looks follow the Codex §15b and the spec. Flameborne: soot timber, copper trim, ash. Lightforge: white stone, gold domes, bright noon. Frostgrave: snow roofs. Spiritveil: pale spires, silver lanterns, ghost-light motes. Shadowdeep: charcoal, violet light. Stonehold: flat granite. Stormreach: steep slate roofs, rain. Metalcrown: chimneys and furnace glow. When the Void is near, it shows as a violet glow on the horizon, motes and a cold light.
- Walk up to a place and press **E**. The **existing sheet** opens, scrolled to that section (Market, Tavern, Men, Forge, Hall, Writs, or the Ledger at the shrine), so all current gameplay works unchanged. Esc closes the menu, then returns you to the map. "Skip to menu" is always on screen.
- Controls: WASD or arrows to move, Shift to run, mouse drag or Q/E to turn, E or Enter to go in. On touch: a left-thumb stick, drag on the right to turn, and Go in/Run buttons.

**Fight in person** (on the battle sheet, next to Take the field / Auto-resolve / Flee):
- Both forces are spawned from the existing numbers: up to about 44 a side. Each soldier carries an equal share of `B.p0` or `B.e0`. Allies' men wear their lord's colours. Coloured rings under every soldier show whose side they're on.
- Orders: **C Charge**, **H Hold**. You fight with click or Space to strike (a cone, up to 3 foes) and right-click or Ctrl to block (frontal, −80%). There's simple unit AI: advance, engage, separate, and rout when a side drops under about a third.
- **Kaelren's vow** appears in 3D with the same choices and costs, and it calls the existing `vow()`. Pinning him keeps him at your side. Letting him ride breaks half their line, and he is carried off. If he falls in the press he is *wounded*, never killed.
- If you go down, your sergeants drag you back, the camera rises over the field, and the men fight on.
- When a side breaks, the result is fed into **`finishBattle`** exactly as the 2D field does it. Losses, loot, crowns, XP, contracts, sieges, Void push-back and story flags are all unchanged. Fall back follows the field's flee rule.
- If WebGL or the module fails, you land back on the battle sheet or site sheet silently.

**Map polish** (looks only): smooth zoom, the wheel, readable labels, a realm-coloured glow under held places, a warm-to-cool light pass, a violet screen edge near the Void, and quieter realm names.

**Rules kept:** no internal ids, save keys, quest ids, VO keys or numbers changed. No runtime CDN. `g3d/` is added to `pc/sync-game.sh` and `app/sync-web.sh`.

## 5. Honest limits of v1 (one person, AI help, browser game)
- **Performance on real GPUs hasn't been measured.** We only ran software WebGL here, at about 2 fps. That says nothing about a laptop. Each scene is around 270 draw calls, with one 1024 shadow map and up to 7 lights. That should hold 60 fps on a mid laptop, and auto-quality lowers the resolution if it doesn't. **John: please open a walk and a battle on your machine and tell us the feel.**
- Only melee in 3D: no archers or cavalry. A siege is just a backdrop wall.
- The townsfolk don't talk. Quests still live in the 2D hub areas and the sheets.
- The people are box-built. That's readable, but it isn't "AAA". Bannerlord-scale fidelity needs real models and animation (Stage 3/4 work).
- Touch controls are coded but untested on a real phone.
- Scenes are disposed completely on exit (geometry, materials, textures, renderer, DOM, listeners). Repeated enter/exit was tested; a long-session heap profile wasn't.

## 6. Plan for v2 (next pass)
1. Hub NPCs and quest markers in 3D towns, reusing the dialogue system.
2. Archers (arcs plus volley order) and Stormreach cavalry charges.
3. Siege layout: walls, gate, ladders and a defender line, using `B.siegeId`.
4. A shared glTF body (~2k tris) with Realm armour variants, skinned walk, strike and block clips.
5. Scene music, footstep and crowd ambience; a Low/High graphics option.
6. Fix the open bugs (5–11) in one small pass.

## How to try it
```
git checkout game/third-person-v1
python3 -m http.server 8765        # from the repo root
# open http://localhost:8765/index.html, start a game, press Map, ride to a town, Walk the streets
node tests/check-inline.js
node tests/smoke-3d.js            # needs playwright; SHOTS=docs/screens/2026-11-01 to save screenshots
```
Screenshots: `docs/screens/2026-11-01/` (map, settlement sheet, town walk, market, village, battle sheet, battle lines, melee, result).
