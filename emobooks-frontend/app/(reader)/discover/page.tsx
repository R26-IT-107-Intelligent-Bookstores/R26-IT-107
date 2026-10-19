import type { Metadata } from "next";
import RecommendationWizard from "@/components/emobooks/RecommendationWizard";

export const metadata: Metadata = { title: "EmoBooks | Find my next read" };

export default function DiscoverPage() {
  return <RecommendationWizard />;
}
