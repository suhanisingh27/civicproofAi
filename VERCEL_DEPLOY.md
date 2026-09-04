# CivicProof AI — Vercel Deployment

This package is flattened so `app/`, `components/`, `package.json`, etc. are at the project root. This avoids the common Vercel error: `Couldn't find any pages or app directory`.

## GitHub
Push the contents of this folder directly to the root of your GitHub repository. Do NOT push `.env.local`.

## Vercel
Import the GitHub repository. If Vercel asks for a Root Directory, leave it as `./` (the repository root).

Add these Environment Variables:
- `OPENAI_API_KEY` = your OpenAI API key
- `OPENAI_VISION_MODEL` = `gpt-5.6-luna`
- Optional: `(not required)`
- Optional: `(not required)`

Redeploy after adding environment variables.

## Local VS Code
Create `.env.local` in this root folder:

OPENAI_API_KEY=your_key_here
OPENAI_VISION_MODEL=gpt-5.6-luna

Then run:

npm install
npm run dev

Open http://localhost:3000
