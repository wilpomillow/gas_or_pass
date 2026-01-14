import Game from "@/components/Game";
import { loadCards } from "@/lib/loadCards";

export default async function Page() {
  const cards = await loadCards();
  return <Game cards={cards} />;
}
