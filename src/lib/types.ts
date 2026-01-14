// src/lib/types.ts
export type CardGuess = "yes" | "no";

export type CardMeta = {
  id: number;
  title: string;

  videoSrc?: string | null;

  // NEW: segment timestamps (seconds)
  start?: number | null;
  end?: number | null;

  correct?: CardGuess | null;
  kind?: "start" | "guess";
};

export type Card = CardMeta & {
  mdxFile: string;
};
