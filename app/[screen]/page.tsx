import CivicProofApp from "@/components/civic-proof-app";
export default async function Page({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  return <CivicProofApp screen={screen} />;
}
