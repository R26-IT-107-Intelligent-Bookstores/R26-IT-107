import type { Metadata } from "next";
import RecommendationResults from "@/components/emobooks/RecommendationResults";

export const metadata: Metadata = { title: "EmoBooks | Your reading suggestions" };

export default function RecommendationsPage() {
  return <RecommendationResults />;
}
