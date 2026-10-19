import { getTarget } from "./data";
import { publicRequest, toBook, toModelEmotion, type CatalogBook } from "./catalogApi";
import type { RecommendationRequest, RecommendationResult } from "./types";

export async function getRecommendations(request: RecommendationRequest, signal?: AbortSignal): Promise<RecommendationResult[]> {
  const target = getTarget(request);
  if (!request.currentEmotion || !target) throw new Error("Choose your current emotion and an emotional goal first.");
  const response = await publicRequest<{ books: (CatalogBook & { recommendation_reason: string; relevance_score: number })[] }>(
    "/api/emobooks/recommendations", {
      method: "POST", signal,
      body: JSON.stringify({
        current_emotion: toModelEmotion(request.currentEmotion), goal_mode: request.goalMode,
        target_emotion: request.goalMode === "change" ? toModelEmotion(target) : null,
        genres: request.genres, favourite_book_ids: request.favouriteBookIds, interests: request.interests,
      }),
    },
  );
  return response.books.map((book) => ({
    ...toBook(book), emotionLabel: target, isDemo: false,
    finalScore: book.relevance_score, recommendationReason: book.recommendation_reason,
  }));
}
