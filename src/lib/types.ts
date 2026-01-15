// src/lib/types.ts
export type CardGuess = "yes" | "no";

export type CardMeta = {
  id: number;
  title: string;

  videoSrc?: string | null;

  // segment timestamps (seconds)
  start?: number | null;
  end?: number | null;

  correct?: CardGuess | null;
  kind?: "start" | "guess";
};

export type Card = CardMeta & {
  mdxFile: string;
};

// NEW: Interstitial card + mixed deck item type
export type InterstitialCard = {
  kind: "interstitial";
  id: string;
  title: string;
  href: string;
  imageSrc: string;
};

export type DeckItem = Card | InterstitialCard;
