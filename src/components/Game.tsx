// src/components/Game.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Card, CardGuess } from "@/lib/types";
import Background from "./Background";
import SwipeCard from "./SwipeCard";
import Controls from "./Controls";
import MediaPanel from "./MediaPanel";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  cards: Card[];
};

type Phase = "start" | "guess" | "reveal";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function lerpColor(rgbA: [number, number, number], rgbB: [number, number, number], t: number) {
  const r = Math.round(lerp(rgbA[0], rgbB[0], t));
  const g = Math.round(lerp(rgbA[1], rgbB[1], t));
  const b = Math.round(lerp(rgbA[2], rgbB[2], t));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function Game({ cards }: Props) {
  const startCard = useMemo(() => cards.find((c) => c.kind === "start") ?? cards[0], [cards]);
  const basePlayable = useMemo(() => cards.filter((c) => c.kind !== "start"), [cards]);

  const [deck, setDeck] = useState<Card[]>(() => shuffle(basePlayable));
  const [index, setIndex] = useState(0);

  const [phase, setPhase] = useState<Phase>(startCard ? "start" : "guess");
  const [correct, setCorrect] = useState<boolean | null>(null);

  const [streak, setStreak] = useState(0);
  const [streakPop, setStreakPop] = useState<number | null>(null);
  const streakTimer = useRef<number | null>(null);

  // Anchor position to the rendered card wrapper
  const cardWrapRef = useRef<HTMLDivElement | null>(null);

  // Always have a fallback position so popup can render immediately
  const [popupPos, setPopupPos] = useState<{ left: number; top: number }>({ left: 0, top: 64 });

  useEffect(() => {
    setDeck(shuffle(basePlayable));
    setIndex(0);
  }, [basePlayable]);

  const current = phase === "start" ? startCard : deck[index];

  const reshuffle = () => {
    setDeck(shuffle(basePlayable));
    setIndex(0);
  };

  const computePopupPos = () => {
  if (typeof window === "undefined") return;

  const el = cardWrapRef.current;

  if (!el) {
    setPopupPos({ left: window.innerWidth / 2, top: 55 });
    return;
  }

  const rect = el.getBoundingClientRect();

  setPopupPos({
    left: rect.left + rect.width / 2,
    top: rect.top - 60,
  });
};


  useEffect(() => {
    if (typeof window === "undefined") return;

    const measureSoon = () => {
      // double-rAF is key with AnimatePresence/motion mounts
      requestAnimationFrame(() => requestAnimationFrame(computePopupPos));
    };

    measureSoon();

    const onResize = () => measureSoon();
    window.addEventListener("resize", onResize);

    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window && cardWrapRef.current) {
      ro = new ResizeObserver(() => measureSoon());
      ro.observe(cardWrapRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
    // position depends on which card is rendered
  }, [phase, index]);

  useEffect(() => {
    return () => {
      if (streakTimer.current) window.clearTimeout(streakTimer.current);
    };
  }, []);

  const next = () => {
    setCorrect(null);

    if (index + 1 >= deck.length) {
      reshuffle();
      setPhase("guess");
      return;
    }

    setIndex((i) => i + 1);
    setPhase("guess");
  };

  const fireStreakPopup = (n: number) => {
    setStreakPop(n);

    if (typeof window !== "undefined") {
      requestAnimationFrame(() => requestAnimationFrame(computePopupPos));
    }

    if (streakTimer.current) window.clearTimeout(streakTimer.current);
    streakTimer.current = window.setTimeout(() => setStreakPop(null), 1000);
  };

  const submit = (g: CardGuess) => {
    if (!current) return;

    if (current.kind === "start") {
      setPhase("guess");
      return;
    }

    const isCorrect = current.correct ? current.correct === g : null;
    setCorrect(isCorrect);

    if (isCorrect === true) {
      setStreak((s) => {
        const n = s + 1;
        fireStreakPopup(n);
        return n;
      });
    } else if (isCorrect === false) {
      setStreak(0);
      setStreakPop(null);
      if (streakTimer.current) window.clearTimeout(streakTimer.current);
      streakTimer.current = null;
    }

    setPhase("reveal");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === "reveal") {
        if (e.key === "Enter" || e.key === " ") next();
        return;
      }
      if (e.key === "ArrowLeft") submit("no");
      if (e.key === "ArrowRight") submit("yes");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index, current, deck]);

  const startBody = (
    <div className="h-full flex items-center justify-center">
      <div className="white-border rounded-3xl bg-white/16 p-8 w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="font-[var(--font-fredoka)]"
        >
          <div className="text-6xl md:text-7xl font-extrabold tracking-tight text-[#8D5C42] outline-white uppercase">
            GAS OR PASS
          </div>

          <motion.div
            animate={{ rotate: [0, -2, 2, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.2 }}
            className="mt-4 text-xl md:text-2xl font-bold text-white/90"
          >
            SWIPE <span className="text-white">←</span> PASS / <span className="text-white">→</span> GAS
          </motion.div>

          <div className="mt-4 text-lg md:text-xl font-semibold text-white/85">
            AFTER YOU PICK, WE REVEAL THE CLIP
          </div>
            <div className="mt-1 text-sm md:text-base font-normal text-white/60">
            BY WILPO MILLOW
          </div>
        </motion.div>
      </div>
    </div>
  );

  const guessBody = (
    <div className="space-y-5">
      <MediaPanel
        videoSrc={current?.videoSrc}
        start={current?.start ?? null}
        end={current?.end ?? null}
        autoPlayAudio={true}
        showVideo={false}
        autoPlayVideo={false}
      />
    </div>
  );

  const revealBody = (
    <div className="space-y-4">
      <MediaPanel
        videoSrc={current?.videoSrc}
        start={current?.start ?? null}
        end={current?.end ?? null}
        autoPlayAudio={false}
        showVideo={true}
        autoPlayVideo={true}
      />
    </div>
  );

  const footerStart = (
    <button
      onClick={() => setPhase("guess")}
      className="
        btn-start
        w-full
        rounded-3xl
        outline-white-thin
        bg-gradient-to-b
        from-[#b58064]
        to-[#8d5c42]
        py-6
        text-5xl
        md:text-6xl
        font-extrabold
        font-[var(--font-fredoka)]
        text-[#8F5D42]
        hover:brightness-105
        flex
        items-center
        justify-center
        white-border
        relative
        overflow-hidden
      "
    >
      <span className="relative z-10 tracking-wide">START</span>
    </button>
  );

  const footerGuess = <Controls onPick={submit} />;

  const footerReveal = (
    <button
      onClick={next}
      className="white-border w-full rounded-3xl bg-white/25 py-5 text-4xl font-extrabold hover:bg-white/25 flex items-center justify-center text-[#8F5D42] outline-white-extrathin"
    >
      NEXT
    </button>
  );

  const title =
    phase === "start"
      ? ""
      : phase === "reveal"
        ? correct === true
          ? "CORRECT"
          : correct === false
            ? "WRONG"
            : "ANSWER"
        : "GUESS";    
        // : (current?.title ?? "CARD").toUpperCase();

  const streakT = Math.min(10, streak) / 20;
  const streakBg = lerpColor([255, 255, 255], [44, 24, 18], streakT);

  const streakPill =
    streak > 0 ? (
      <div
        className="white-border rounded-full px-4 py-1 font-extrabold uppercase text-[#8F5D42] outline-white-extrathin"
        style={{ backgroundColor: streakBg }}
      >
        STREAK: {streak}
      </div>
    ) : null;

  const streakPopup =
    streakPop ? (
      <motion.div
        key="streak-popup"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div
          className="
            white-border
            rounded-full
            min-h-[60px]
            min-w-[150px]
            px-6
            flex
            items-center
            justify-center
            font-extrabold
            uppercase
            text-4xl
            bg-white
            text-[#8F5D42]
            outline-white-extrathin
          "
        >
          STREAKS: {streakPop}
        </div>
      </motion.div>
    ) : null;

  const portal =
    typeof document !== "undefined"
      ? createPortal(
          <div
            className="pointer-events-none"
            style={{
              position: "fixed",
              left: popupPos.left || 0,
              top: popupPos.top || 64,
              transform: "translate(-50%, 0)",
              zIndex: 2147483647,
            }}
          >
            <AnimatePresence>{streakPop ? streakPopup : null}</AnimatePresence>
          </div>,
          document.body
        )
      : null;

  const centerTitle = phase !== "start";

  return (
    <main className="relative min-h-dvh font-[var(--font-fredoka)]">
      <Background />
      {portal}

      <div className="mx-auto min-h-dvh w-[min(96vw,980px)] grid place-items-center py-10">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${phase}-${current?.mdxFile ?? "none"}-${index}`}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="w-full flex justify-center"
          >
            <div ref={cardWrapRef} className="w-full flex justify-center">
              <SwipeCard
                title={title}
                subtitle={""}
                disabled={phase === "reveal"}
                onSwipe={submit}
                body={phase === "start" ? startBody : phase === "reveal" ? revealBody : guessBody}
                footer={phase === "start" ? footerStart : phase === "reveal" ? footerReveal : footerGuess}
                centerTitle={centerTitle}
                topPill={streakPill}
                overlay={null}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
