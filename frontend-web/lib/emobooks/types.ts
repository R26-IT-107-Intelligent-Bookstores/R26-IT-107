export type Emotion = "happy" | "sad" | "fearful" | "surprised" | "angry" | "neutral";
export type GoalMode = "continue" | "change";

export type RecommendationRequest = {
  currentEmotion: Emotion | null;
  goalMode: GoalMode;
  targetEmotion: Emotion | null;
  genres: string[];
  favouriteBookIds: string[];
  interests: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  genres: string[];
  emotions: Emotion[];
};

export type RecommendationResult = Book & {
  recommendationReason: string;
  emotionLabel: Emotion;
  finalScore: number;
  isDemo: false;
};
