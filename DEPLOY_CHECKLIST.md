# CivicProof deployment checklist

1. Run `npm install`
2. Run `npm run build`
3. Create OpenAI API key.
4. Create local file-backed storage project.
5. Run `supabase-schema.sql` in local file-backed storage SQL Editor.
6. Add Vercel env vars:
   - OPENAI_API_KEY
   - OPENAI_VISION_MODEL=gpt-5.6-luna
   - (not required)
   - (not required)
7. Redeploy.
8. Open `/report`, take/upload a real photo, allow GPS, run AI analysis, submit.
9. Open `/proof` and upload real before/after photos to test repair verification.

Browser GPS requires HTTPS in production (Vercel provides HTTPS).
