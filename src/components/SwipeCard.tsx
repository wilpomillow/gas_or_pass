// src/components/SwipeCard.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { CardGuess } from "@/lib/types";

type Props = {
  title: string;
  subtitle?: string;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  onSwipe: (dir: CardGuess) => void;
  disabled?: boolean;
  centerTitle?: boolean;
  overlay?: React.ReactNode;
  topPill?: React.ReactNode;
};

type Rect = { left: number; top: number; width: number; height: number };

export default function SwipeCard({
  title,
  subtitle,
  body,
  footer,
  onSwipe,
  disabled,
  centerTitle,
  overlay,
  topPill,
}: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-12, 0, 12]);

  const yesOpacity = useTransform(x, [26, 128], [0, 1]);
  const noOpacity = useTransform(x, [-128, -26], [1, 0]);

  const threshold = 140;

  const tint = useTransform(x, [-240, 0, 240], ["rgba(255,255,255,0.16)", "rgba(255,255,255,0.12)", "rgba(255,255,255,0.16)"]);

  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  const rafRef = useRef<number | null>(null);

  const measure = () => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  };

  const scheduleMeasure = () => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      measure();
    });
  };

  useEffect(() => {
    setMounted(true);
    scheduleMeasure();
    const onResize = () => scheduleMeasure();
    const onScroll = () => scheduleMeasure();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    const unsub = x.on("change", () => scheduleMeasure());

    const ro = new ResizeObserver(() => scheduleMeasure());
    if (cardRef.current) ro.observe(cardRef.current);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      unsub?.();
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [x]);

  const pillCommon =
    "pointer-events-none select-none rounded-[30px] px-10 py-7 text-4xl md:text-5xl font-extrabold uppercase text-[#2c1812] white-border outline-white";

  const pillLayer = useMemo(() => {
    if (!mounted || !rect) return null;

    const gap = 14;
    const midY = rect.top + rect.height / 2;

    const passStyle: React.CSSProperties = {
      position: "fixed",
      left: rect.left - gap,
      top: midY,
      transform: "translate(-100%, -50%)",
      zIndex: 2147483647,
    };

    const gasStyle: React.CSSProperties = {
      position: "fixed",
      left: rect.left + rect.width + gap,
      top: midY,
      transform: "translate(0%, -50%)",
      zIndex: 2147483647,
    };

    return createPortal(
      <>
        <motion.div style={{ ...passStyle, opacity: noOpacity as any }} className={`${pillCommon} bg-white`}>
          PASS
        </motion.div>

        <motion.div style={{ ...gasStyle, opacity: yesOpacity as any }} className={`${pillCommon} bg-[#fdba74]`}>
          GAS
        </motion.div>
      </>,
      document.body
    );
  }, [mounted, rect, noOpacity, yesOpacity]);

  return (
    <>
      {pillLayer}

      <motion.div
        ref={cardRef}
        className="relative w-[min(92vw,560px)]"
        style={{ x, rotate }}
        drag={disabled ? false : "x"}
        dragElastic={0.18}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => {
          if (disabled) return;
          const dx = info.offset.x;
          if (dx > threshold) onSwipe("yes");
          else if (dx < -threshold) onSwipe("no");
        }}
        whileTap={{ scale: 0.985 }}
      >
        {topPill ? <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-[60]">{topPill}</div> : null}

        <motion.div className="aspect-[5/7] max-h-[86vh] rounded-[34px] p-5 white-border-thick soft-pop relative z-20" style={{ backgroundColor: tint }}>
          <div className="h-full rounded-[28px] bg-white/20 p-6 white-border flex flex-col relative z-20">
            {overlay ? <div className="pointer-events-none absolute inset-x-0 -top-[3.75rem] z-[9999] grid place-items-center">{overlay}</div> : null}

            <div className={"flex items-start justify-between gap-3 " + (centerTitle ? "justify-center" : "")}>
              <div className={"min-w-0 w-full " + (centerTitle ? "text-center" : "")}>
                <h2 className="truncate text-3xl md:text-4xl tracking-tight font-extrabold uppercase text-[#8F5D42] outline-white-thin font-[var(--font-fredoka)]">
                  {title}
                </h2>
                {subtitle ? <p className="mt-1 text-sm text-[#2c1812]/80 font-bold outline-white">{subtitle}</p> : null}
              </div>
            </div>

            <div className="mt-5 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {body}
            </div>

            {footer ? <div className="mt-4">{footer}</div> : null}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
