Deploying the frontend on Vercel

- This repository contains static HTML/CSS/JS under the `frontend` folder.
- No build step is required for these static files.

Deployment options:

1) Let Vercel use the repository root (recommended):
   - The included `vercel.json` routes all requests to `/frontend`.
   - Create a Vercel project from this repo and deploy; no build command required.

2) Or set the project Root Directory to `frontend` in Vercel:
   - Create a new Vercel project and set the Root Directory to `frontend`.
   - Deploy as a static site; no build command required.

If you prefer a Node-based dev server, add a dev dependency like `serve` and a `start` script in `package.json`.
