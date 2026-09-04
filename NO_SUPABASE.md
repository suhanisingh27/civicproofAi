# CivicProof — No Supabase / No API Login

This version uses browser `localStorage` for citizen access and demo complaint history. It does not call the Supabase/auth filesystem APIs from the citizen login flow.

## Run in VS Code

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Citizen login

Enter your name, a valid email, and a matching password with at least eight characters, including a letter and a number. No Supabase project, API key, or database setup is required.

## Important deployment note

This browser-only storage is suitable for a prototype/demo. Data is tied to the browser/device. It is not a shared production database across unrelated devices. Vercel serverless filesystems are not durable for application state, so the app deliberately avoids writing `.data` during citizen login.
