# Attribution

The agents in `.claude/agents/`, the skills in `.claude/skills/` and the hook `.claude/hooks/validate-push.sh` are adapted from **Claude Code Game Studios** by Donchitos:
- Source: https://github.com/Donchitos/claude-code-game-studios (commit `05ad7c8a5b8aa2aa86bbd3439ae7cf7295cac418`, 19 Oct 2026)
- Licence: MIT, Copyright (c) 2026 Donchitos. The full text is in [`LICENSE-claude-code-game-studios.txt`](LICENSE-claude-code-game-studios.txt) and must stay with these files.

## What we took
- **Agents (10):** unreal-specialist, ue-blueprint-specialist, ue-gas-specialist, ue-umg-specialist, qa-lead, performance-analyst, systems-designer, game-designer, technical-director, prototyper
- **Skills (9):** code-review, balance-check, perf-profile, playtest-report, sprint-plan, vertical-slice, smoke-check (with its `references/`), design-review, scope-check
- **Hook (1):** validate-push.sh

## What we changed
1. Every agent and skill has a **Voidhammer rules header** after its front matter: Canon Log wins, no gods, Australian spelling, the sealed list, never naming the Voyager, no gambling or loot boxes, and the UE 5.8 code and test roots.
2. **game-designer:** the "pity systems for probabilistic rewards" and "transparent odds" guidance was replaced with a flat ban on paid random rewards.
3. **validate-push.sh:** pushes to `main` / `master` / `release/*` are **blocked** (exit 2) instead of warned.

## What we left out, and why
- **The rest of the hooks.** Each was reviewed before choosing.
  - `update-check.sh` makes network calls to the GitHub API on session start.
  - `session-start.sh`, `detect-gaps.sh`, `log-agent*.sh`, `pre-compact.sh` and `session-stop.sh` depend on the 2,152-line `yaml-helper.sh` and `project.yaml` framework, which isn't included. They also write session logs.
  - `validate-commit.sh` (826 lines) depends on the framework's commit policies and helper scripts.
  - The `validate-*` read/write/registry/asset hooks enforce the framework's own directory layout.
  - `notify.sh` sends desktop notifications.
  
  None was unsafe in an obvious way, but none works without the framework, and a half-working gate is worse than none.
- **`project.yaml`, `.claude/scripts/`, `.claude/docs/`, `.claude/rules/`:** the framework's configuration layer. Skills that call `resolve_config` or helper scripts will say NOT ASSESSED for that step (rules header, item 8).
- **Godot and Unity agents**, plus the other 39 agents and 65 skills: not needed for the slice. Add more from the source repo if needed, keeping this file and the licence up to date.
