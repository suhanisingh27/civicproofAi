## Quick local start

See `START_IN_VSCODE.md` or double-click `START_CIVICPROOF.bat` on Windows.

# CivicProof AI — Real AI Upgrade

This version upgrades the original visual prototype with:
- Real camera/file image capture in the browser
- Real vision analysis through OpenAI Responses API
- Structured civic issue, confidence, severity, evidence, risk, priority and department
- Device GPS + reverse geocoding
- Server-side complaint API
- local file-backed storage persistence and evidence-image storage
- Real before/after repair audit through the same vision pipeline

## 1. Install

```bash
npm install
npm run dev
```

## 2. Create OpenAI API key

Create an API key in the OpenAI platform and put it in `.env.local` locally:

```env
OPENAI_API_KEY=...
OPENAI_VISION_MODEL=gpt-5.6-luna
```

The key is only used in Next.js server routes. Never prefix it with `NEXT_PUBLIC_`.

## 3. Create local file-backed storage project

Create a local file-backed storage project, open SQL Editor and run `supabase-schema.sql`.

Then add:

```env
(not required)=https://YOUR_PROJECT.supabase.co
(not required)=...
```

The service-role key must stay server-side. Do not expose it to browser code.

The SQL creates:
- `complaints` table
- indexes for time and coordinates
- `civic-evidence` storage bucket

## 4. Vercel

Add the same environment variables in Vercel Project Settings → Environment Variables, then redeploy.

Required:
- `OPENAI_API_KEY`
- `(not required)`
- `(not required)`

Optional:
- `OPENAI_VISION_MODEL`

## What is intentionally not claimed

CivicProof produces an AI evidence assessment. It does not certify engineering measurements, prove fraud, or guarantee that the selected government department is legally responsible. GPS is captured from the device and the address is resolved separately.

## Major real-world citizen account upgrade

The app now starts at a citizen login/signup screen. local file-backed storage Auth provides the account session, while each complaint is linked to the authenticated user's UUID. The server derives the user from the secure HTTP-only session cookie, so the browser cannot choose another user's history. local file-backed storage recommends Auth plus a separate public `profiles` table for application profile data and Row Level Security for authorization. See the official local file-backed storage Auth and user-management docs.

- `/` → citizen login/signup
- `/profile` → account + issue history + open/resolved counters
- `/complaints` → only the signed-in citizen's complaints
- `/map` → public city map of submitted GPS-tagged issues; refreshes every 10 seconds
- Report → saves the authenticated user's ID automatically
- Floating CivicProof Assistant → explains reporting, map visibility and resolution statuses without requiring another paid AI API

Run `supabase-schema.sql` in local file-backed storage SQL Editor before using real accounts. Add `(not required)` and `(not required)` to `.env.local` on the server. Never expose the service-role/secret key in browser code.
