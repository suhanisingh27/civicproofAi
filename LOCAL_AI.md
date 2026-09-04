# Local AI

CivicProof uses Hugging Face Transformers.js to run a zero-shot image classifier in the browser. Transformers.js runs models with ONNX Runtime in the browser, and its zero-shot image classification pipeline accepts candidate labels. The first run downloads the model and browser caching makes later runs faster.

Model: `Xenova/clip-vit-base-patch32`

No OpenAI API key is needed for citizen image analysis.

## VS Code

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The first AI analysis can take longer because the model files must be downloaded. An internet connection is required on the first load and when the model is not cached.

## Important limitation

Zero-shot classification is useful for a working no-key prototype, but the similarity score is not a calibrated probability and should not be presented as certified accuracy. For production-grade civic detection, replace this with a custom model trained and validated on representative civic images.
