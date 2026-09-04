# Start CivicProof in VS Code — No API Keys

1. Extract the ZIP.
2. Open the **root folder** in VS Code (the folder containing `package.json`).
3. Open Terminal → New Terminal.
4. Run:

```bash
npm install
npm run dev
```

5. Open **http://localhost:3000**.
6. Create a citizen account on the first screen.

No `.env.local`, Supabase URL, Supabase service-role key, or OpenAI API key is required.

### Local data

The app automatically creates:

- `.data/civicproof.json` — accounts, sessions and complaints
- `public/uploads/` — locally saved complaint photos

Do not commit `.data/` to GitHub.

### AI

The civic image classifier runs in the browser. Internet is needed the first time the model is downloaded. After that, the browser can use its cache when available.
