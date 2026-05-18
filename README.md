<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/724ced11-6eb1-495e-bfbc-13580e6c8cd5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

1. Create a Vercel project pointing at this repository.
2. Ensure the project uses the default build command: `npm run build`.
3. If you need environment variables, add them in Vercel settings.
4. Vercel will serve the frontend from `dist` and route `/api/*` to the serverless API handler in `api/[...slug].ts`.

> Note: API state in this mock server is in-memory and may reset on cold starts. For production, use a real database or persistent storage.
