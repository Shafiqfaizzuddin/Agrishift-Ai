# Host AgriShift AI on Vercel

This guide uses one Vercel project for the React frontend and FastAPI backend. The repository-root `vercel.json` uses Vercel Services: `/api/*` routes to FastAPI and other paths route to the Vite app. Vercel currently lists Services as a beta feature available on all plans. Check the dashboard for current plan limits before inviting public traffic.

## 1. Confirm the branch

The latest Kedah context work is on `20261113_update`, with a draft pull request to `main`. Keep that branch separate from `main` until review. The default Git production branch is `main` and does not yet contain this Vercel configuration. A first CLI deployment from the feature branch will nevertheless be assigned to Vercel's Production environment.

## 2. Project setup completed

The Vercel GitHub app was installed with access limited to `Shafiqfaizzuddin/Agrishift-Ai`. The project `shafiq10/agrishift-ai` was created and linked locally through Vercel CLI, with **Root Directory `.`** and **Framework Preset Services**. Automatic Git deployment was left disconnected because `main` lacks the root configuration. The latest source is on `20261113_update` and has been pushed.

Vercel's dry-run manifest detected Services and excluded the local `.env.local` token, virtual environments, tests, documentation, caches, and `frontend/dist`. Leave `VITE_API_BASE_URL` unset in Vercel. No NASA API key is required.

## 3. First deployment completed

The CLI rejected the attempted Preview deployment because Vercel assigns a new project's **first deployment to Production**. After explicit user approval, `npx --yes vercel@latest deploy --prod --yes --logs` deployed the checked-out feature-branch source. The deployment is **Ready** at [agrishift-ai.vercel.app](https://agrishift-ai.vercel.app), Vercel deployment ID `dpl_8F6XKFDnF7a91J9VyV5FnnUim8VW`. This did not merge the Git branch. The build used Python 3.14 and completed both Vite and FastAPI services.

Subsequent feature-branch deployments can target Preview with `npx --yes vercel@latest deploy --environment preview --yes --logs`. The current Production URL will not update on a Git push because automatic Git deployment is disconnected.

The CLI's `vercel dev --local` detected both services but could not complete on this Windows computer because its cache could not create symlinks (`EPERM`). The Vercel cloud build succeeded. Local emulator support on this Windows setup remains unverified.

## 4. Verify the live deployment

The following were checked against the public Production URL on 2026-11-15 (Malaysia):

1. `/` and `/farm` returned HTTP 200 without credentials. The homepage showed five cited Kedah crop cards; farm setup showed the hypothetical paddy profile with soil and irrigation unknown.
2. `/api/health` returned `status: ok`. `/api/crops` returned three exploratory crops and five `context_only` Kedah crops.
3. A live `/api/climate` request for 6.12°N, 100.36°E, 2015–2024 returned NASA POWER provenance, 120 monthly records, 10 usable years, and source units. The browser climate page showed the source, period, charts, and historical-data limitation.
4. A paddy evaluation returned HTTP 422 with `CROP_CONTEXT_ONLY`; the browser paddy evidence view offered no seasonal score action.
5. The separate exploratory evaluation returned two scenarios with `insufficient_evidence`, not unsupported scores.

Recheck these paths after every deployment. A direct refresh of every non-root SPA route, mobile layout, error state, and a sustained traffic test were not completed in this deployment pass. The CLI's authenticated `vercel curl` check created an automation bypass secret; it was revoked immediately after the public URL was verified without credentials.

The NASA POWER request may be slow on a cold function instance. The app uses a per-instance in-memory cache, so requests on another instance or after a restart can fetch NASA again. This prototype has no user authentication or application-level request throttling; review traffic and function usage before sharing the URL broadly.

## 5. Automatic Git deployment later

After scientific and team review, merge through the normal pull-request workflow. Once `main` contains the root configuration, connect the Vercel project to the Git repository if automatic deployments are wanted. Verify the production URL and all checks again. This guide does not authorize merging or changing the production branch.

Sources: [Vercel Services](https://vercel.com/docs/services), [FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi), [deploying Git repositories](https://vercel.com/docs/git).
