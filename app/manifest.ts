import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CivicProof AI",
    short_name: "CivicProof",
    description: "Evidence-first civic reporting and resolution tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#005a7a",
    icons: [
      {
        src: "/civicproof-logo.jpeg",
        sizes: "any",
        type: "image/jpeg",
      },
    ],
  };
}
