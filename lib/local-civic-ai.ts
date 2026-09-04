export type LocalDetection = {
  label: string;
  confidence: number;
  box: [number, number, number, number];
};

export type LocalCivicAnalysis = {
  issue_type: string;
  confidence: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_score: number;
  evidence: string[];
  description: string;
  estimated_size: string;
  hazard: string;
  recommended_action: string;
  department: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  visible_text: string[];
  detections: LocalDetection[];
  source: "local-zero-shot";
};

type Candidate = {
  label: string;
  prompt: string;
  department: string;
  hazard: string;
  action: string;
  baseRisk: number;
};

// A broad civic vocabulary. Transformers.js/CLIP can compare the real photo
// against these descriptions without an API key or a custom server.
export const CIVIC_CATEGORIES: Candidate[] = [
  { label: "Pothole", prompt: "a real street photo showing a pothole in the road", department: "PWD / Roads Department", hazard: "A pothole can cause vehicle, cyclist and pedestrian accidents.", action: "Inspect the location and repair or patch the pothole.", baseRisk: 55 },
  { label: "Garbage Dump", prompt: "a real street photo showing a large pile of garbage or household waste dumped in a public place", department: "Municipal Sanitation", hazard: "Accumulated waste can attract pests, create foul conditions and block public space.", action: "Remove the waste and arrange sanitation inspection.", baseRisk: 45 },
  { label: "Waterlogging", prompt: "a real street photo showing water accumulated or flooded on a road or public area", department: "Municipal Drainage / Flood Control", hazard: "Standing water can create traffic hazards, sanitation problems and mosquito breeding.", action: "Inspect drainage, clear blockages and remove accumulated water.", baseRisk: 60 },
  { label: "Broken Streetlight", prompt: "a real street photo showing a broken, damaged or non-working streetlight", department: "Municipal Electrical Department", hazard: "Poor street lighting can reduce visibility and increase night-time safety risk.", action: "Inspect the light pole, wiring and lamp and restore lighting.", baseRisk: 50 },
  { label: "Damaged Road", prompt: "a real street photo showing severely damaged road surface, broken pavement or major road deterioration", department: "PWD / Roads Department", hazard: "Road deterioration can worsen and create traffic and pedestrian hazards.", action: "Inspect the road surface and schedule appropriate maintenance.", baseRisk: 52 },
  { label: "Open Manhole", prompt: "a real street photo showing an open, uncovered or missing manhole cover", department: "Municipal Sewerage Department", hazard: "An uncovered manhole is a serious fall and traffic hazard.", action: "Secure the area immediately and replace or cover the manhole.", baseRisk: 82 },
  { label: "Illegal Dumping", prompt: "a real street photo showing construction debris, industrial waste or illegally dumped material in a public place", department: "Municipal Enforcement / Sanitation", hazard: "Illegal dumping can obstruct roads and drains and create environmental and public-health risks.", action: "Inspect the site, remove the dumped material and investigate the responsible party.", baseRisk: 58 },
  { label: "Road Crack", prompt: "a real street photo showing visible cracks in asphalt or pavement", department: "PWD / Roads Department", hazard: "Unrepaired cracks can allow road deterioration to spread.", action: "Inspect the pavement and schedule sealing or resurfacing.", baseRisk: 38 },
  { label: "Blocked Drain", prompt: "a real street photo showing a blocked, overflowing or clogged roadside drain", department: "Municipal Drainage Department", hazard: "Blocked drains can cause flooding, stagnant water and sanitation problems.", action: "Clear the drain and inspect the drainage line.", baseRisk: 58 },
  { label: "Fallen Tree / Obstruction", prompt: "a real street photo showing a fallen tree, large branch or dangerous obstruction blocking a public road", department: "Municipal Emergency / Parks", hazard: "The obstruction can block traffic and create immediate physical danger.", action: "Secure the area and remove the obstruction safely.", baseRisk: 65 },
  { label: "Other Civic Issue", prompt: "a real photo showing another public infrastructure or civic problem that is not one of the listed categories", department: "Municipal Inspection", hazard: "The photo indicates a possible civic problem that needs human review.", action: "Review the evidence and route the report to the appropriate department.", baseRisk: 25 },
  { label: "Normal / No Issue", prompt: "a normal clean public street with no visible civic problem, damage, dumping, flooding or safety hazard", department: "No Department", hazard: "No obvious civic hazard is visible in the submitted photo.", action: "No complaint is recommended unless there is additional evidence.", baseRisk: 5 },
];

let classifierPromise: Promise<any> | null = null;

async function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = import("@huggingface/transformers").then(async ({ pipeline, env }) => {
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      return pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32", {
        dtype: "q8",
      });
    });
  }
  return classifierPromise;
}

function scorePercent(score: number) {
  return Math.max(0, Math.min(99, Math.round(score * 100)));
}

export async function analyzeCivicImage(dataUrl: string): Promise<LocalCivicAnalysis> {
  if (typeof window === "undefined") throw new Error("Local AI can only run in the browser.");

  const classifier = await getClassifier();
  const labels = CIVIC_CATEGORIES.map((x) => x.prompt);
  const results = await classifier(dataUrl, labels, { top_k: labels.length });

  const ranked = (results as Array<{ label: string; score: number }>)
    .map((r) => {
      const candidate = CIVIC_CATEGORIES.find((x) => x.prompt === r.label)!;
      return { candidate, score: Number(r.score) || 0 };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best) throw new Error("The local AI model returned no prediction.");

  // Zero-shot CLIP scores are similarity scores, not calibrated probabilities.
  // Keep the UI honest and use a conservative confidence floor for routing.
  const confidence = scorePercent(best.score);
  const margin = Math.max(0, best.score - (second?.score || 0));
  const isNormal = best.candidate.label === "Normal / No Issue";
  const uncertain = confidence < 45 || margin < 0.03;
  const selected = uncertain && !isNormal ? CIVIC_CATEGORIES.find((x) => x.label === "Other Civic Issue")! : best.candidate;
  const selectedScore = uncertain && !isNormal ? Math.max(0, Math.min(0.65, best.score)) : best.score;
  const finalConfidence = scorePercent(selectedScore);
  const risk = Math.min(100, Math.round(selected.baseRisk + finalConfidence * 0.45));
  const severity = risk >= 78 ? "CRITICAL" : risk >= 60 ? "HIGH" : risk >= 35 ? "MEDIUM" : "LOW";
  const priority = risk >= 78 ? "URGENT" : risk >= 60 ? "HIGH" : risk >= 35 ? "MEDIUM" : "LOW";

  const observations = ranked.slice(0, 5).map(({ candidate, score }) => `${candidate.label}: ${scorePercent(score)}% similarity`);
  const evidence = [
    `Local zero-shot vision model compared the image with ${CIVIC_CATEGORIES.length} civic categories.`,
    `Top observation: ${best.candidate.label} (${confidence}% similarity).`,
    ...observations.slice(1, 4),
  ];

  return {
    issue_type: selected.label,
    confidence: finalConfidence,
    severity,
    risk_score: risk,
    evidence,
    description: uncertain && !isNormal
      ? `The image is ambiguous. The strongest visual match was ${best.candidate.label}, but the model was not confident enough to make a specific civic classification, so it was routed to Other Civic Issue for human review.`
      : `${selected.label} is the strongest visual match from the local civic-image classifier.`,
    estimated_size: "Not reliably estimated from this image classifier",
    hazard: selected.hazard,
    recommended_action: selected.action,
    department: selected.department,
    priority,
    visible_text: [],
    detections: [{ label: selected.label, confidence: finalConfidence / 100, box: [0, 0, 1, 1] }],
    source: "local-zero-shot",
  };
}
