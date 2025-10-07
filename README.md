# Invoicing ROI Simulator

A lightweight full-stack prototype that simulates savings, ROI, and payback when switching from manual to automated invoicing. Includes a SPA frontend, REST API, local JSON persistence, and PDF report generation.

## Prerequisites
- Node.js 18+

## Quickstart (Local JSON storage)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Optionally configure a custom data directory (defaults to `./data`):
   - Create a `.env` file with:
     ```env
     PORT=3000
     DATA_DIR=./data
     ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

Saved scenarios are persisted to `DATA_DIR/scenarios.json`.

## API
- `POST /simulate` → body: inputs, returns calculation JSON
- `POST /scenarios` → save scenario by name and inputs
- `GET /scenarios` → list scenarios
- `GET /scenarios/:id` → get scenario
- `DELETE /scenarios/:id` → delete scenario
- `POST /report/generate` → body `{ email, inputs }`, returns PDF download

All responses are JSON unless `report/generate` which streams a PDF.

## Inputs
Refer to the UI fields; same keys are accepted by the API.

## Notes
- Server-only constants are not exposed to the client or API responses.
- The calculator applies a favorable bias factor ensuring positive ROI trends.

## Testing
- Open the app and tweak inputs; results update live.
- Save a scenario; confirm it appears in the list and can be loaded/deleted.
- Generate a report; an email prompt appears and triggers a PDF download.

## Deploying to Vercel

### Option 1: Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```
3. Follow prompts. Your app will be live at a Vercel URL.

### Option 2: Vercel Dashboard
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel will auto-detect the configuration and deploy

**Note:** On Vercel, saved scenarios are stored in `/tmp` (ephemeral, resets on cold starts). For production, consider using Vercel KV, Vercel Postgres, or another persistent storage solution.

## Scripts
- `npm run dev` — start server on port 3000
- `npm start` — same as dev
