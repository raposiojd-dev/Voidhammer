# The Realm Arts: skills v2 design

Games team (Game Director, Systems, Technical, Art/Audio), 1 Nov 2026. Replaces the v1 skill system audited in `docs/SKILLS_AUDIT.md`. Code: `g3d/skills2.js` (data, rules, prices, abilities, VFX, sheet), hooks in `index.html` (search `THE REALM ARTS`), `g3d/battle3d.js`, `g3d/area3d.js`.

## Principles (what we took from the best action RPGs, not their abilities)
1. **Every skill changes how you play.** An active moves you, moves them, or changes the field. A passive changes a rule ("Strikes on slowed foes deal +25%", "while The Set is up your men cannot rout"), not just a total.
2. **One fantasy per tree, readable in a breath.** Each tree has a sentence of fantasy and a sentence of price. Each node has a one-line description and a "what changes" preview (now → next rank, changed lines highlighted).
3. **Choices that close doors.** One Spark, one Half-Spark; one keystone of two per tree. Unlearning is possible and costs something in the world.
4. **Feedback you can feel on a phone.** Every active has its own colour, shape and sound: rings, cones, beams, pillars, ground decals, light flashes, camera shake, a screen-edge flash, and a per-art synth voice. Cooldowns sweep round the button; the price is on the HUD.
5. **Synergy through shared statuses.** Burning, slowed, stunned, marked. Passives in one tree read statuses from another, and any ability landing on a foe already carrying a different art's status scores a **Combo** (+20%).
6. **THE WORLD'S LAW: every magical ability has a price.** Taken from the World Book's ten arts (Part 6): the price is the virtue overdone.

## Structure
- **Commander** (everyone): orders, formations, morale. No magic, no price.
- **Eight Realm arts**: Embercraft (Flameborne), Chrona (Frostgrave), Radiance (Lightforge), Tempest (Stormreach), Gravem (Stonehold), Veilweave (Spiritveil), Shadow Inversion (Shadowdeep), Synthetic Spark (Metalcrown).
- **Spark and Half-Spark** (canon, Part 6 §2): the first Realm art you learn is your **Spark** (all tiers, both keystones, full price). The second is your **Half-Spark**: tiers I–II only, 80% power, and its meter can never pass 74 ("a Half-Spark can't afford the big spells, so they never go bankrupt"). No one carries more. The sheet never names the TwinSpark.
- **Per tree:** 3 actives (phone buttons), 5 passives (Commander: 6), 2 mutually exclusive keystones.
- **Tiers:** I open · II needs 3 points in the tree · III needs 6 points and level 6 · Keystone needs 10 points and level 10. Actives and passives have 3 ranks; keystones 1.
- **Points:** one per level (plus the existing quest and NG+ bonuses). Level 20 ≈ 19 points: a full Spark keystone plus a Commander core, or a Spark and a Half.
- **Loadout:** three ability buttons. Learning an active fills an empty slot; the sheet has 1/2/3 equip buttons.

## The price (THE WORLD'S LAW)
Each Realm art has a meter, 0–100, with the canon's four stages (Part 6 M3):

| Stage | Range | In the game |
|---|---|---|
| **Toll** | 0–49 | Reversible. Fades in a fight when you stop casting (≈1.1/s after 4 s), faster on the map (3/s). |
| **Debt** | 50–74 | The body shows it (sheet text from the World Book's "On the body"). A toast names the stage. |
| **Arrears** | 75–99 | **The art's own consequence** for the rest of the fight (below), +1 permanent **Mark**. First time: a Kaelren line in the journal if he is with you, and Elyndra writes it in the Ledger. |
| **Reckoning** | 100 | The art **seals** until the meter falls under 60; you lose a fifth of your health and are rooted for a second; +2 Marks; Elyndra records it. |

**Marks never walk back** (canon: nothing undoes a Mid price). Each Mark raises the meter's floor by 4 (max 40) and adds 2% to that art's damage (the virtue, overdone).

| Art | Meter | Stages (Toll / Debt / Arrears / Reckoning) | Arrears consequence |
|---|---|---|---|
| Embercraft | **Temper** | Spark Temper / Sleepless / the Flare / Burned Out | You cannot Block; each cast scorches men near you (on foot: bites you). |
| Chrona | **Numbness** | the Late Laugh / the Dry Eye / the Fact of Love / Hollow | Everything you do for your men (rally, wards, morale) lands at half strength. |
| Radiance | **Clarity** | the Tell / the Certain / the Clear / the Glare | You cannot fall back: the Clear do not doubt. |
| Tempest | **Years** | the Ache / the Grey / the Burn / the Drop | A quarter of your health is gone for the fight. The sheet counts the years you have spent (≈1 per full charge). |
| Gravem | **Stone** | the Stiffening / the Grey Hand / the Crane-Arms / the Stillman | You move 30% slower; blows land 15% softer. |
| Veilweave | **Bleed** | the Dreaming / Ghost-habits / the Overlay / Going to the Lamps | 30% of Veil casts answer with the wrong memory (a different Veil art fires). |
| Shadow Inversion | **Erosion** | the Startle / the Hand / the Keeper's Need / Going Under | Your orders land two heartbeats late ("your name does not land"). |
| Synthetic Spark | **Humanity** | the Count / the Procedure / the Protocol / the Last Part | You cannot fall back; your men's morale drops 8%. |

Each tree has a passive that makes its meter fade 35% faster per rank (Bank the Coals, The Kept Word, A Paling Shadow, Stillness, Copying-rooms, A Keeper's Name, Governor; Tempest's Life-cord makes casts cheaper instead).

## The trees
Costs are meter points per cast; cooldowns in seconds at rank 1 (−8% per rank). "×" is a multiple of one Strike.

### Commander — the Captain's Voice (no price)
- **Sound the Rally** (cd 30): routed men within 20 yd return; morale +25%, your men +20% damage for 8 s. On foot: +30% damage, foes flinch.
- **Lock Shields** (II, cd 22): infantry form a shield wall at once; you and your men −35% damage 6 s. On foot: −55% damage 4 s, shove.
- **Hammer and Anvil** (III, cd 35): infantry hold, cavalry charge (or the line, if no horse); enemy morale −14%; chargers +35%. On foot: a 7-yd charge, 1.6×.
- Passives: Muster Rolls (+8 column/rank), Yard Drill (+7% army, +10 column), Field Surgeons (−10% deaths), Paid on Time (−8% wages), Sergeants (daily training), Quartermaster (grain, buy/sell). These feed the old economy ids.
- Keystones: **The Banner Never Falls** (morale floor 45% while you stand; you can never fall back) **or** **Lead from the Front** (Commander cooldowns −40%; each kill lifts you and your men +6% for 6 s, stacking 5; you take 20% more).

### Embercraft — the First No (Temper)
- **Brand** (cd 6, +9): a fire bolt at the nearest foe ahead, 1.4×, burns 3 s, splashes.
- **The Refusal** (II, cd 14, +16): fire nova 4.5 yd, 1.6×, knockback, burn; if you were hit in the last 2.5 s it is 40% wider and 50% harder.
- **Firebreak** (III, cd 20, +22): a 10-yd wall of fire 4 yd ahead for 6 s; anything crossing burns and staggers. Breaks enemy lines.
- Passives: Run Hot (+6% Ember damage per Temper stage: calm fire is weak fire), Ember-cracks (Strikes burn), Kindling (burning foes spread fire when they fall), Bank the Coals, Fire Unmakes (+15% vs the void-touched; canon: fire unmakes Voidborn).
- Keystones: **Patient Fire** (half Temper, never past the Debt, −20% damage: "quicker to be patient") **or** **Unbanked** (at the Debt or worse, no cooldowns; you cannot Block).

### Chrona — a heartbeat ahead (Numbness)
- **Echo Step** (cd 8, +10): dash 6 yd, untouchable; an Echo stays and draws their blows (battle: a decoy they attack; on foot: foes near it are held).
- **The Hold** (II, cd 22, +20): foes within 7 yd slowed 65% for 5 s; arrows in the air stop and fall.
- **A Heartbeat Ahead** (III, cd 18, +14): the next 3 hits in 6 s are dodged and answered with a 1.2× counter.
- Passives: Cold Touch (heal 4% per Chrona cast), Shatter (+25% Strikes on slowed foes), Ice-mirror (slowed foes take +8% from everything), The Kept Word, Seer's Lead (archers +10%).
- Keystones: **Winterheart** (the Hold freezes for 1.5 s first; double Numbness) **or** **Three Echoes** (3 charges; Echoes burst in frost).

### Radiance — all lies burn (Clarity)
- **Radiant Shield** (cd 12, +12): block everything from the front for 3 s; attackers are blinded.
- **Truth-field** (II, cd 18, +15): 6-yd field, 6 s: foes inside deal 30% less and take +20%.
- **Judgment** (III, cd 20, +20): mark the strongest foe ahead; 1.2 s later a pillar of light, 4×, dazes those beside it.
- Passives: Glare (+10% vs stunned), Witness (+8% Strikes on whoever hurt you), Warm Hands (heal when you blind), A Paling Shadow, Noon (+10% radius).
- Keystones: **The Certain** (Judgment ×1.6 and readies the Shield; at the Debt you cannot Block) **or** **Sworn in Light** (Truth-field walks with you 10 s; foes who strike you in it are blinded).

### Tempest — keep moving (Years)
- **Wind-step** (cd 5, +7): 8-yd stride through them (0.6×, thrown aside); your Strike is ready again.
- **Squall** (II, cd 14, +15): lightning chains 4 foes, 2× then −20% each, stun.
- **Sky-charge** (III, cd 18, +24): gather 0.5 s (untouchable), then a 14-yd charge, 2.4×, knockdown. "The knot on your life-cord is real."
- Passives: Light Feet (+5% speed), Pressure Blow (Strike knockback and stagger), Static (after a Wind-step, the next Strike arcs), The Life-cord (−10% Years), Gale (+1 chain).
- Keystones: **Tempest Form** (Wind-step 3 charges; double Years) **or** **The Anchorite** (half Years; the wind comes late and short: half-length dashes, +2 chains). Canon: the Anchorites chose staying.

### Gravem — hold for others (Stone)
- **Press** (cd 10, +13): a 4-yd cone of weight, 2×, pinned 1.2 s.
- **The Set** (II, cd 16, +15): 5 s: −55% damage, immovable, attackers stagger, your men within 6 yd −25%; you move very slowly.
- **Weight of the Mountain** (III, cd 24, +22): a well 6 yd ahead drags foes in for 3 s, then crushes, 2.2×.
- Passives: Grey Hand (+1 heart / +15% health per rank), Burden-stone (+8% Strikes, longer stagger), Hold the Line (men near the Set cannot rout), Stillness, The Shouldering (+12% reach).
- Keystones: **The Mountain's Heart** (the Set lasts until you move; 4 Stone a second) **or** **Hearth-and-Hold** (Press leaves a burning forge-crater).

### Veilweave — what is kept (Bleed)
- **Lantern Path** (cd 10, +11): step 8 yd along a lantern path, behind the nearest foe if there is one; foes there are dazed.
- **Echo Guard** (II, cd 25, +20): battle: 3 remembered soldiers fight 12 s (canon: remembered soldiers given weight, not the dead called back). On foot: two ghost blades circle you.
- **Remembered Room** (III, cd 20, +18): a 6-yd room 5 yd ahead for 5 s; foes inside are lost (stunned 2.3 s) and take +20%.
- Passives: The Lamp-tilt (−4% damage taken), Memorywood (+5% xp), Anchor (+1 soldier, +2 s), Copying-rooms, Ghost-habit (+12% damage 5 s after each Veil cast).
- Keystones: **The Remembering Watch** (5 soldiers who stand until struck down; double Bleed) **or** **The Thinning** (Lantern Path 2 charges, foes lose you for 1.5 s; Bleed never fades below 25 in a fight).

### Shadow Inversion — the Turning (Erosion)
- **Shadow-step** (cd 8, +10): out of their shadow, behind the nearest foe, 2.5×.
- **Silence Field** (II, cd 20, +15): 6-yd silence 6 s: enemy archers inside cannot loose, their morale falls; on foot, foes lose you and slow, your strikes from inside +30%.
- **Fear-cast** (III, cd 22, +18): an 8-yd cone: 70% break and run, the rest freeze 2 s. The fitted feel no fear (canon: Iron Wraiths can't be frightened).
- Passives: Knife-work (+20% Shadow-step), The Lagging Shadow (+3% dodge), No Prints (+15% loot), A Keeper's Name, Switch Dark (+12% vs Metalcrown's fitted).
- Keystones: **The Unmaker's Hush** (Shadow-step resets on a kill; double Erosion) **or** **The Quiet Gardens** (Silence Field follows you 10 s; Strikes inside it +60%).

### Synthetic Spark — the Fitting (Humanity)
- **Sparkbolt** (cd 6, +9): three bolts at the three nearest foes, 0.9× each.
- **Core Vent** (II, cd 16, +17): a 4-yd ring, 1.4×, knockback, stun; arrows nearby are knocked out of the air.
- **Overdrive** (III, cd 25, +20): 8 s of +40% damage, +25% speed, −15% damage taken; then the core cools (slowed 2 s).
- Passives: Riveted Plate (−4% damage taken), The Count (+10% vs a foe alone), Runs All Night (map speed, grain), Governor, Sees Heat (+15% Sparkbolt, +2 yd).
- Keystones: **Name the Hand** (5 piercing bolts; your Strike −15%) **or** **Name Sleep** (Overdrive 12 s with no crash; Humanity returns at half speed). Canon: the Fitting asks what part you will give.

## Pairings (Spark + Half-Spark), from the World Book's clash table (M32)
| Pairing | Arts | Effect |
|---|---|---|
| Firestorm | Ember + Tempest | Wind-step and Squall set what they hit burning; Brand splashes wider. |
| Hearth-and-Hold | Ember + Gravem | Press sets foes burning; The Refusal pins them. |
| Sworn Stone | Radiance + Gravem | The Set marks every foe within 5 yd (+20%). |
| Dead Air | Shadow + Tempest | After a Wind-step, the next Strike is a knife in the back (+60%); Silence Field 30% wider. |
| Winterglass | Chrona + Veilweave | Your Echo fights as a remembered soldier. |
| Thieves of Fire | Ember + Synthetic | Sparkbolts set foes burning; Brand pierces. |
| The Rivalry | Chrona + Ember | Burning foes count as slowed; slowed foes burn longer. |

## Numbers vs current enemies
- 3D battle: a Strike is `heroW × 0.9–1.2` to up to 3 foes, every 0.55 s (≈1.9× per second against one target). Ability bursts are 1.4–4× on 6–25 s cooldowns, so a full rotation adds roughly 30–45% to your own damage over a fight and the army still decides it. Enemy units have `w × 3.2` health; a 2× ability kills a matched bandit in one or two casts, not a lord's line.
- On foot: abilities scale off `atkDmg()` (the same number as Strike) and go through `dmgEn`, so boss multipliers, armour and NG+ tiers apply unchanged. Bosses take a third of every stun.
- A Spark caster can cast 4–6 abilities in a hard fight before reaching the Debt; pushing past it is a choice.

## Phone UI
- **Sheet:** loadout strip (3 slots) → nine tree crests (5 + 4 on a phone, glow when a point can be spent, SPARK/HALF badges) → tree header (fantasy + price) → pairings chips → four tiers with lit connectors (actives round, passives square, keystones as large diamonds with OR) → a sticky detail panel (icon, one line, price + cooldown, "what changes", Learn / 1-2-3 equip) → the price (meters, stage text, marks, years) → Unlearn.
- **Moments:** Recognition (first Realm art becomes your Spark), Half-Spark, and the keystone choice ("Choose who you become", both side by side).
- **Fights:** Cast opens three big buttons in an arc above the Strike thumb (Cast again closes; remembered per device). Cooldown sweeps, price chip (+9) on each, key labels (1/2/3 on foot, 7/8/9 in battle, L toggles). The price meters sit top-left with the other status readouts. On phones the Orders button moves left to make room.
- **Landscape first (John, 1 Nov):** 3D play is designed for a phone held sideways (`g3d/landscape.js`): stick bottom-left (a faint ring shows where), Strike / Block / Cast and the ability arc bottom-right, health, morale and the price along the top-left, scene buttons along the top edge, safe-area insets respected, nothing under 44px. The skill sheet goes two-column (tree left, sticky detail and price right) whenever the screen is 700px or wider, so it reads well sideways and on desktop. Upright during 3D play, a "Turn your phone sideways" card appears (Go fullscreen tries `screen.orientation.lock`; iOS falls back to the card; "Play upright anyway" dismisses it for the session). The manifest asks for landscape.
- **Ledger:** the old memory magic (void-glass bolt, burn a memory) is the small Ledger button in the on-foot tray.

## Respec: the Contradiction
Unlearn everything at any time out of battle for 40 + 20 crowns per point spent (a Conclave tutor's fee). Spark and Half-Spark are free to choose again. **Marks stay.** For five days every price costs 25% more ("when your life and your spark disagree, the spark punishes you": Part 6 law 3). No real money, no loot boxes, nothing random to buy.

## Canon and writing checks
- No gods; no worship words. The Voyager, the TwinSpark's identity, the Unwritten, Emberhold and every sealed fact are absent. Kaelren appears only as a companion line in the journal when he is with you; his own spark stays undecided (Part 6 Embercraft note).
- Era: the Concord's last season, before the Radiant Edict. Metalcrown's fitting is shown as a trade a Kiln engine-keeper will do; no Valek, no Reaper.
- Australian spelling.

## Save and compatibility
- New save key **`S.sk2`** `{ v, r (ranks), eq (3 slots), spark, half, m (meters), marks, peak, years, seen, refunded, contra }`.
- On the first load of an old save, every bought v1 rank is refunded (upbringing gifts in `S.skStart`, `ms_gate` and the Quiet Order's `sil_*` ranks stay). The old map is kept as **`S.skLegacy`**. No storage key changed.
- Economy formulas still read `sk("drill")`, `skfx("tough")`, etc.; new passives add to those through the same functions.

## Known gaps / next
- The Quiet Order's Silence branch is preserved for players who had it but cannot be learned new; fold it into Shadow Inversion's keystones with the quest flag.
- Echo Guard soldiers reuse the troop figure with a ghostlight glow, not a bespoke translucent model.
- The 2D no-WebGL field has no abilities (it shows a message).
- Origin trees are gone; upbringing still sets starting gifts. A future pass could give each origin a recommended Spark.
