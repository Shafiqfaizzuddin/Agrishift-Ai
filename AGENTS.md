# AgriShift AI coding rules

- Work on feature branches; never commit to `main` or force push.
- Preserve provenance. NASA POWER values are historical gridded context, not field measurements or forecasts.
- Every crop threshold needs a URL, units, and temporal basis. Unknown inputs stay unknown.
- Keep hard constraints separate from soft screening scores. Never describe a score as a success probability.
- Run focused tests, type checks, lint, and production build before a PR. Keep `docs/BUILD_STATUS.md` factual.
- Never commit tokens, `.env`, virtual environments, caches, or build artifacts.
