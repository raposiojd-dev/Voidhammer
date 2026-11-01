---
name: playtest-report
description: "Structured playtest report template, or turn existing playtest notes into structured feedback."
argument-hint: "[new|analyze path-to-notes] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Agent, AskUserQuestion, Bash(bash "*/.claude/skills/playtest-report/../../hooks/yaml-helper.sh" resolve_config *)
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


!`bash "${CLAUDE_SKILL_DIR}/../../hooks/yaml-helper.sh" resolve_config --keys review_mode,automation`

Resolved above — use as-is; `--review` overrides `review_mode` for this run. No
block → defaults in `.claude/docs/config-resolution.md`.

# Playtest Report



## Phase 1: Parse Arguments


See `.claude/docs/director-gates.md` for the full check pattern. Individual gate definitions live in `.claude/docs/director-gates/[gate-id].md` — the spawned agent reads its own gate file; do not read it in the parent session.


Every `AskUserQuestion` call follows `.claude/docs/automation-modes.md`
(collaborative asks always · guided major-only · autonomous logs and proceeds;
`automation_always_ask` categories always prompt).

Determine the mode:

- `new` → generate a blank playtest report template. This mode ends after
  Phase 2A: a blank template has nothing to route, review or save.
- `analyze [path]` → read raw notes and fill in the template with structured findings
- No argument → ask via `AskUserQuestion`: `[A] New blank template` /
  `[B] Analyze notes — I'll give you the path`

---

## Phase 2A: New Template Mode

Generate this template and output it to the user:

```markdown
# Playtest Report

## Session Info
- **Date**: [Date]
- **Build**: [Version/Commit]
- **Duration**: [Time played]
- **Tester**: [Name/ID]
- **Platform**: [PC/Console/Mobile]
- **Input Method**: [KB+M / Gamepad / Touch]
- **Session Type**: [First time / Returning / Targeted test]

## Test Focus
[What specific features or flows were being tested]

## First Impressions (First 5 minutes)
- **Understood the goal?** [Yes/No/Partially]
- **Understood the controls?** [Yes/No/Partially]
- **Emotional response**: [Engaged/Confused/Bored/Frustrated/Excited]
- **Notes**: [Observations]

## Gameplay Flow
### What worked well
- [Observation 1]

### Pain points
- [Issue 1 -- Severity: High/Medium/Low]

### Confusion points
- [Where the player was confused and why]

### Moments of delight
- [What surprised or pleased the player]

## Bugs Encountered
| # | Description | Severity | Reproducible |
|---|-------------|----------|-------------|

## Feature-Specific Feedback
### [Feature 1]
- **Understood purpose?** [Yes/No]
- **Found engaging?** [Yes/No]
- **Suggestions**: [Tester suggestions]

## Quantitative Data (if available)
- **Deaths**: [Count and locations]
- **Time per area**: [Breakdown]
- **Items used**: [What and when]
- **Features discovered vs missed**: [List]

## Overall Assessment
- **Would play again?** [Yes/No/Maybe]
- **Difficulty**: [Too Easy / Just Right / Too Hard]
- **Pacing**: [Too Slow / Good / Too Fast]
- **Session length preference**: [Shorter / Good / Longer]

## Top 3 Priorities from this session
1. [Most important finding]
2. [Second priority]
3. [Third priority]
```

In `new` mode, stop here with: Verdict: **COMPLETE** — blank template output; nothing saved.

---

## Phase 2B: Analyze Mode

Read the raw notes at the provided path. Cross-reference with existing design documents, reading each by section: find the headings you need with the Grep tool (pattern `^#`, content mode) and Read those ranges with offset and limit. Fill in the template above with structured findings. Flag any playtest observations that conflict with design intent.

An observation that describes a defect — a crash, a framerate drop, a softlock,
something that plainly breaks rather than plays badly — goes in the **Bugs
Encountered** table, not under Gameplay Flow → Pain points, and is routed as a
bug in Phase 3. Pain points are for how the game feels to play.

---

## Phase 3: Action Routing

Categorize all findings into four buckets:

- **Design changes needed** — fun issues, player confusion, broken mechanics, observations that conflict with the GDD's intended experience
- **Balance adjustments** — numbers feel wrong, difficulty too spiked or too flat
- **Bug reports** — clear implementation defects that are reproducible
- **Polish items** — not blocking progress, but friction or feel issues for later

Present the categorized list, then route:

- **Design changes:** "Run `/propagate-design-change [path]` on the affected design document to find downstream impacts before making changes."
- **Balance adjustments:** "Run `/balance-check [system]` to verify the full balance picture before tuning values."
- **Bugs:** "Use `/bug-report` to formally track these."
- **Polish items:** "Add to the polish backlog in `production/` when the team reaches that phase."

---

## Phase 3b: Creative Director Player Experience Review

**Review mode check** — apply before spawning CD-PLAYTEST:
- `solo` → skip. Note: "CD-PLAYTEST skipped — Solo mode." Proceed to Phase 4 (save the report).
- `lean` → skip (not a PHASE-GATE). Note: "CD-PLAYTEST skipped — Lean mode." Proceed to Phase 4 (save the report).
- `full` → spawn as normal.

After categorising findings, spawn `creative-director` via `Agent` using gate **CD-PLAYTEST** (`.claude/docs/director-gates/cd-playtest.md`).

Pass: the structured report content, game pillars and core fantasy (from
`design/gdd/game-concept.md`), the specific hypothesis being tested. **If
`game-concept.md` does not exist** — expected at `minimal`, where
`design/game-brief.md` replaces it — the brief has no pillars: pass its
one-sentence pitch and its "Who it's for / what they feel" line instead, and say
they stand in for pillars. If neither document exists, say so in the prompt:
*"No pillars available — assess against the hypothesis alone."* A director gate
handed silence about pillars will invent them.

Present the creative director's assessment before saving the report. If CONCERNS or REJECT, add a `## Creative Director Assessment` section to the report capturing the verdict and feedback. If APPROVE, note the approval in the report. If NOT ASSESSED (the director lacked an input — `.claude/docs/director-gates.md`), add the same section naming what was missing; it is not an approval.

---

## Phase 4: Save Report

Ask: "May I write this playtest report to `production/qa/playtests/playtest-[date]-[tester].md`?"

If yes, write the file, creating the directory if needed.

---

## Phase 5: Next Steps

Verdict: **COMPLETE** — playtest report generated.

- Act on the highest-priority finding category first.
- After addressing design changes: re-run `/design-review` on the updated GDD.
- After fixing bugs: re-run `/bug-triage` to update priorities.
