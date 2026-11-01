---
name: smoke-check
description: "Critical-path smoke gate before QA hand-off — runs the automated suite. A failed check means the build is not QA-ready."
argument-hint: "[sprint | quick | --platform pc|console|mobile|all]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(bash "*/.claude/skills/smoke-check/../../hooks/yaml-helper.sh" resolve_config *), Bash(bash .claude/scripts/project-coherence.sh*), Bash(command -v *), Bash(uname -s), Bash(godot --headless --path . --import), Bash(timeout 900 godot --headless *), Bash(timeout 1800 godot --headless *), Bash(grep -q 'com.unity.test-framework' Packages/manifest.json), Bash(echo present), Bash(echo ABSENT)
model: sonnet
---

## VOIDHAMMER RULES (read first; these override anything below)
*Adapted for Voidhammer: The Shattered Realms (UE 5.8) from Claude Code Game Studios (MIT, see `.claude/ATTRIBUTION.md`).*
1. **Canon:** the newest CANON LOG entry wins, then `docs/GAME_CANON_SPEC.md` and its World Book patch, then `unreal/design/VERTICAL_SLICE_GDD_v1.md`. If unclear, ask John; he has final say on canon. Books decide canon; the game adapts.
2. **No gods.** Never "god", "gods", "godlike" in any player-facing text, name, item, VO or tooltip. Prayer → rite or oath; temple → hall or lamp-house; priest → keeper or reader. ("Church of the First Light" is the one allowed name.)
3. **Australian spelling:** colour, armour, honour, centre, defence, towards, realise, travelled.
4. **Sealed.** The facts are in the private Canon Log and are **never written in this public repo or in game text**. Never state or hint: (a) who or what "the Unwritten" is, beyond what Ch2 shows; (b) who taught Kaelren to bake; (c) who the Harrowed King is; (d) Dalen's fate; (e) Elyon's future before the coup act; (f) the Voyager's titles, origin, fate or name. In game text he is only "the Voyager" or "the Hammer-Bearer". If unsure whether something touches this list, stop and ask John.
5. **Never invent a name for the Voyager.**
6. **No gambling-style mechanics or loot boxes:** no paid random rewards, gacha, pity timers or odds-based purchases.
7. Kaelren can't die (wounded or carried from the field). No Kaelren–Voyager scenes. Grey edges, not rifts; no Voidborn in this era.
8. **Engine:** Unreal Engine 5.8, C++ plus Blueprints, GAS, Enhanced Input. Code root `unreal/Source/VoidhammerSR/`; tests in `unreal/Source/VoidhammerSR/Private/Tests/`. This repo has **no `project.yaml` or `.claude/scripts/` helpers**. Where text below says to resolve config or run a helper, use these rules and the GDD instead, and **say in your output that the helper step was NOT ASSESSED**.

---


!`bash "${CLAUDE_SKILL_DIR}/../../hooks/yaml-helper.sh" resolve_config --keys automation,workflow,qa.level,testing.strict`

# Smoke Check

This skill is the gate between "implementation done" and "ready for QA
hand-off". It runs the automated test suite, checks for test coverage gaps,
batch-verifies critical paths with the developer, and produces a PASS/FAIL
report.

The rule is simple: **a build that fails smoke check does not go to QA.**
Handing a broken build to QA wastes their time and demoralises the team.

**Output:** `production/qa/smoke-[date].md`

---

Every `AskUserQuestion` call follows `.claude/docs/automation-modes.md`
(collaborative asks always · guided major-only · autonomous logs and proceeds;
`automation_always_ask` categories always prompt).

**`qa.level`**: at `minimal`, smoke-check is **optional** — if
run, a FAIL is advisory and never blocks hand-off, and a project with no game
tests is checked by its build, launch and critical paths alone (Phase 1 step 1); at `standard`, it is required
before a phase transition; at `full`, before every commit. This sits in front of
the Phase 6 `testing.strict.config` resolution (which only matters once a smoke run
gates). Distinct axis from `workflow`.

## Parse Arguments

Arguments can be combined: `/smoke-check sprint --platform console`

**Base mode** (first argument, default: `sprint`):
- `sprint` — full smoke check against the current sprint's stories
- `quick` — skip coverage scan (Phase 3) and Batch 3; use for rapid re-checks

**Platform flag** (`--platform`, default: none):
- `--platform pc` — add PC-specific checks (keyboard, mouse, windowed mode)
- `--platform console` — add console-specific checks (gamepad, TV safe zones,
  platform certification requirements)
- `--platform mobile` — add mobile-specific checks (touch, portrait/landscape,
  battery/thermal behaviour)
- `--platform all` — add all platform variants; output per-platform verdict table

If `--platform` is provided, Phase 4 adds platform-specific batches and
Phase 5 outputs a per-platform verdict table in addition to the overall verdict.

---

## Phase 1: Detect Test Setup

**Read `references/1-detect-setup.md` now and follow it** — this phase's steps are in that file, not here. Read it again if the conversation was compacted or resumed during this phase.

## Phase 2: Run Automated Tests

**Read `references/2-run-tests.md` now and follow it** — this phase's steps are in that file, not here. Read it again if the conversation was compacted or resumed during this phase.

## Phase 3: Check Test Coverage

**Read `references/3-coverage.md` now and follow it** — this phase's steps are in that file, not here. Read it again if the conversation was compacted or resumed during this phase.

## Phase 4: Run Manual Smoke Checks

**Read `references/4-manual-checks.md` now and follow it** — this phase's steps are in that file, not here. Read it again if the conversation was compacted or resumed during this phase.

## Phase 5: Generate Report

**Read `references/5-report.md` now and follow it** — this phase's steps are in that file, not here. Read it again if the conversation was compacted or resumed during this phase.

## Phase 6: Write and Gate

**Read `references/6-write-gate.md` now and follow it** — this phase's steps are in that file, not here. Read it again if the conversation was compacted or resumed during this phase.

## Collaborative Protocol

**Applies in `collaborative` mode (the default).** For `guided` and
`autonomous` modes, see `.claude/docs/automation-modes.md` — the rules below
describe what collaborative mode requires, not universal behavior.

- **Never treat NOT RUN as automatic FAIL** — record it as NOT RUN and let
  the developer confirm status manually. Unconfirmed NOT RUN yields **NOT
  ASSESSED**, not FAIL — and not a pass verdict either.
- **Never auto-fix failures** — report them and state what must be resolved.
  Do not attempt to edit source code or test files.
- **PASS WITH WARNINGS does not block QA hand-off** — it records advisory
  gaps for `/story-done` to follow up on.
- **`quick` argument** skips Phase 3 (coverage scan) and Phase 4 Batch 3.
  Use it for rapid re-checks after fixing a specific failure.
- Use `AskUserQuestion` for all manual smoke check verification.
- **Never write the report without asking** — Phase 6 requires explicit
  approval before any file is created.
