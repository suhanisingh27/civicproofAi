# CivicProof AI observations

The citizen report flow now uses a browser-based zero-shot vision model so no OpenAI API key is required.

## Current observations
1. Pothole
2. Garbage Dump
3. Waterlogging
4. Broken Streetlight
5. Damaged Road
6. Open Manhole
7. Illegal Dumping
8. Road Crack
9. Blocked Drain
10. Fallen Tree / Obstruction
11. Other Civic Issue
12. Normal / No Issue

The model compares the captured photo with descriptive prompts for all 12 classes. It is a broad zero-shot classifier, not a certified civic inspection model. Low-confidence/ambiguous results are routed to `Other Civic Issue` for human review.

## Internet training photos
For a stronger project-specific classifier, gather diverse public images for each class and train a custom TensorFlow.js model. Google Teachable Machine supports gathering image examples, training classes, testing them and exporting a JavaScript/TensorFlow.js model. Use images you have permission to use and keep a separate validation set.

A practical target is at least 30 varied examples per class as a starting point, with more examples for difficult classes and different lighting, camera angles and distances.
