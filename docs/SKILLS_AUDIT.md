# Skills audit: the v1 skill system (before the Realm Arts)

Games team, 1 Nov 2026. Scope: every skill, spell and perk the player could learn or cast in `index.html` at `f6add1d`, and how Strike / Block / Shoot / Cast worked in the 3D scenes (`g3d/battle3d.js`, `g3d/area3d.js`).

## The short version

The old system was six layers that had been added on top of each other: a base `SKILLS` sheet (7 trades), origin trees (8), three shared trees, a "Diablo-style" re-skin with 21 bolt-on skills, two NG+ "dark arts" branches, the Quiet Order's Silence branch, and the memory-burn Ledger. **About 150 nodes. Roughly 120 of them are a flat +% to one number.** No skill changed how you played a fight. There were no choices that closed other choices. Magic had one price (burn a memory or spend crowns) that had nothing to do with any Realm. In the 3D battle you could not cast anything at all.

| Problem | Where it shows | Count |
|---|---|---|
| **Samey +% stats** | `per: "+6% army strength"`, `fx: { dmg: 0.05 }` … | ~120 of ~150 nodes |
| **No identity** | "Hired Guards +4% army", "Battle-Tested Line +4% army", "Bread and Iron +4% army", "Heraldry +4% army", "Nothing to Lose +5% army" are the same node five times | 5 trees share the same 6 stat keys |
| **No visual feedback** | Passives are invisible. The 10 area actives draw one shared amber ring (`AR.wave`) and a toast; in 3D, that ring is all you see | all actives |
| **No synergy** | No node refers to another node's effect; no status (burn, slow, stun) is read by any other skill | 0 synergies |
| **No decisions** | Every node in a tree can be maxed; there are no exclusive choices; "choose a path, the rest close" was a soft lock on origin trees only | 0 exclusive choices |
| **One button** | Only one battle skill could be equipped (`S.skEq`), swapped with a ⇄ button | 1 active at a time |
| **Price with no Realm** | Actives cost crowns, grain or half a heart. "Spark Flare" (radiance) cost a heart. Nothing used Clarity, Numbness, Stone, Years, Temper, Bleed, Erosion or Humanity | 0 canon prices |
| **3D battles** | `battle3d.js` had Strike / Block / Shoot / Orders only. No Cast. `skUseField` only ran on the 2D fallback field | 0 actives in 3D |
| **Respec** | 100 crowns flat, no in-world meaning | — |

## Layer by layer

### 1. Base trades (`SKILLS`, index.html ~2936)
| Skill | What it did | Why it was weak |
|---|---|---|
| Giant-Slayer | +10% damage to bosses | flat % |
| Drill | +7% strength, +10 column | flat %; the only one that mattered (column cap) |
| Discipline | −8% wages | flat economy % |
| Rally | −10% battle deaths | flat %, invisible |
| Sergeant | +1 battle xp per 10 men a day, men eat 5% more | the one interesting trade-off, buried |
| Banners | +8 column | flat |
| Marshal | +6% strength from allied heroes | flat, rarely relevant |
| Ironhide | +15% health in the field (+1 heart) | flat |
| Blademaster | +12% your damage | flat |
| Fletcher / Quick Draw / Heavy Draw | archer strength, shot speed, arrow damage | flat % |
| Skirmisher | +8% escape chance | flat |
| Steady Aim | arrows home slightly | the only feel change in the base sheet; unseen |
| Multishot | 2/3/5 arrows in a fan | a real mechanic, but costs arrows and only on foot |
| Haggler / Provisioner / Scavenger / Steward / Garrisoner | buy/sell %, grain %, loot %, holding income %, garrison refill | flat economy |
| Silver Tongue / Diplomat / Renown | pledge %, peace cost %, hero price % | flat |
| Pathfinder / Sapper / Void-ward | map speed %, siege strength %, void strength % | flat |
| Steady Hand / Remembrance / Spark-ward / Sparkcaller | fewer men lost when casting, xp per burned memory, spark burnout %, spark troop strength % | the only magic-aware skills, all flat % |
| Bloodlust / Cleave / Dark Fortune (NG+) | heal chance on kill, 30% splash, loot rarity % | Cleave was a real effect; the rest flat |
| Death-ward / Bossbane / Tempo (NG+) | survive one killing blow, +20% boss damage, −8% strike cooldown | flat, except Death-ward |

### 2. Origin trees (`ORIGSK` + `ORIGTREE`, ~5901 and ~10156)
Eight trees of seven nodes, one per upbringing: Road Wisdom, Hands in the Soil, The Merchant's Way, Sellsword Code, Cutthroat Ways, The Forge-Hand, Blood and Name, Hollow Gifts. Each: three flat starters (map speed, grain a day, crowns a day, army %, damage %, column), two flat side passives, one capstone (+8% damage and +5% speed, +4% army, +6% army and −4% deaths …) and **one signature active**:

| Active | Effect | Cost | Why weak |
|---|---|---|---|
| Dust Kick (Wanderer) | stall foes near you 1.8–3.4 s | 6 crowns | a stun ring |
| Scythe Sweep (Farmer) | circle hit 135–275% | 3 grain | a damage ring |
| Buy Their Loyalty (Trader) | foes down tools; in battle up to 13 run | 20+ crowns | a stun ring with a coin toast |
| Shield-Wall Contract (Mercenary) | −42–70% damage 6–12 s | 8+ crowns | invisible buff |
| Knife in the Dark (Outlaw) | step behind nearest, 370–650% strike | half a heart | the best of them; no animation |
| Hammer Fall (Smith) | slam, stun | half a heart | a damage ring |
| Raise the Banner (Noble) | heal, +30% strike 8 s | 20 crowns | buff, toast |
| Hollow Step (Void-touched) | dash through, 245–425% strike | half a heart | a dash with a toast |

Six of eight are "a ring around you". The fifth-row extras (Many Roads, Stray Luck, Hearth and Home, Cheap Hands, Market Rumours, Pay in Advance, Never Fall Back, Nine Lives, Cut Purse, Arms Dealer, Hard as the Anvil, Rally the Houses, Noble Bearing, Cold Hunger, Unmoored) are 16 more pairs of flat % keys.

### 3. Shared trees (Survival, Warfare, Wayfaring, ~10797)
22 nodes, all `fx` stat keys with an origin bias multiplier (`SGB`) that changed the number by 10–40% depending on upbringing ("your path is gifted at this"). Footwork, Evasion, Thick Skin, Read the Boss, Adrenaline, Second Breath, Iron Nerve; Close Order, Shield Discipline, Steady Nerve, Archery Doctrine, Rallying Voice, Field Surgeon, Warlord, Siegecraft; Long Strides, Forager, Sharp Eye, Travel Light, Scout's Eye, Quick Study, Master of the Road. **Bias made them different numbers, not different skills.**

### 4. The bolt-on 21 (`ovSKUI`, ~13363)
Tumble, Shield Bash, Second Wind, War Horn, Whirlwind, Volley, Coin Toss, Parley, Caltrops, Spark Flare (actives) and Iron Constitution, Old Guard, Far Horizon, Legion, Bulwark, Battle Fury, Eagle Eye, Tithe, Envoy, Engineer, Keeper (passives). The ten actives repeat the origin actives: Whirlwind = Scythe Sweep, Caltrops = Dust Kick, Coin Toss = Buy Their Loyalty, Parley = Buy Their Loyalty again. **Spark Flare** was the only "Realm" spell and cost a heart, not Clarity.

### 5. Silence (the Quiet Order, ~14902, story-gated)
Soft Step (sneak toggle), Shadow Cloak, Blade in the Dark, Assassinate, Smoke and Silence, Light Fingers, Underway Walker, Nightblade. The best-designed branch in the old game (a mode, not a %), but its price ("a little of your name") was half a heart.

### 6. Memory and the Ledger (Cast)
On foot, **Cast** opened a dialogue: spend void-glass on a piercing bolt, or burn a memory from `S.held` for a 66-px wave (3 damage). On the battle sheet, "Cast · burn a memory" ended the fight. This is canon-flavoured (ghostlight spends the memory) and story-wired (Kaelren's vow, Elyndra's Ledger), but it was one spell for every Realm.

## How Strike / Block / Shoot / Cast worked in 3D (before)
- **Battle** (`battle3d.js`): Strike = 0.55 s cooldown, hits up to 3 foes in a 1.0-rad front cone within reach 1.9 for `heroW × 0.9–1.2`. Block = hold; frontal hits ×0.2 (cavalry ×0.5), move speed 1.8. Shoot = 1.1 s, aim-assisted arrow. Orders 1–6 and the order fan. **No Cast, no skills, no buffs.** Hero damage and health come from `heroStats()` (reads `sk("ironhide")`).
- **Areas** (`area3d.js` draws the 2D sim `AR`): Strike/Shoot/Use buttons drive the sim; `#acast` opened the Ledger dialogue; `#askill` held the one equipped active; effects were `AR.wave` (one ring) and `AR.fx` sparks.

## What we keep
- The economy numbers. Old ids (`drill`, `banners`, `rally`, `discipline`, `sergeant`, `forager`, `haggler`, `ironhide`, `fletcher`, `scavenger`, `pathfinder`) are still read everywhere through `sk()`. The new Commander and Realm passives feed those same ids, so no formula changed.
- Upbringing gifts (`S.skStart`), Gatewalker (`ms_gate`, now granted free by the Grey Writ quest) and the Quiet Order's story-gated Silence ranks.
- The Ledger: it is still there, as the small **Ledger** button in the ability tray.

See `docs/SKILLS_DESIGN_v2.md` for the replacement.
