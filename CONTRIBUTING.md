# Team contribution workflow

This is a four-person student project. During preparation, changes are limited to planning documents and GitHub collaboration setup. The event build sequence is in [the backlog](docs/03-issues-and-build-sequence.md).

## Issue and branch flow

1. Pick a GitHub Issue and assign one owner. Add a second teammate as reviewer when the PR is ready.
2. Use short branches such as `docs/issue-01-pilot-scope` or `feat/issue-04-power-adapter` after implementation begins. Keep `main` reviewable.
3. Link the Issue in the PR description. State what changed, how it was checked, and any scientific/data-source decisions.
4. Ask a second teammate to review before merging. A code reviewer does not substitute for scientific review of crop rules.
5. Resolve review comments and keep docs, API examples, and implementation in sync.

## Scientific evidence rule

Any agronomic threshold or claimed benefit needs a source, units, time basis, geography, and a recorded reviewer decision. If evidence is missing or incompatible, label the rule `unknown` and explain why. Historical NASA POWER context must not be described as a forecast, local soil test, or proof that a rotation works.

## Suggested labels

`P0`, `P1`, `P2`; `frontend`, `backend`, `data`, `science`, `integration`, `documentation`; `blocked-review`. Milestones may be `Preparation`, `48-hour MVP`, and `Post-MVP` when the team is ready to manage them in GitHub.
