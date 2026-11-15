# Host AgriShift AI on Vercel

This guide uses one Vercel project for the React frontend and FastAPI backend. The repository-root `vercel.json` uses Vercel Services: `/api/*` routes to FastAPI and other paths route to the Vite app. Vercel currently lists Services as a beta feature available on all plans. Check the dashboard for current plan limits before inviting public traffic.

## 1. Confirm the branch

The latest Kedah context work is on `20261113_update`, with a draft pull request to `main`. Keep that branch separate from `main` until review. A Vercel deployment from that branch is a **Preview** deployment. The default production branch remains `main` and does not yet contain this Vercel configuration.

## 2. Import the repository

1. Log in to Vercel with the GitHub account that can access `Shafiqfaizzuddin/Agrishift-Ai`.
2. Select **Add New → Project** and import that repository. If the Vercel GitHub app asks for repository access, restrict it to this repository when possible.
3. Name the project `agrishift-ai`. Set **Root Directory** to the repository root (`./`), not `frontend` or `backend`.
4. Keep the default build settings from the root `vercel.json`. Do not add a frontend-only framework or output-directory override in the dashboard.
5. Leave `VITE_API_BASE_URL` unset. No NASA API key is required. Do not copy a local `.env` file into Vercel.

The first automatic production build may use `main`, which predates the root Services configuration. Treat it as a setup attempt, not evidence that the latest branch is deployed.

## 3. Deploy the feature branch preview

In the Vercel project, open **Deployments → Create Deployment**, enter `20261113_update` as the Git reference, and deploy it as a preview. Alternatively, a new push to that branch may trigger a preview automatically after the Git connection is established. Verify the deployment lists the intended commit and finishes **Ready**. Do not promote it to production or merge the draft PR as part of this step.

## 4. Verify the live deployment

Use the preview URL shown by Vercel:

1. Open `/api/health`: expect `status: ok` and catalog versions.
2. Open `/api/crops`: expect three exploratory crops and five Kedah context-only crops.
3. Open `/` and refresh `/farm`, `/climate`, and `/planner` directly; SPA routes should render rather than return 404.
4. In the app, choose the hypothetical Kedah farm and request climate. Check that source, period, units, missing data, and limitations are visible. A NASA failure must produce an error, not invented observations.
5. Confirm paddy, rubber, oil palm, coconut, and Robusta coffee remain context-only. The API should reject their evaluation with `CROP_CONTEXT_ONLY`.
6. Try the separate exploratory annual-crop flow and confirm insufficient evidence is shown where a score cannot be supported.
7. Check Vercel runtime logs if an API request fails. Check the deployment protection setting before sharing a preview link with teammates.

The NASA POWER request may be slow on a cold function instance. The app uses a per-instance in-memory cache, so requests on another instance or after a restart can fetch NASA again. This prototype has no user authentication or application-level request throttling; review traffic and function usage before public promotion.

## 5. Production later

After scientific and team review, merge through the normal pull-request workflow. Vercel will deploy the configured production branch when it contains the root configuration. Verify the production URL and all checks again. This guide does not authorize merging or changing the production branch.

Sources: [Vercel Services](https://vercel.com/docs/services), [FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi), [deploying Git repositories](https://vercel.com/docs/git).
