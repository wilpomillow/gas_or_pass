// src/lib/loadCards.ts
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { Card, CardGuess } from "./types";

const CARDS_DIR = path.join(process.cwd(), "content", "cards");

function asGuess(v: any): CardGuess | null {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "yes" || s === "no") return s;
  return null;
}

function asNumberOrNull(v: any): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

export async function loadCards(): Promise<Card[]> {
  const names = await fs.readdir(CARDS_DIR);
  const mdx = names.filter((n) => n.endsWith(".mdx")).sort();

  const parsed: Card[] = [];
  for (const file of mdx) {
    const full = path.join(CARDS_DIR, file);
    const raw = await fs.readFile(full, "utf-8");
    const { data } = matter(raw);

    const id = Number(data.id ?? 0);
    const title = String(data.title ?? data.name ?? file.replace(/\.mdx$/i, ""));

    const kind =
      String(data.kind ?? "").toLowerCase() === "start" || file.toLowerCase().includes("start")
        ? "start"
        : "guess";

    parsed.push({
      id,
      title,
      kind,
      videoSrc: data.videoSrc ? String(data.videoSrc) : null,
      start: asNumberOrNull(data.start),
      end: asNumberOrNull(data.end),
      correct: asGuess(data.correct),
      mdxFile: file,
    });
  }

  parsed.sort((a, b) => {
    if (a.kind === "start" && b.kind !== "start") return -1;
    if (b.kind === "start" && a.kind !== "start") return 1;
    return a.id - b.id;
  });

  return parsed;
}
