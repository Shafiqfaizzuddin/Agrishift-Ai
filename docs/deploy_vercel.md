# Host AgriShift AI on Vercel

This guide uses one Vercel project for the React frontend and FastAPI backend. The repository-root `vercel.json` uses Vercel Services: `/api/*` routes to FastAPI and other paths route to the Vite app. Vercel currently lists Services as a beta feature available on all plans. Check the dashboard for current plan limits before inviting public traffic.

## 1. Confirm the branch

The latest Kedah context work is on `20261113_update`, with a draft pull request to `main`. Keep that branch separate from `main` until review. The default Git production branch is `main` and does not yet contain this Vercel configuration. A first CLI deployment from the feature branch will nevertheless be assigned to Vercel's Production environment.

## 2. Project setup completed

The Vercel GitHub app was installed with access limited to `Shafiqfaizzuddin/Agrishift-Ai`. The project `shafiq10/agrishift-ai` was created and linked locally through Vercel CLI, with **Root Directory `.`** and **Framework Preset Services**. Automatic Git deployment was left disconnected because `main` lacks the root configuration. The latest source is on `20261113_update` and has been pushed.

Vercel's dry-run manifest detected Services and excluded the local `.env.local` token, virtual environments, tests, documentation, caches, and `frontend/dist`. Leave `VITE_API_BASE_URL` unset in Vercel. No NASA API key is required.

## 3. First deployment requires Production approval

The CLI rejected the attempted Preview deployment because Vercel assigns a new project's **first deployment to Production**. This creates a publicly accessible URL, so the first deployment must wait for explicit user approval. Automatic approval review rejected the Production command before it ran. No deployment URL exists yet.

After approval, from the repository root on branch `20261113_update`, run `npx --yes vercel@latest deploy --prod --yes --logs`. This uploads the checked-out feature-branch source to the Vercel project; it does not merge the Git branch. Verify the deployment finishes **Ready**. Once a first Production deployment exists, subsequent feature-branch deployments can target Preview with `npx --yes vercel@latest deploy --environment preview --yes --logs`.

The CLI's `vercel dev --local` detected both services but could not complete on this Windows computer because its cache could not create symlinks (`EPERM`). The cloud build is the remaining platform-level check.

## 4. Verify the live deployment

Use the deployment URL shown by Vercel:

1. Open `/api/health`: expect `status: ok` and catalog versions.
2. Open `/api/crops`: expect three exploratory crops and five Kedah context-only crops.
3. Open `/` and refresh `/farm`, `/climate`, and `/planner` directly; SPA routes should render rather than return 404.
4. In the app, choose the hypothetical Kedah farm and request climate. Check that source, period, units, missing data, and limitations are visible. A NASA failure must produce an error, not invented observations.
5. Confirm paddy, rubber, oil palm, coconut, and Robusta coffee remain context-only. The API should reject their evaluation with `CROP_CONTEXT_ONLY`.
6. Try the separate exploratory annual-crop flow and confirm insufficient evidence is shown where a score cannot be supported.
7. Check Vercel runtime logs if an API request fails. Check the deployment protection setting before sharing the link with teammates.

The NASA POWER request may be slow on a cold function instance. The app uses a per-instance in-memory cache, so requests on another instance or after a restart can fetch NASA again. This prototype has no user authentication or application-level request throttling; review traffic and function usage before sharing the URL broadly.

## 5. Automatic Git deployment later

After scientific and team review, merge through the normal pull-request workflow. Once `main` contains the root configuration, connect the Vercel project to the Git repository if automatic deployments are wanted. Verify the production URL and all checks again. This guide does not authorize merging or changing the production branch.

Sources: [Vercel Services](https://vercel.com/docs/services), [FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi), [deploying Git repositories](https://vercel.com/docs/git).
