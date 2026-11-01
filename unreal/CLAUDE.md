# Voidhammer: The Shattered Realms (Unreal Engine 5.8)

John Raposio is the creator and has final say on canon. This folder is the UE 5.8 vertical slice. The browser game at the repo root was the prototype.

## Read first
- `design/VERTICAL_SLICE_GDD_v1.md`: the slice design, numbers, milestones, tech plan
- `../docs/GAME_CANON_SPEC.md` and the World Book patch to it: canon for the game. **The newest CANON LOG entry wins.**

## Rules (all work, every agent)
1. Canon order: CANON LOG > GAME_CANON_SPEC (+ patch) > the GDD. Ask John when unclear.
2. **No gods** in any in-world text (no god/gods/godlike, prayer, temple, priest).
3. **Australian spelling.**
4. **Sealed.** The facts are in the private Canon Log and are **never written in this public repo or in game text**. Never state or hint: (a) who or what "the Unwritten" is, beyond what Ch2 shows; (b) who taught Kaelren to bake; (c) who the Harrowed King is; (d) Dalen's fate; (e) Elyon's future before the coup act; (f) the Voyager's titles, origin, fate or name. In game text he is only "the Voyager" or "the Hammer-Bearer". If unsure whether something touches this list, stop and ask John. **Never invent a name for the Voyager.**
5. **No gambling mechanics or loot boxes.**
6. Kaelren can't die. No Kaelren–Voyager scenes. Grey edges, not rifts; no Voidborn.
7. Mark new names **[PROPOSED]** until John approves them.

## Tech
- UE 5.8, C++ (module `VoidhammerSR`) + Blueprints. GAS for abilities and costs. Enhanced Input. Single-player, no replication.
- **Every gameplay number goes in a data table or an `EditAnywhere` property**, with defaults matching the GDD. Pure formulas go in `FVHBattleMath`, and each gets an automation test in `Source/VoidhammerSR/Private/Tests/`.
- **Low-spec mode is the default** (John's PC: Windows, modest GPU). Don't turn on Lumen, VSM or Nanite content in shared config without asking.
- Never hand-edit `.uasset` / `.umap`. Never commit `Binaries/`, `Intermediate/`, `Saved/`, `DerivedDataCache/`.
- Git: work on `unreal/...` branches. **Never push to `main`** (the hook blocks it). Commit messages: Conventional Commits.

## Studio
Adapted agents and skills are in `.claude/` (from Claude Code Game Studios, MIT; see `.claude/ATTRIBUTION.md`). Useful ones: `unreal-specialist`, `ue-gas-specialist`, `ue-blueprint-specialist`, `ue-umg-specialist`, `systems-designer`, `/balance-check`, `/scope-check`, `/sprint-plan`, `/code-review`, `/smoke-check`, `/perf-profile`, `/playtest-report`, `/vertical-slice`, `/design-review`.
