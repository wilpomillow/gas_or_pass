// src/lib/injectInterstitialCards.ts

export const INTERSTITIAL_LINES = [
  "That noise wasn’t harmless.",
  "Actions. Consequences.",
  "Some sounds are warnings.",
  "That wasn’t just air.",
  "You heard the warning.",
  "The body has spoken.",
  "That sound was prophetic.",
  "Events are now in motion.",
  "That noise changed things.",
  "Nothing about that was safe.",
] as const

export type InterstitialCard = {
  kind: "interstitial"
  id: string
  title: string
  href: string
  imageSrc: string
}

export function injectInterstitialCards<T extends { id: string }>(
  cards: T[],
  everyN: number = 10
): Array<T | InterstitialCard> {
  const href = "https://au.whogivesacrap.org/"
  const imageSrc =
    "https://au.whogivesacrap.org/cdn/shop/files/HomepageHeroBanner_b562845d-1697-4d6e-a299-79ee327eff57.png?v=1765434410&width=1600"

  const out: Array<T | InterstitialCard> = []

  for (let i = 0; i < cards.length; i++) {
    out.push(cards[i])

    const isEndOfBlock = (i + 1) % everyN === 0
    const isNotLast = i !== cards.length - 1

    if (isEndOfBlock && isNotLast) {
      const title =
        INTERSTITIAL_LINES[Math.floor(Math.random() * INTERSTITIAL_LINES.length)]

      out.push({
        kind: "interstitial",
        id: `interstitial-${i + 1}-${Math.random().toString(16).slice(2)}`,
        title,
        href,
        imageSrc,
      })
    }
  }

  return out
}
