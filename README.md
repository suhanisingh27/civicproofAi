# CivicProof AI — Professional No-Setup Prototype

A real-world civic reporting prototype with citizen access, live camera capture, browser AI observations, GPS tagging, public map, complaint history and CivicProof Assistant.

## No setup credentials required

The citizen login uses browser local storage. You do **not** need Supabase, an OpenAI API key, `.env.local`, or a database to run the citizen workflow.

## Run in VS Code

Open this folder in VS Code and run:

```bash
npm install
npm run dev
```

Or double-click `START_CIVICPROOF.bat`. It will install missing dependencies automatically and start the server.

Open `http://localhost:3000`.

No API key is required.

## Login

Enter a citizen name, valid email, and matching password (eight or more characters, with a letter and a number), then select **Continue as Citizen**.

## Main workflow

Login → Report → Live camera → Local AI observations → GPS → Save complaint → Public map → Profile/history → Assistant.

## Storage limitation

For this no-setup prototype, citizen/session/complaint data is stored in the browser. That means it survives reloads on the same browser, and multiple citizens can use the same browser, but it is not a shared cloud database across different devices. For a production multi-device deployment, use a persistent database/storage service.

## CivicProof Professional Upgrade
- Navigation menu is available from the home and inner screens.
- City Map shows every GPS-tagged complaint stored by the app, with filters, search, severity/status colors and complaint-level navigation.
- Google Maps navigation uses official keyless Maps URLs, so no Google Maps API key is required for launching directions.
- CivicProof AI Assistant works without a private AI API key. It combines local CivicProof context with public online knowledge endpoints (DuckDuckGo Instant Answer + Wikipedia) for general questions.
- No private API keys are embedded in the browser bundle.

For a true city-wide multi-user deployment, replace localStorage with a shared backend/database so every citizen sees the same complaint dataset.
