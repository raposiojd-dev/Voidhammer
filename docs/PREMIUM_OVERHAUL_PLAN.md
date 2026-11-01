# VOIDHAMMER: THE SHATTERED REALMS. Premium overhaul plan
*Games team · 1 Nov 2026 · branch `game/premium-v1` (from `game/third-person-v1`)*

John's brief: *"This needs to feel like a premium game made by a massive team like Blizzard, like this is their latest creation. Do a full overhaul of the game. Even the beginning, where you select the character type, needs updating. Make it canon."*

This document has four parts: an honest audit of every screen in the order a player meets them, a phased plan, the art direction bible that every later phase follows, and what Phase 1 (the front door) actually shipped.

---

## 1. Honest audit, screen by screen

How we looked: Playwright at 390x844 (iPhone portrait) and 844x390 (iPhone landscape), the existing screenshot sets in `docs/screens/v2-stage1` to `v2-stage3`, and the code. Software WebGL only, so this audit judges the look and the flow, not the frame rate.

The verdict in one line: **the game's systems are deep and its writing is good, but almost every screen still says "prototype": six fonts, three button styles, monospace everywhere, debug-looking side buttons, and no motion design.** The bones are there. The skin is not.

| # | Screen | What makes it feel cheap or amateur today |
|---|---|---|
| 1 | **Boot** | A plain "Loading your save…" line in Georgia italic on black, then "DRAWING THE WORLD…" in monospace. No mark, no progress feel. Two different loaders. |
| 2 | **Title** | Good painted art and a video loop, but: a generic dark-knight image with no Voidhammer identity; the wordmark is plain gradient text; "Tap for sound" floats as a debug pill; buttons are glassy web-app pills next to a gothic logo; no entrance sequence, so the game appears rather than arrives; "Save slots and backup" sits on the front page; in landscape the art crops to sky. No Settings or Credits. |
| 3 | **New game / character select** | Three generic upbringing lists (farm, wagon, forge…) that read like a tabletop worksheet. None of it is canon: you are nobody from nowhere, in a world where every person belongs to a Realm with a price for its magic. Each card is a text block with monospace stats. No portrait of *you*, no Realm, no colour identity. Then a second, separate sheet asks for name, banner and difficulty. |
| 4 | **Intro** | A slide-up text sheet: a static image, five paragraphs and a button. The most important moment for tone is a wall of text with UI chrome around it. |
| 5 | **World map** | Rich, but crowded and inconsistent: a mono HUD strip, a "Backup" vertical tab, a floating "WALK" coin, a "Next deed" ribbon over the town label, zoom buttons in a third style, a minimap in a fourth, and a seven-button bottom bar in mono caps. The Realm name is painted over towns. Labels clash with lord labels. |
| 6 | **Settlement sheets** | The best screens in the game (painted header art, clear sections). Cheap tells: mono body text for every row, inconsistent button styles inside one sheet, grammar slips in generated text ("1 steel swords", "1 lances"), and the sheet frame is a plain rounded rectangle. |
| 7 | **3D walk (towns, Ashford)** | Rigged people and lit streets are a big step up, but: the camera clips into walls; side buttons ("GRAPHICS: HIGH", "RUN", "AUTO-RUN", "TOWN MENU") look like a debug panel; the top bar repeats the sheet buttons in boxed caps; keyboard help text shows on phones; low-poly cone trees and flat ground; toasts overlap the tutorial caption. Your hero wears the banner colour, not your people's clothes. |
| 8 | **Battle (3D)** | Formations, orders, volleys and morale work. Cheap tells: the tutorial caption sits on top of the action in centre screen; mono labels; enemy and ally readability depends on ring decals; the field is an empty brown plane with cone trees; health bars are plain strips; no hit-stop, no camera shake, no impact sound layering. |
| 9 | **Siege (3D)** | Walls, gate, ladders and ram are real now. But defenders are hard to see on the wall walk; the ground is flat; the keyboard order list is printed across the top of the screen on phones; no fire, smoke or arrow trails to sell the scale. |
| 10 | **Menus (☰, Party, Realms, Heroes, Skills, Ledger, Record)** | Functional and complete. Cheap tells: every sheet uses the same slide-up card with no hierarchy; long italic paragraphs explain rules that a tooltip should hold; the skills tree icons are thin line art next to painted item icons; tabs, chips and pills come in three shapes. |
| 11 | **Ending** | The Thousand-Year War begins in a text sheet. No cinematic, no music sting, no title card, no credits. The story's biggest beat has the least presentation. |

What already works and must be kept: the painted settlement art and item icons, Kaelren's voice and the dry humour, the per-Realm 3D looks, the order fan in battle, and the rule that every scene result still goes through the existing systems (`finishBattle`, the sheets).

---

## 2. The phased plan

### What a phone browser game can and can't do (be honest)
- **Can:** a cohesive art direction, premium typography, motion design and transitions, synthesised and sampled sound design, cinematic title cards, 3D character previews, lit low-poly 3D scenes at 30–60 fps on a recent iPhone, stylised post-processing (vignette, grain, colour grade), and a UI kit as polished as any console menu.
- **Can't, without a team and a native engine:** photoreal characters, motion-captured animation, facial performance, real-time global illumination, crowds of hundreds, streaming open worlds, or full voice acting for every line. "Blizzard's newest game" on a phone means **Blizzard's art direction and polish discipline applied to a stylised game** (think Hearthstone or Diablo Immortal's menus, not Diablo IV's renderer).
- **Budget rules for every phase:** under ~2 MB of new assets per phase; no runtime CDN; pixel ratio capped at 1.5–2; one WebGL context at a time; everything degrades to 2D if WebGL fails; reduced-motion honoured.

### Phase 1. The front door (this branch, shipped)
Boot, title, canon character creation with a 3D preview, the opening cinematic, transitions, UI sounds, settings and credits, the component kit, and a first polish pass on sheets and toasts. Details in §4.

### Phase 2. The world map and HUD (next; after the other agent's landscape/HUD work merges)
- One HUD built from the kit: forged top bar, numbers in Inter tabular figures, icons not words. Fold Backup, Save, Walk and music into ☰.
- Map labels on a collision pass (lords offset from towns); Realm names as engraved cartography, not paint over towns.
- The "Next deed" ribbon becomes a quest tracker card in one corner.
- Bottom bar: icon tabs with the active tab lit in ember.
- Grammar pass on generated text (plural nouns).
- **Carry the chosen Realm into play:** the hero's 3D look uses the Realm palette from `premium/canon.js` (currently the banner colour), and the Party sheet shows the crest. This touches `g3d/scene3d.js` `heroLook()`, which the other agent is editing, so it waits for their merge.

### Phase 3. 3D scenes: camera, feel and readability
- Camera collision for town walks; a cleaner phone control layout (no keyboard text on touch, one context button).
- Battle feel: hit-stop (40–60 ms), small camera shake on heavy blows, layered impact sounds, arrow trails, dust on charges, banner cloth.
- Siege set dressing: fire on the walls, smoke columns, defenders lit by braziers so they read.
- Replace cone trees with three or four stylised tree kits; ground gets height and colour variation per Realm.
- Tutorial captions move to a dedicated lower-third component, never centre screen.

### Phase 4. Sheets and menus
- Every sheet re-laid on the kit: a forged header band with the place's painted art, sections as engraved rules, rows as panels, rules text moved into tooltips.
- Skills tree icons redrawn to match the painted item icons.
- A proper inventory paper-doll for the hero.

### Phase 5. The ending and the story beats
- The Edict, the coup and the finale each get a short title-card cinematic built on the Phase 1 intro engine (`premium/frontdoor.js` cards), with Realm-specific lines and a music sting.
- The ending closes on a full-screen card: **"The Thousand-Year War begins."**, then credits rolling over the map.

### Phase 6. Audio
- Replace the synthesised UI cues with a small sampled set (forged metal, ember crackle, void shimmer), a title theme with a proper intro, and per-Realm ambience beds for 3D scenes. Keep the total under ~3 MB with Opus/AAC.

---

## 3. Art direction bible

**The idea in one sentence:** *forged metal, ember light and void cracks; old-world gold on soot-black, with each Realm's own colours carried like a banner.* The UI is something made by hand in Hearthmount's forges, and the Void is the only thing that cracks it.

### 3.1 Palette

**Core UI** (all in `premium/premium.css` as `--fd-*` tokens):

| Token | Hex | Use |
|---|---|---|
| Iron 0–4 | `#070605` `#110e0b` `#1b1611` `#2a221a` `#3a3024` | Backgrounds, panels, wells |
| Gold / highlight / mid / low | `#e8c77e` `#fff0c8` `#b98a40` `#6e4c1e` | Frames, headings, primary buttons |
| Ember / deep | `#ff7a1a` `#c7501d` | Focus, progress, the gem in ornaments, toasts |
| Void / deep | `#8e5cff` `#5b3bb0` | The crack motif, magic prices, Void danger only |
| Ink 1–3 | `#f4e8cc` `#cdbd98` `#8f8166` | Body text, secondary, captions |

Rule: **gold means "you can act", ember means "now", violet means "the Void or a price".** Never use violet for decoration.

**Per Realm** (from the Visual Kit CP-1 palettes and the Realm Identities crests, both approved 1 Nov). `a` is the Realm accent, `glow` is light only (rim lights, embers, focus):

| Realm | Accent | Second | Third | Glow | Crest |
|---|---|---|---|---|---|
| Flameborne | Madder-red `#9E2B25` | Forge charcoal `#2B2523` | Copper `#B87333` | Ember `#FF7A1A` | A black coal ringed in flame on madder-red |
| Lightforge | Office gold `#C9A13B` | Linen `#F4EFE3` | Noon sand `#CDB78E` | Noon-white `#FFF4D6` | A gold sun-disc with a single open eye on white |
| Shadowdeep | Hidden violet `#4B2A6B` | Charcoal `#2E2F33` | Slate `#4A4E57` | Knife violet `#8E5CFF` | The Cuff: charcoal with one violet stitch |
| Stormreach | Slate-blue `#4F6A8A` | Storm-cloak `#1F2E4A` | Oatmeal `#D8CDB5` | Bolt white `#E8F3FF` | A white bolt splitting a slate-blue roundel, knotted cord |
| Frostgrave | Ice-blue `#A9C9DB` | Longhouse black `#16181B` | Snow `#F1F3F2` | `#DDF4FF` | A white knotted cord ringing a pale enamel disc |
| Stonehold | Ochre `#B07A2E` | Granite `#6E6E6A` | Deep slate `#2F4256` | Gravem blue `#9FD3F0` | A brass mile-marker, your initials beneath |
| Spiritveil | Mist-green `#B9C8BC` | Veil grey `#C9CCCB` | Bone `#E6E0D2` | Silver flame `#E8F0FF` | A lantern over black water |
| Metalcrown | Rust-red `#8E3B2A` | Soot-black `#1B1B1C` | Brass `#B08D57` | Reactor ember `#FF6A13` | A crown of iron teeth with one ember glint |

### 3.2 Typography (self-hosted under `fonts/`, SIL OFL 1.1, licences in `fonts/licenses/`)
- **Display: Cinzel** 600 / 900. Titles, buttons, labels in spaced caps (letter-spacing .14–.5em). The wordmark is Cinzel 900.
- **Prose: Cormorant Garamond** 400 / 500, roman and italic. Narration, blurbs, one-line identities, quotes. This is the book's voice on screen.
- **UI: Inter** 400–700. Numbers (tabular), facts, kit chips, settings, toasts. Replaces IBM Plex Mono for anything a player reads.
- Kept: IM Fell English (old sheets) and IBM Plex Mono (debug and code only). Phase 4 retires both from player-facing text.
- Scale (phone): 0.56 rem caps labels · 0.86 rem UI body · 1.05 rem prose · 1.3 rem one-liners · 1.85 rem screen titles · logo fills the column.

### 3.3 Ornament and frame language
- **Forged frame:** a 1 px border drawn as a gradient (pale gold, dark bronze, soot, gold again), over an iron gradient fill with an inset top highlight and a deep inner shadow. Corners get **rivets** (5 px radial gold). Used for panels, buttons, inputs, sheets.
- **Ember gem rule:** the section divider. Two hairlines fading inwards to a rotated 7 px ember gem. Used under modal titles and on the sheet grip.
- **Void crack:** a jagged white-violet line with a soft violet glow. Used *only* where the Void is: the logo's split between the D and the H, the sky over the title, the price-of-magic card, grey-edge choices.
- **The sigil:** the nine-scored ring with the ninth score missing (the Unstable Shard), split by a void crack. Boot, title, intro. It echoes the canon loaf compass rose "with the ninth score missing".
- **Crests:** heater shields with a gold forged rim, drawn in code from the canon crest descriptions, so they scale and recolour.
- **Grain:** a 7% overlay film grain on full-screen moments.

### 3.4 Motion rules
- **Easing:** `--fd-ease-out` `cubic-bezier(.16,1,.3,1)` for everything that arrives; `--fd-ease-io` `cubic-bezier(.65,0,.35,1)` for wipes and camera moves; never linear except loops.
- **Durations:** 120 ms press · 220 ms hover and state · 420 ms panels, sheets, modals · 800 ms screen reveals · 1.6 s cinematic beats. Stagger lists by 150 ms.
- **Screen transitions:** the **ember wipe**: a black iris opening from where you tapped (520 ms in), a glowing ember ring riding its edge, the next screen swapped underneath, then a fade out (520 ms). Title to creator, creator to opening, opening to play, Continue.
- **Arrivals:** the logo "forges in": scale .94 to 1, blur 6 px to 0, brightness 2 to 1, over 2.2 s. Words of narration fade and un-blur one by one (55 ms apart).
- **Idle life:** slow camera drift on the title art (70 s), embers in three depth layers, a light sweep across the wordmark every 7 s, the sky crack flickering.
- **Reduced motion:** the system setting and the in-game "Reduce motion" switch both stop drift, grain, sweeps and wipes, and show narration at once.

### 3.5 UI sound cues (synthesised now in `premium/frontdoor.js`; sampled in Phase 6)

| Cue | When | Character |
|---|---|---|
| `tick` | Hover or focus (mouse), toggles, swatches | Tiny bright metal tick, 30 ms |
| `press` | Any confirm | Struck small bell (1.18 kHz and a fifth) over a soft low thump |
| `back` | Back, close, cancel | The same bell, lower and shorter |
| `select` | Choosing a Realm or Road | A pitched chime that rises through the eight Realms, with an ember hiss |
| `whoosh` | The ember wipe | Filtered air sweeping up |
| `boom` | Tap to begin; title cards | A deep low boom with a high shimmer tail |
| `forge` | Begin your story; the end of the opening | The anvil: three harmonic partials and a spark burst |
| `card` | Each narration card | A low breath of air and a quiet drone |

Sounds unlock on the first touch (iOS needs a gesture). The title's tap also starts the game's music.

### 3.6 UI component kit (`premium/premium.css`)
- **Button** `.fd-btn`: forged frame, iron fill, Cinzel caps. Hover runs a glint across the metal and lifts an ember underglow; press sinks 1 px. Variants: `--primary` (forged gold, dark text), `--ghost`, `--icon` (round).
- **Panel** `.fd-panel`: forged frame with rivets and a deep inner shadow.
- **Tab** `.fd-tabs` / `.fd-tab`: an iron well; the selected tab is a gold plate.
- **Tooltip** `.fd-tip[data-tip]`: a small black plate with a gold hairline, rising 4 px in 220 ms.
- **Toast** `.fd-toast` (and the game's `.toast` / `#atoast`, restyled): an ember bar on the left, dropping in from the top.
- **Modal** `.fd-modal-scrim` + `.fd-modal`: a blurred scrim, a forged panel, a title with the ember gem rule, switches (`.fd-switch`) and stacked actions.

---

## 4. Phase 1: what shipped

All new files, wired into `index.html` with two marked edits (three lines in `<head>`, one bridge block above `showTitle()` at the end of the game script). Deleting `premium/` makes the bridge do nothing, and the old title, creator and intro run unchanged.

| File | What |
|---|---|
| `premium/canon.js` | The canon data: eight Realms (people, art, motto, one-line identity, blurb, price, gift, start hint, palette, 3D look, name pool, opening lines), eight Roads mapped onto the game's existing upbringing kits, the opening narration, and the old-save migration |
| `premium/frontdoor.js` | Boot splash, title, creator, opening cinematic, ember wipe, UI sounds, settings and credits modals, game hooks |
| `premium/preview3d.js` | The 3D preview: the game's own Quaternius body on a forged plinth, Realm-tinted, turning slowly, drag to spin, embers, painted contact shadow, paused when hidden |
| `premium/premium.css` | Tokens, component kit, front-door layout for 390x844 and 844x390, and the global polish of sheets and toasts |
| `fonts/` | Cinzel 600/900, Cormorant Garamond, Inter, plus OFL licences for every font in the folder |
| `tests/smoke-frontdoor.js` | Title, settings, credits, every Realm and Road, the opening, play, old-save migration, first map |

### The canon character choice
The canon question was "who is the player?" The spec never names the player; it sets the game in **the Concord's last season, just before Squad 0** (J-10), starting in **Ashford on the Flameborne shard**. The game already tells you that a Lantern archivist writes your name in her book there. So creation asks the two questions every person in this world can answer:

1. **Your people:** one of the eight peopled Realms. Not Emberhold (it does not exist until ~400 YB1) and not the Unstable Shard (no native people). Fan names, crests and colours from the approved Realm Identities and Visual Kit; arts, prices and governments from Lore Bible v2 and the spec patch (Radiance costs **Clarity**; Chrona costs **emotional numbness**; Tempest ages about a year a charge; Metalcrown has no Spark and pays with its humanity).
2. **Your road:** what brought you to Ashford. Eight canon-safe backgrounds (Concord levy, Bridge trader, journeyman smith, lamp-house reader, hired hand, outlaw, exiled retainer, grey-edge survivor). Each maps onto one of the game's existing upbringing triples, so **every starting number is one the game already used**. Each Realm adds one small gift built from existing kit fields.
3. **Your name:** name (with Realm-appropriate suggestions from the canon naming guide, held names excluded), banner name and colour (the game's own eight colours), difficulty.

### Rules kept
- Save key `voidhammer-campaign-v3`, options key `voidhammer-opts-v1`, quest ids and balance numbers unchanged. New option fields: `people`, `road`, `fdv`, and `fdMig` on migrated saves. `origin` stays `"wanderer"` and `upb` stays the triple the game reads.
- **Old saves:** old `origin` keys (farmer, trader, mercenary, outlaw, smith, noble, voidtouched) and old upbringing triples map onto Roads; the Realm is inferred (Spiritveil for archive or Lantern-house upbringings, otherwise Flameborne, since the game opens in Flameborne country). Display only: no kit changes on a loaded save.
- **Bug fixed on the way:** starting a new game while a save existed used the *old* save's upbringing for the new kit (`upbSel()` read `S.opt.upb` before `S` was replaced). The bridge now feeds the new choice through.
- No gods, nothing sealed, no Voyager name or titles, Australian spelling (the smoke test greps the front-door text for all of these).

### Known limits of Phase 1
- The 3D preview uses the same armoured body for every Realm (the game's hero is always that body); variety comes from Realm colours and kit. In play, the hero still wears the banner colour until Phase 2 changes `heroLook()`.
- UI sounds are synthesised; they are tasteful placeholders, not a sampled set.
- Measured only on software WebGL. John: please open the creator on the iPhone and tell us how the preview turns.
