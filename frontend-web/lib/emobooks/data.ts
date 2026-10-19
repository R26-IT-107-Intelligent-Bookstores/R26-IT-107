import type { Emotion, RecommendationRequest } from "./types";

export const emotions: { id: Emotion; label: string; symbol: string; description: string; color: string }[] = [
  { id: "happy", label: "Happy", symbol: "☀️", description: "Light, joyful & optimistic", color: "#fef3c7" },
  { id: "sad", label: "Sad", symbol: "🌧️", description: "Quiet, tender & reflective", color: "#dbeafe" },
  { id: "fearful", label: "Fearful", symbol: "🌙", description: "Uncertain, tense & cautious", color: "#ede9fe" },
  { id: "surprised", label: "Surprised", symbol: "✨", description: "Curious & full of wonder", color: "#ffedd5" },
  { id: "angry", label: "Angry / Disgusted", symbol: "🔥", description: "Frustrated & restless", color: "#ffe4e6" },
  { id: "neutral", label: "Neutral", symbol: "🍃", description: "Balanced, calm & open", color: "#d1fae5" },
];

export const emptyRequest: RecommendationRequest = {
  currentEmotion: null, goalMode: "continue", targetEmotion: null,
  genres: [], favouriteBookIds: [], interests: "",
};
export function emotionLabel(emotion: Emotion | null) {
  return emotions.find((item) => item.id === emotion)?.label ?? "your mood";
}
export function getTarget(request: RecommendationRequest) {
  return request.goalMode === "continue" ? request.currentEmotion : request.targetEmotion;
}

export function parseRequest(value: unknown): RecommendationRequest {
  if (!value || typeof value !== "object") return { ...emptyRequest };
  const data = value as Record<string, unknown>;
  const validEmotion = (item: unknown): item is Emotion => emotions.some((emotion) => emotion.id === item);
  return {
    currentEmotion: validEmotion(data.currentEmotion) ? data.currentEmotion : null,
    targetEmotion: validEmotion(data.targetEmotion) ? data.targetEmotion : null,
    goalMode: data.goalMode === "change" ? "change" : "continue",
    genres: cleanList(data.genres, 10, 60),
    favouriteBookIds: cleanList(data.favouriteBookIds, 50, 100),
    interests: typeof data.interests === "string" ? data.interests.slice(0, 300) : "",
  };
}

export function cleanList(value: unknown, limit: number, maxLength: number): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0 && item.length <= maxLength))].slice(0, limit) : [];
}
