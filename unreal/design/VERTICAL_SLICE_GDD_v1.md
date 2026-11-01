# VOIDHAMMER — THE SHATTERED REALMS
## Vertical Slice Game Design Document v1 (Unreal Engine 5.8)
*Game Director + Technical Lead · 1 Nov 2026 · status: DRAFT for John*

**Canon sources, in order of authority:** newest CANON LOG entry, then `docs/GAME_CANON_SPEC.md` (approved 26 Oct), then `GAME_CANON_SPEC — patch from World Book v1` (approved 1 Nov), then this document. Where this doc proposes a new name or fact it says **[PROPOSED]** and needs John's yes before it ships in game text.

---

## 0. One-paragraph pitch

You ride into **Hearthmount**, the Flameborne King's caldera city, in the last season before the Radiant Edict. Raiders are hitting the Ember March, and they're paid in coin nobody will name. You walk the city in third person, hire men, earn the trust of the King's ward **Kaelren** and a Shadowdeep exile called **Jorren**, ride the top-down world map, and fight one large real-time field battle on the March road. You can cast one Embercraft spell, and it costs something you don't get back. At the edge of the map, now and then, the world looks unfinished: a **grey edge**. The slice proves the loop, the feel and the cost. It is the pitch for everything after.

**Core question carried into play:** *Can someone choose who they become?* Every system in the slice gives the player a choice with a price, and the price changes who their character is.

---

## 1. Slice scope (what's in, what's out)

| In the slice | Count |
|---|---|
| Realm | **Flameborne**, with the Ember March borderland |
| Walkable city | **Hearthmount** (4 districts, one streamed level) |
| Field battle | **The March Road fight** (1 map, ~2 × 150 soldiers on screen) |
| Companions | **Kaelren** + **Jorren** |
| World map | Top-down, one Realm, ~12 sites, 1 in-game season |
| Spell | **Ember Wall** [PROPOSED name], Embercraft, cost = self-control |
| Map threat | **Grey edges** (rare and faint; no rifts, no Voidborn) |
| Play time | 60–90 min golden path, 2–4 h with sandbox |

### 1.1 Why Flameborne (recommendation)
1. **Kaelren is Flameborne** (Spec). The slice's best emotional beat, his vow on the battlefield, belongs on his home ground with his King's men around him.
2. **The cost is easy to feel in play.** Embercraft "burns away self-control" (Spec; World Book Part 06, M1: "the price is always the virtue, overdone"). That turns into mechanics a player notices in seconds: surges, lost dialogue options, a character who can no longer back down. Memory-based costs (Spiritveil) and identity costs (Shadowdeep) are harder to show in a first hour.
3. **It looks great in UE5 for little money.** Fire, ember particles, a caldera city lit from below by the Cinderway (Part 02 §740–745). Lumen does emissive lighting well; it's the strongest screenshot per hour of art work.
4. **The Ember March and Hearthward** give a natural battlefield and a political seam (Flameborne–Stonehold, "hearth-and-hold"), and the patch makes Hearthward the canon site for this era.
5. **Metalcrown's quiet preparation** (Spec act 1) can surface as *raiders paid in foundry coin*. That's a plot hook that sets up the whole game without starting the war early. The browser prototype already has this thread ("Foundry coin? Grey wax...").

**Emberhold rule (patch §2):** Emberhold doesn't exist in this era. The site is **Hearthward**, a joint Flameborne–Stonehold keep. It appears on the map only. Its arch is shown as an arch: **never show or explain why it reaches eight Realms.**

### 1.2 Companion pick: Jorren (with Kaelren)
**Recommendation: Jorren**, the Shadowdeep exile and spy who "disappears and never explains" (Spec; World Book Part 10).

Why him over Wren or Elyndra:
- **He's canon for this era**, and his defining trait is a gameplay mechanic: he has agency built in. He can leave before a battle and come back, or not, depending on how you've treated him. That's the "companions with agency" promise in one person.
- **He mirrors Kaelren** (the Filoni rule: put the opposite next to the hero). Kaelren is steady, notices what things cost, never chooses himself. Jorren chooses himself, explains nothing, and his archetype is "sin trying to become choice" (Lore Bible archetypes). Two people answering the core question in opposite ways, both in your party.
- **A second cost system** with no extra spell work: Shadowdeep's identity erosion (people forget his face) becomes his companion ability's price.
- **Politics:** Shadowdeep sabotages the Edict (Spec act 3). Jorren's thread points straight at the full game.
- **Wren** is a renamed game invention, not book canon. **Elyndra** is tied to the Voyager and to Spiritveil memory systems, which belong in a later Realm slice.

**Jorren canon in play:** half-name *Jor* plus a Bridge ending he took in exile (Naming N-3). Mael's apprentice (People #48). The Turning tale (his Keeper Brisa) is in the World Book and *may* surface as an optional night-camp story [needs John's yes; it isn't sealed]. **Don't** use Sev, Lysa or Bren backstory; that's the Book One era.

---

## 2. What the browser prototype already proved
Sources: `docs/GAME_AUDIT_2026-11-01.md`, `docs/GAME_CANON_SPEC.md` and its patch. Main also has `/preview-3d/` (three.js third-person v1).

| Proven | Carry into Unreal |
|---|---|
| **The loop works**: map → settlement sheet → recruit/trade → battle (field or auto-resolve) → `finishBattle` results. | Same loop, same result fields (losses, loot, crowns, XP, story flags). |
| **Top-down map + third-person towns/battles** is the right split (John's ask, built as v1). | Unreal keeps a strategic top-down map and goes 3D third-person for city and battle. |
| **Kaelren's vow** (hold him / let him ride) is the best moment in the game. Its numbers: pinning him costs ~6 men on a flank; letting him ride halves the enemy's line, and he's carried off wounded for 12 days. | Ported as the slice's set-piece (§6.3). |
| **Kaelren can't die** (wounded/carried off). | Hard rule in code: `bCanDie = false` on canon companions. |
| **The 3D melee basics** read well: a strike cone up to 3 foes, frontal block −80%, Charge/Hold orders, rout when a side drops under about a third. | Used as the starting numbers in §5. |
| **Realm looks** (Codex §15b): Flameborne = soot timber, copper trim, ash. | Art direction for Hearthmount. |
| **Void-near visual language**: violet horizon glow, motes, cold light. | Grey edges use desaturation plus the "unfinished" look (§8). Violet stays a hint, not a rift. |
| **Data and saves stay stable** when only display strings change. | Unreal uses data tables and gameplay tags with stable ids from day one. |

**What the prototype did NOT prove:** performance on a real GPU (only software WebGL was tested, at ~2 fps); ranged units or cavalry in 3D; animated people (box people); talking NPCs in 3D; touch. Unreal has to earn those itself.

**Canon drift found in the prototype (fix there, don't port):**
1. `vow("burn")` writes "his sister Iselle". **The patch deleted Kaelren's sister**; his mother was Idda Orrin, who died when he was six. Don't port the line.
2. `atWar()` treats Metalcrown (`"metal"`) as always at war. In this era the Dominion attacks only after the Edict. The slice uses deniable *raiders*, not Dominion troops.
3. The tutorial line "Changing who you are is never free." is a moral stated aloud (audit bug 8). Don't port it.

---

## 3. Core loop

```
        ┌─────────────── WORLD MAP (top-down, time runs) ───────────────┐
        │ rumours · contracts · raiders · grey edges · lords' moves     │
        └──────┬───────────────────────┬───────────────────────┬─────────┘
               │ enter site            │ intercept party        │ camp / rest
               ▼                       ▼                        ▼
       CITY WALK (3rd person)   FIELD BATTLE (3rd person)   CAMP (menu + talk)
       recruit, trade, talk,    command + fight + cast      Control recovers (Toll only),
       hall politics            Kaelren's vow, morale       companions' stories, approval
               │                       │                        │
               └──────────► RESULTS: crowns, renown, troop XP, approval, Control,
                            Realm standing, grey-edge growth ◄──┘
                                       │
                                       ▼
                          UPGRADE troops · choose who to keep · back to the map
```

**Per-minute loop (battle):** read the field → give an order → fight in the press → spend stamina, and decide whether to spend *yourself* (the spell) → watch morale tip.
**Per-session loop (map):** pick a goal → travel and manage food and wages → fight or talk → grow the warband → the Realm reacts.
**Slice spine (golden path, ~60–90 min):**
1. **Arrival at the Kiln Gates.** Tutorial ride on the map; Hearthmount opens.
2. **The Hearth Court.** The Flameborne King (warm, generous, under strain) asks you to ride the Ember March. He sends his ward Kaelren with you. *(No baking scenes in the slice; see §7, sealed item b.)*
3. **Find the man nobody can describe.** Jorren is in a tavern on the lower terraces, and has been for three days. Recruit him by trade (information for crowns), by trust (cover for him with the watch), or not at all.
4. **The map.** Two raider camps, five villages, Hearthward on the March. One village edge goes faintly grey.
5. **The March Road fight.** About 120 of yours against about 160 raiders. Kaelren's vow mid-battle.
6. **The coin.** On the raider captain: foundry coin and grey wax. Choose: carry it to the Emberwarden for the Council, sell it to Jorren's contacts, or keep it.
7. **Close.** Back at Hearthmount the King reads your choice and writes a letter he doesn't send. Fade out on the March horizon, where the world is a little less finished than it was. **No Edict and no war in the slice.**

---

## 4. Controls

### 4.1 Third person (city and battle)
| Action | Keyboard + mouse | Gamepad (Xbox / PS5) |
|---|---|---|
| Move | WASD | Left stick |
| Look / camera | Mouse | Right stick |
| Sprint | Left Shift (hold) | L3 (click) / L3 |
| Jump / vault | Space | A / Cross |
| Attack (tap light, hold heavy) | Left mouse | RT / R2 |
| Block (hold) | Right mouse | LT / L2 |
| Interact / talk | E | X / Square |
| Cast Ember Wall | Q | RB / R1 |
| Companion ability (Jorren: Unseen) | F | LB / L1 |
| Order: Charge | C | D-pad up |
| Order: Hold | H | D-pad down |
| Order: Follow me | V | D-pad left |
| Order: Loose (archers) | B | D-pad right |
| Command camera (rise above field) | Tab (toggle) | View / Touchpad |
| Pause / menu | Esc | Menu / Options |

Hold and Charge keep the browser keys (C, H). E stays "go in / talk", as in the browser walk.

### 4.2 World map
| Action | Keyboard + mouse | Gamepad |
|---|---|---|
| Move party | Left-click destination | Left stick moves a cursor, A / Cross to confirm |
| Pan | WASD or screen-edge or middle-drag | Right stick |
| Zoom | Mouse wheel (smooth) | LT / RT |
| Time: pause / play / fast | Space / 1 / 2 | Y / Triangle cycles |
| Party, troops, companions | P, T, K | View / Touchpad opens the tabbed menu |
| Enter site | Click site when adjacent | A / Cross |

**Accessibility from day one:** remappable inputs (Enhanced Input user settings), hold/toggle option for block and sprint, subtitle size, colour-blind-safe faction rings (pattern as well as colour).

---

## 5. Systems with numbers
All numbers live in **data tables** (`DT_TroopTiers`, `DT_Weapons`, `DT_MoraleEvents`, `DT_PriceStages`), never in code. These are first-pass values for the balance-check skill to test.

### 5.1 Personal combat (player and named characters)
| Value | Number |
|---|---|
| Player health / stamina | 100 / 100 |
| Stamina regen | 18 per s, starts 1.0 s after last spend |
| Light attack | 18 damage, 0.55 s, 12 stamina, hits up to 3 in a 70° cone, 2.2 m reach (sword) |
| Heavy attack (hold ≥ 0.4 s) | 34 damage, 1.10 s, 25 stamina, staggers tier 1–2 |
| Block | frontal 100° arc, −80% damage (prototype value), 10 stamina per hit |
| Perfect block | hit lands within 0.18 s of pressing block: 0 damage, attacker staggered 0.6 s |
| Armour mitigation | damage × 100 / (100 + Armour) |
| Downed (player) | at 0 HP the player is dragged back by sergeants; camera rises; battle continues (prototype rule) |
| Named companions | can't die. At 0 HP they're *carried from the field* and are out for N days (Kaelren 12, Jorren 8) |

Slice uses **one-direction attacks** (no Bannerlord four-way direction yet). Directional combat is a post-slice upgrade, gated on the feel test in M1.

### 5.2 Troop tiers (Flameborne line, slice)
Display names are **[PROPOSED]** except "Hearth Court".

| Tier | Name | HP | Armour | Attack | Recruit / upgrade | Upkeep / day |
|---|---|---|---|---|---|---|
| T1 | Hearth Levy | 60 | 10 | 10 | 10 crowns to recruit | 1 |
| T2 | Ember Spear | 80 | 25 | 14 | 120 XP + 20 crowns | 2 |
| T2r | Cinder Bowman (ranged, 35 m) | 70 | 15 | 12 (arrow) | 120 XP + 25 crowns | 2 |
| T3 | Kiln Guard | 100 | 45 | 18 | 300 XP + 60 crowns | 4 |
| T4 | Champion of the Hearth Court | 130 | 70 | 24 | 700 XP + 150 crowns, and needs Hearth Court standing ≥ 20 | 8 |

**Raiders (enemy, slice):** Slag-hill Raider (T1 equivalent), Raider Veteran (T2), Foundry Sellsword (T3: ember-orange visor, no spark reactor; patch §1 colours). They're raiders, *not* Dominion troops.
**Troop XP:** +10 per battle survived, +4 per kill, ×1.5 if the battle was against the odds (enemy ≥ 1.3 × your strength).
**Party size cap:** 30 + 10 × player Leadership (1–10), plus 10 if Kaelren is in the party. The slice starts at Leadership 6 (cap 100 with Kaelren) and can reach about 120 by the March Road fight (Leadership 8).
**Wages** are paid each 7 days. Unpaid: morale −10 per missed week, and 10% of T1 desert.

### 5.3 Morale (field battle)
Each unit has morale 0–100. The side's morale is the average.

| Event | Effect |
|---|---|
| Start value | 70; +10 if the commander is on the field; +5 per tier above T1 |
| Ally dies within 10 m | −4 |
| Enemy dies within 10 m | +2 |
| Attacked from the rear 90° arc | −1.5 per s |
| Commander downed | −20 for the whole side |
| Ember Wall cast in view | enemy −10 (once per cast), allies +5 |
| Kaelren's charge breaks a line | enemy units within 25 m −25 |
| Hold order near the commander (≤ 15 m) | +1 per s, up to 40 |
| Unit routs | morale < 20; it flees to the map edge and can rally at 35 if it isn't chased for 10 s |
| **Side breaks** | ≥ 60% of the side's units routing, **or** side strength < 33% of its start (prototype rule) |

### 5.4 The spell: Ember Wall (Embercraft) and its price
**Effect.** A line of fire springs up across the ground in front of you. It burns for 8 s, deals 25 damage per s to anyone inside it, and AI won't cross it on purpose (navmesh area cost). Morale effects are in §5.3.

**Heat: calm Embercraft is weak Embercraft** (Codex #45). Heat runs 0–100. It rises +2 per hit you land or take and decays 3 per s out of combat.
- Wall length = 8 m + 0.08 m × Heat (8–16 m)
- Burn damage = 25 × (0.6 + 0.004 × Heat) per s (15–25)

**The price: self-control.** Two attributes:
- **Control** (0–100): what you have right now.
- **Control Ceiling** (starts at 100): the most Control can ever recover to. Nothing raises it again (M2: "nothing undoes a Late price").

Cost per cast = 12 + 0.1 × Heat Control (12–22). So the more it matters, the more it costs.

| Stage (canon names, M1–M3) | Control | What happens |
|---|---|---|
| **Toll** | 70–100 | Recovers to the Ceiling with a night's rest (8 in-game hours in camp or town). The flame is a little brighter in the HUD. |
| **Debt** | 40–69 | On first entry: Ceiling −5, permanently. **Surge:** 15% per cast that your character makes a forced heavy attack at the nearest enemy, ignoring your input for 0.8 s. While in Debt you **lose the "back down / yield / kneel" dialogue options** (Embercraft "takes away the ability to refuse yourself"). Kaelren notices, without stating a moral. |
| **Arrears** | 15–39 | On first entry: Ceiling −10 more. Surge 35%. A surge in front of a companion costs −5 approval. Rest only recovers Control to 69. |
| **Reckoning** | 0–14 | On first entry: the **Ash-tongued** trait, permanent (no yield options ever again in this save). Surge 60%. The game warns clearly *before* the cast that would cross into it, and asks you to confirm. |

**Why it's fun, not just a punishment:** the Wall wins fights you'd otherwise lose (enemy −10 morale plus a held flank). The cost is visible, lasts, and changes how the character *talks*. That's the core question, as a mechanic.

**Hard limits (the "five things no art can do", M33):** the systems designer checks each one against Ember Wall before the M5 sign-off.

### 5.5 Companion: Jorren's ability, Unseen
For 6 s, enemies lose track of Jorren and of whoever is within 3 m of him (target-drop and no aggro). In the city, it opens one guarded door per district.
**Price: identity erosion** (Shadowdeep). Each use adds +1 **Faded**. At Faded 3, 6 and 9, townsfolk, then guards, then the party forget his face. That shows as a blurred portrait, guards stopping him, and party banter that gets his name wrong. Faded never goes down in the slice.
**Agency: the vanishing.** Before the March Road fight, if his approval is < 40 or you've used Unseen ≥ 4 times, Jorren is gone by morning, with no note. He comes back after the battle with the raider captain's ledger (approval ≥ 20), or doesn't come back (approval < 20). He doesn't explain either way.

### 5.6 Approval (both companions)
Approval runs −100 to +100 and starts at Kaelren +20, Jorren 0. Each companion tracks what *they* care about:
- **Kaelren** notices what things cost and never chooses himself. +5 when you pay a cost yourself instead of making the men pay it; −5 when men die for your convenience; +10 if you pin him at the vow and the flank holds; −3 per surge he sees.
- **Jorren** cares about being left alone and being paid. +5 when you keep a secret; −10 if you hand him to the watch; +3 when you pay him on time; −5 when you speak for him in the Hearth Court.
- **No romance in the slice.** (Romance is a full-game question for John.)

### 5.7 World map and economy
| Value | Number |
|---|---|
| Time | 1 real second = 1 in-game hour while moving; paused in menus |
| Party speed | 4.5 km/h base, −0.1 per 10 troops over 20, +0.5 on roads |
| Food | 1 ration per 10 troops per day; 0 food = morale −15 per day |
| Sites | Hearthmount (city, walkable), Hearthward (keep, map only), Kiln Gates (landmark), 5 villages, 2 raider camps, the slag-hill edge (impassable in the slice) |
| Realm standing | Hearth Court −100 to +100. +5 per raid stopped; +10 for taking the coin to the Emberwarden |
| Crowns | start 300; raider camp loot 150–300; contract 200 |

---

## 6. Content

### 6.1 Hearthmount (one walkable city)
Terraced round the inside of a living caldera. Every window looks inward and down onto the **Cinderway**, the river of fire that lights the city from below (Part 02, CANON). Four districts, one World Partition level, streamed:
1. **The Kiln Gates and the gate road.** Great basalt gates (CANON). Arrival, guards, recruit board.
2. **The Market Terraces.** Trade, smithy (forge glow), a tavern on the lower terrace (Jorren).
3. **The Cinderway Overlook.** The emotional shot of the slice: the glowing lake at night. Optional companion talks.
4. **The Palace Rim, exterior and the Hearth Court hall.** King's audience. The palace interior beyond the hall is out of scope.
Also: **the First Hearth**, a small plain stone hearth in the oldest quarter where every royal hearth is lit (Part 02). It's a quiet stop: a *rite*, not worship. **No gods, prayer or temples anywhere.**

**Art budget:** greybox first, then a Fab kit pass (§10.6). Target 60 fps on the recommended PC at High, 30+ on the minimum at Low.

### 6.2 The March Road fight (one large field battle)
- **Ground:** the Ember March, where black rock gives way to grey granite within a day's walk (Part 02). A low ridge, a broken road, a dry ford, and Hearthward's towers on the horizon (backdrop only).
- **Forces:** player about 120 (mostly T1–T2, some Kiln Guard) against about 160 raiders (with 20 Foundry Sellswords held in reserve).
- **On screen:** up to ~300 soldiers. The back ranks are cheap crowd instances (§10.4).
- **Win:** the raider side breaks. **Lose:** your side breaks; the player is dragged back and the March villages lose 20 prosperity. The story continues either way (a failure state, not game over).

### 6.3 Set-piece: Kaelren's vow (ported from the prototype)
When the reserve commits, about 40% of the way into the fight, time slows to 30% and Kaelren asks to ride at their line.
- **Pin him (warhorn):** he stays at your side; the right flank misses the order and you lose 6 men (prototype value). Kaelren approval +10 *if the flank then holds*, −5 if it doesn't.
- **Let him ride:** a scripted charge by Kaelren and 12 riders breaks the reserve. Enemy current strength ×0.5 (prototype `B.eCur *= 0.5`), and the local −25 morale event. He's carried off with a lance-head in his side: out 12 days.
- *(The prototype's third option, "burn a memory", leans on the deleted sister and a memory system that belongs to Spiritveil. Cut for the slice.)*
- Rules: **no death, no palm burn** (the Ember Oath's burn isn't given until the war starts; a final-act hint belongs to the full game), and **no Voyager** in the slice.

### 6.4 Kaelren (look and voice)
- **Locked face reference:** `/home/claude/out/kaelren_ref/Kaelren_CANON_face.png` and `Kaelren_turnaround_A.png` (B also exists). Copy them into `unreal/Reference/Kaelren/` (Git LFS) when art starts.
- **Age in this era is 17–18** (patch §3). The canon face is his Book One face ("about twenty, with old eyes"). The game needs a **younger read of the same face**: softer jaw, no old eyes yet. ⚠ *Concept Artist and John to approve a "Kaelren, Ascension age" sheet before the MetaHuman is built.*
- **Two looks in canon** (Cosplay kit): baking (shirtsleeves, apron) **or** armed (coat, mail). **The slice uses the armed look only.**
- **Voice:** steady, dry, notices costs, deflects praise. Uses "Again, little ember" only as the King's line to him. *Never explain the name in game text* (patch §3).

---

## 7. Narrative rules for the slice (Proof Gate checks every string)
- **Sealed.** The facts are in the private Canon Log and are **never written in this public repo or in game text**. Never state or hint: (a) who or what "the Unwritten" is, beyond what Ch2 shows; (b) who taught Kaelren to bake; (c) who the Harrowed King is; (d) Dalen's fate; (e) Elyon's future before the coup act; (f) the Voyager's titles, origin, fate or name. In game text he is only "the Voyager" or "the Hammer-Bearer". If unsure whether something touches this list, stop and ask John.
- **Never invent a name for the Voyager.**
- **No "god"** in any form (godlike, gods, prayer, temple, priest). Use rite or oath, hall or lamp-house, keeper or reader.
- Australian spelling. No morals stated aloud. Avoid "the weight of", "something shifted", and "I do not know" spam.
- Use **the Hearth Court**, not "Passion Court". Use **grey edge**, not rift.
- **Names not to reuse:** Maren; Hale (except Corvin Hale); Varek.

---

## 8. The Void on the map: grey edges
- **Canon (patch §4):** the first rift anyone saw is ~576 YB1. Before that the Void shows only as **grey edges**, and in this era they're **rare and faint** (patch §4). The slice is set before the Edict, so they're very rare.
- **Model:** the slice map is split into about 40 cells, each with a Grey value 0–100.
  - **Slice cap: 15 per cell, and at most 2 cells above 5 at once.**
  - Growth: +0.5 per day in a cell next to a grey cell (25% chance per day). A battle in a cell where more than 100 died adds +3 there ("only fear is loud", A12).
  - Decay: −1 per day if a **Kept Coal** is lit in the cell's village (an action costing 50 crowns and 1 day). The fire-lore fit: "fire unmakes". The coal lasts 60 days.
- **Effects at Grey ≥ 5:** party morale −2 per day while inside; village prosperity −1 per day; and one line in that village's ledger or codex entry goes **blank** in the UI. That shows the Void eating what's written without saying so.
- **Story stage cap (Spec `ovVCap`):** grey can take **0 holds** in the slice. It never takes a hold, a capital or a realm's last two holds.
- **No rifts. No Voidborn. No violet tear.** Visual: desaturation toward paper-white at the cell edge, a faint stippled "unfinished" outline like an unwritten page, and sound dampening. The prototype's violet stays as a 10% tint at most.
- **Tech:** a post-process material on the map camera reads a 64×64 grey-mask render target that `UVHGreyEdgeSubsystem` writes.

---

## 9. Scope cut list (out of the slice, in order of temptation)
1. Player mounted combat (Kaelren's charge is scripted).
2. Sieges (walls, ladders, gates).
3. Four-direction attacks.
4. More than one Realm, city or battle map; Realm politics beyond the Hearth Court standing number.
5. Lords on the map running their own campaigns (a few scripted parties only).
6. Character creator (pick one of 3 presets).
7. Multiplayer of any kind.
8. Full voice acting (Kaelren and Jorren key lines only; the rest is text).
9. MetaHumans for crowds (Kaelren only, and only if M7 performance allows).
10. Mass Entity full conversion (a timeboxed spike only, §10.4).
11. Saves beyond one slot and autosave.
12. PS5 (PC only for the slice).
13. Romance, the Edict, the coup, Elyon, Valek, the Voyager on screen.
14. **Never:** loot boxes, gambling-style mechanics, paid random rewards.

---

## 10. Technical plan (UE 5.8)

### 10.1 Engine and language
- **Unreal Engine 5.8** (released June 2026 through the Epic Games Launcher). The royalty is 5% of gross over US$1M per title; it's free to start.
- **C++ for systems, Blueprints for content and tuning.** C++ owns: attributes and costs (GAS), battle state and morale, the grey-edge subsystem, save data, input setup. Blueprints own: level scripting, UI widgets (UMG), ability visuals, dialogue sequences. Rule: **every number in a data table or data asset** so balance changes need no compile.
- **Project:** `unreal/VoidhammerSR.uproject`, module `VoidhammerSR`. The skeleton is in this branch.

### 10.2 Input
**Enhanced Input.** The skeleton builds a default mapping context in C++ at runtime, so it works with no assets on first open. Replace it with `IMC_Default` / `IA_*` assets later for remapping. Gamepad mappings ship from day one.

### 10.3 Gameplay Ability System (GAS) for spells and costs
- `UAbilitySystemComponent` on the player and on named companions; the crowd doesn't get one (cheap AI).
- `UVHMagicCostAttributeSet`: Health, MaxHealth, Stamina, Control, ControlCeiling, Heat, Faded.
- `UVHMagicCostComponent` turns Control into a **price stage** (gameplay tags `Price.Stage.Toll/Debt/Arrears/Reckoning`), applies permanent Ceiling losses once per stage, rolls surges, and answers `CanRefuseSelf()` for dialogue gating.
- **Ember Wall** = `UVHGA_EmberWall` (`UGameplayAbility`). Its cost is a GameplayEffect with a SetByCaller magnitude (`Data.Price.Control`) worked out from Heat. The ability commits, spawns a `BP_EmberWall` actor, and calls the component.
- **Stage 2 game reuse:** the same attribute set and component work in the smaller Stage 2 game if it's built in Unreal.

### 10.4 Big battles (honest plan for one person)
UE5 can draw thousands of soldiers. What's hard is *AI plus animation per soldier* on a mid PC.
- **Tier A, near (≤ ~40 m):** about 80–120 full `ACharacter` soldiers with skeletal meshes, cheap state-tree AI, and the **Animation Budget Allocator** plus URO (update rate optimisation).
- **Tier B, mid and far:** **AnimToTexture** (vertex-animation textures baked from the same rig) on Instanced/Hierarchical Instanced Static Meshes, driven by a simple formation simulation in `AVHBattleManager`. That's hundreds of soldiers for the cost of a few draw calls.
- **Promote/demote** soldiers between tiers by distance to the camera, using the Significance Manager.
- **Mass Entity:** a **timeboxed 8-hour spike in M4**. If Mass's crowd and representation pipeline (MassGameplay plugins) is stable enough in 5.8 for the formation sim, move Tier B to Mass. If not, ship the slice on Tier A/B and leave Mass to Stage 4 with a team. *We don't bet the slice on Mass.*
- Target: **2 × 150 soldiers at 60 fps** on the recommended PC (High) and at 30 fps on the minimum (Low).

### 10.5 World and rendering
- **World Partition** for Hearthmount and the battle map (streaming grid, one data layer per district). The **world map is a separate small level**: a stylised top-down terrain with a strategic camera, not World Partition.
- **Lumen** for global illumination and reflections at High and Epic; 5.8's **Lumen Lite** option (about twice as fast as High Quality, per Epic's 5.8 notes) at Medium; and **Low = Lumen off, baked or screen-space GI** for weak GPUs. **Virtual Shadow Maps** at High+. **MegaLights** (production-ready in 5.8) to try for the Cinderway's many emissive lights.
- **Nanite** for static architecture and rocks. Characters are skeletal meshes with LODs (and Nanite skinned meshes if they prove out in 5.8).
- **Scalability:** ship Low / Medium / High / Epic presets plus **TSR** (Temporal Super Resolution) at 50–67% screen percentage on Low and Medium. DLSS, FSR and XeSS plugins come later.
- **5.8 extras worth a look:** Mesh Terrain and the Procedural Vegetation Editor are both **experimental**. *Don't* build the slice on them; use Landscape plus Fab foliage. 5.8's experimental **MCP plugin** lets Claude read the editor; try it at M1 for AI-assisted work.

### 10.6 Asset sourcing (free first)
- **Fab** (Epic's store): free monthly assets plus the permanently free Quixel Megascans for Unreal (rocks, ground, debris: perfect for the March). Check each asset's licence (Fab Standard vs CC licences) and log it in `unreal/ASSET_LICENCES.md` when the first asset lands.
- **CC0** sources: Poly Haven (textures, HDRIs, models), Kenney, ambientCG.
- **Characters:** UE5 Mannequin (Manny/Quinn) and the engine's sample animations for greybox. Then a Fab low-poly soldier kit with Realm armour swaps. The prototype's plan of "one shared body, Realm armour variants" carries over.
- **Concept and texture art:** OpenArt (studio pipeline), always with the Concept Artist's character sheets. **AI art used in-game gets disclosed on Steam** (Steam's AI content survey).
- **Audio:** ElevenLabs for voices (Sound & Voice team); `mus/town.mp3` and `mus/combat.mp3` from the browser game as temp music.

### 10.7 MetaHuman for Kaelren (feasibility)
- **Feasible for one hero.** MetaHuman Creator runs inside the editor in recent UE5 releases, and MetaHumans are licensed for use in Unreal projects. Build Kaelren by hand in Creator against the face sheet. Mesh-to-MetaHuman is an option if a 3D head scan or sculpt exists later.
- **Costs:** a MetaHuman is heavy (groom hair, multiple LODs, 4K textures). In crowds, no. For Kaelren in close-ups and the city, yes, using the lower-quality/optimised LOD settings and card-based hair at Medium and below.
- **Risks:** (1) the likeness has to match a 2D canon face that's also older than his game age (§6.4); (2) the outfit has to be modelled separately; (3) disk and VRAM. **Decision gate at M7:** if Kaelren as a MetaHuman costs more than 3 ms GPU in the city at High, use a stylised custom head instead.

### 10.8 Source control (recommendation)
**Now: Git + Git LFS on GitHub** (the existing `raposiojd-dev/Voidhammer` repo, branch `unreal/slice-v0`).
- Reasons: John already uses it, it's free, Claude Code works with it, and this branch holds only text right now.
- GitHub Free includes **10 GiB of LFS storage and 10 GiB of LFS bandwidth**. An Unreal project with Megascans passes that quickly, and every fresh clone uses bandwidth.
- `.gitattributes` in `unreal/` routes `.uasset`, `.umap` and media through LFS and marks them **lockable** (binary files can't merge).

**Before the first big binary drop (M2–M3), decide one of these:**
1. **Separate repo** `Voidhammer-SR` (Git + LFS) so the browser game's history stays small. *Recommended next step.*
2. **Perforce Helix Core** (free tier, small team) when collaborators join, or when content passes about 20–50 GB. That's Unreal's native workflow, with the best file locking and the editor's built-in source-control integration.

Either way: **never commit** `Binaries/`, `Intermediate/`, `Saved/` or `DerivedDataCache/` (the `.gitignore` handles it).

### 10.9 Testing and tools
- **Automation tests** in `Source/VoidhammerSR/Private/Tests/` (Unreal's test root). The skeleton includes battle-math tests for morale, rout and price stages. Run them with Session Frontend → Automation, or headless with `-nullrhi`.
- **Claude Code Game Studios** agents and skills, adapted to Voidhammer, are in `unreal/.claude/` (see `unreal/.claude/ATTRIBUTION.md`).
- **Profiling:** Unreal Insights, `stat unit`, `stat gpu`, and `ProfileGPU`. The `perf-profile` skill records the results in `production/perf/`.

### 10.10 Hardware for John's PC
| | Minimum (it'll work, slowly) | Recommended (comfortable) |
|---|---|---|
| OS | Windows 10 22H2 / 11 | **Windows 11** |
| CPU | 6-core (Ryzen 5 5600 / i5-12400) | **8–16 cores** (Ryzen 7 7700 / 9 7900, i7-13700). Epic suggests 12–16 cores for local C++ compiles |
| RAM | 16 GB (pain with big levels) | **32 GB** (Epic's recommendation); 64 GB is nice |
| GPU | DX12, **8 GB VRAM** (RTX 3060 Ti / 4060 / RX 6600 XT) | **12–16 GB VRAM** (RTX 4070 / 4070 Super / 4060 Ti 16 GB / RX 7800 XT) |
| Disk | 250 GB free SSD | **1 TB NVMe** just for Unreal: engine ~60–100 GB with shaders, plus the project, plus the derived data cache |
| Tools | Visual Studio 2022 (Game development with C++) | **Visual Studio 2026** or 2022 (Epic lists both), or JetBrains Rider (free for non-commercial use) |

**Update, 1 Nov: John's PC is Windows, and its graphics "isn't great"** (exact GPU not known yet). Windows is the right platform: there's no Mac path to worry about, and PS5 later needs Windows anyway. The plan has three parts.

#### 10.10a Low-spec editor profile (the project's default until M7)
The skeleton **ships in low-spec mode**, so the first open works on a weak GPU:
| Setting | Low-spec default (shipped) | "Full look" (M7, or on a strong or cloud GPU) |
|---|---|---|
| Global illumination | **None** + Sky Light; static lighting allowed, so a GI bake is possible | Lumen (High), or Lumen Lite at Medium |
| Reflections | **Screen space** | Lumen |
| Shadows | **Classic shadow maps** (virtual shadow maps off) | Virtual shadow maps |
| Nanite | Project setting on, but **greybox uses ordinary meshes** (so it doesn't matter if the GPU lacks support) | Nanite for architecture and rocks |
| Renderer | **Deferred** (keeps the path to Lumen open) | Deferred |
| Anti-aliasing | TSR | TSR |
| Engine scalability (editor and game) | **Low** (`DefaultGameUserSettings.ini`, plus editor setting in the README) | High / Epic |
| Startup map | **`/Engine/Maps/Templates/Template_Default`**, a small basic map (not the heavy Open World template) | Slice maps under World Partition |
| Graphics API | DX12 (SM6); **DX11 fallback** for old or integrated GPUs (`-dx11`, see the README) | DX12 |

- **Forward shading** is cheaper still and gives MSAA, but it rules out Lumen and needs a full shader recompile to switch. Use it only if Deferred at Low runs under ~20 fps in the editor on John's GPU.
- **Switching to the full look** is one block in `Config/DefaultEngine.ini` (commented there). It triggers a long shader recompile once.
- **Working habits on a weak GPU:** small test maps; viewport Realtime off when not needed; viewport screen percentage at 50%; "Use less CPU when in background" on; close other GPU apps.
- **What this means for the plan:** M0–M6 are greybox and systems work, and run fine in low-spec mode. Only **M7** (the art pass, Lumen, the MetaHuman gate) and the battle **performance targets** at M4 need a decent GPU, either an upgrade or the cloud.

#### 10.10b Cloud GPU workstation (for heavy days)
Rent a GPU machine by the hour and stream its desktop. Use it for lighting builds, the M4 battle performance tests, the M7 art pass and MetaHuman work.
- **Options:** Shadow (a monthly cloud PC), Vagon or Paperspace (hourly cloud workstations), and AWS EC2 G-family or Azure NV-series VMs with Amazon DCV / Parsec (the most control). Choose a **Sydney region** where one is offered, because latency matters for editor feel.
- **Cost:** roughly US$1–3 an hour for an NVIDIA A10G/L4-class machine, or a flat monthly fee for Shadow. **Prices change, so the Treasurer checks current rates before John signs up.** Shut machines down after use.
- **The workflow:** the project lives in Git/LFS, so the cloud machine clones it, works, pushes, and gets shut down. Nothing important lives only on the cloud disk.
- **Limits:** you need a stable connection (aim for ≥ 25 Mbps and low ping), and gamepad-over-stream needs testing. It isn't a substitute for testing on a normal PC.

#### 10.10c Upgrade recommendation
- **GPU first:** **8 GB VRAM minimum, 12–16 GB preferred.** Examples: RTX 4060 / 4060 Ti 16 GB / 4070-class, or RX 7700 XT / 7800 XT. If the case and power supply allow it, this one part is the biggest win for the money.
- **RAM: 32 GB** (Epic's recommended spec) if he has 16 GB now.
- **Disk:** an NVMe SSD with ≥ 500 GB free for Unreal.
- **John: send the GPU model** (Windows: Start → type "dxdiag" → Display tab, or Task Manager → Performance → GPU), the RAM and the CPU, and the studio will say whether to upgrade now or use the cloud until M7.

**Mac (for the record):** Unreal 5.8 runs on Apple Silicon with Xcode, but PS5 development needs Windows. John is on Windows, so the Mac notes in the README are a footnote.

---

## 11. Milestones (one person + AI help)
Hours are John's hands-on hours with Claude Code doing most of the C++ and the docs. **Range = realistic to cautious.**

| # | Milestone | Done when | Hours |
|---|---|---|---|
| **M0** | Setup + skeleton compiles | Branch cloned, VS/Xcode installed, project builds, the Play button moves a placeholder character with WASD and a gamepad | **6–12** |
| **M1** | Feel test: third-person melee | Mannequin with sample animations; light/heavy/block/perfect block; 1 v 5 greybox fight that feels good to John | **30–45** |
| **M2** | Hearthmount greybox | 4 districts blocked out; walk, talk (data-table dialogue), recruit, trade; the King and Jorren scenes in placeholder | **40–60** |
| **M3** | World map | Top-down map, 12 sites, party movement, time, food and wages, enter site, intercept raiders, grey-edge cells | **50–70** |
| **M4** | Field battle | ~2 × 150 soldiers (Tier A + B), orders, morale, rout, results back to the map; Mass spike (8 h timebox) | **80–120** |
| **M5** | Magic cost (GAS) | Ember Wall, Heat, the Control stages, surges, dialogue gating, HUD flame | **25–35** |
| **M6** | Companions | Kaelren's vow, Jorren's Unseen and vanishing, approval, camp talks, golden path start to finish | **35–50** |
| **M7** | Art + audio + scalability | Fab kit pass on the city and battle, MetaHuman gate for Kaelren, music and ambience, Low–Epic presets measured | **60–90** |
| **M8** | Playtest + polish + package | 5 outside playtests (playtest-report skill), bug pass, Windows build packaged, a 2-minute capture for socials and pitch | **30–45** |
| | **Total** | | **≈ 356–527 h** |

**In calendar time:** at 10 h a week, about **9–12 months**. At 20 h a week, about **4.5–6.5 months**. M1 is the most important gate. **If melee doesn't feel good by the end of M1, stop and fix it before building anything else.** (The studio rule: prototype must be fun before any art.)

**The Stage 2 question for John.** The project instructions say finish a small game (Stage 2) before the vertical slice (Stage 3). The browser game is acting as that small game. If John wants a Steam release before the slice, M0–M1 plus a single-battle "March Road" game (about 150 h) could ship as the Stage 2 game in Unreal.

---

## 12. Risks and open questions
| # | Risk / question | Owner | Mitigation |
|---|---|---|---|
| 1 | John's PC is Windows with weak graphics (exact GPU unknown) | John | §10.10a low-spec defaults ship in the skeleton; cloud GPU for heavy days (§10.10b); GPU upgrade advice (§10.10c) once he sends the model |
| 2 | Battle scale on a mid PC | Tech Lead | Tier A/B plan; measure at M4 before any art |
| 3 | Kaelren's face is canon at ~20, but the game needs him at 17–18 | Concept Artist + John | Ascension-age sheet before MetaHuman (§6.4) |
| 4 | Is strong anger "loud" to the Void (M20 flag)? It affects grey-edge growth from Ember Wall | John | Slice uses deaths and fear only until John rules |
| 5 | New display names: Ember Wall, troop names, Unseen, Faded, "the March Road fight" | John | All marked [PROPOSED] |
| 6 | Repo size once binaries land | Tech Lead | Separate repo or Perforce before M2/M3 (§10.8) |
| 7 | Can Jorren's Turning tale (Brisa) be used? | John | Optional camp story, off by default |
| 8 | 5.8-specific APIs (Lumen Lite cvars, Mass status) haven't been verified hands-on | Tech Lead | Verify in the editor at M0/M4; the skeleton avoids 5.8-only APIs |

**Next action:** John sends his GPU model, RAM and CPU (from dxdiag), installs Unreal 5.8 and Visual Studio, and follows `unreal/README.md` to M0 in low-spec mode. *Owner: John (about 2 h of installs, then the first build).*
