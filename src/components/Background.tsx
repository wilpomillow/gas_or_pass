"use client";

import { useEffect, useRef } from "react";
import { animate, utils } from "animejs";

export default function Background() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const v = { hue: 24, glow: 0.6, x: 0, y: 0 };

    const anim = animate(v, {
      hue: 50,
      glow: 1,
      duration: 14000,
      direction: "alternate",
      easing: "easeInOutQuad",
      loop: true,
      onUpdate: () => {
        el.style.setProperty("--bg-h", String(v.hue));
        el.style.setProperty("--bg-g", String(v.glow));
      }
    });

    // continuous, non-clipping drift (oversized layers)
    const drift = animate(v, {
      x: 1,
      y: 1,
      duration: 26000,
      direction: "alternate",
      easing: "easeInOutSine",
      loop: true,
      onUpdate: () => {
        el.style.setProperty("--bg-x", String(v.x));
        el.style.setProperty("--bg-y", String(v.y));
      }
    });

    return () => {
      anim.pause();
      drift.pause();
      utils.remove(v);
    };
  }, []);

  return (
    <div ref={ref} className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      {/* Oversized base so transforms never reveal edges */}
      <div
        className="absolute -inset-24"
        style={{
          background:
            "radial-gradient(1300px 760px at calc(18% + (var(--bg-x,0)*30%)) calc(26% + (var(--bg-y,0)*20%)), rgba(253,186,116,.45), transparent 62%)," +
            "radial-gradient(1100px 760px at calc(85% - (var(--bg-x,0)*25%)) calc(70% - (var(--bg-y,0)*20%)), rgba(234,88,12,.30), transparent 58%)," +
            "radial-gradient(1000px 760px at 50% 110%, rgba(255,247,237,.20), transparent 60%)," +
            "linear-gradient(180deg, #2c1812 0%, #5a2f20 42%, #2c1812 100%)"
        }}
      />

      {/* Halftone mask */}
      <div className="absolute -inset-24 halftone [mask-image:radial-gradient(circle_at_40%_35%,black,transparent_70%)]" />

      {/* Dots layer (repeat) */}
      <div
        className="absolute -inset-24 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,.18) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          transform: "translate3d(calc(var(--bg-x,0)*-22px), calc(var(--bg-y,0)*-16px), 0)"
        }}
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 700px at 50% 40%, rgba(0,0,0,.0), rgba(0,0,0,.22) 70%, rgba(0,0,0,.34) 100%)"
        }}
      />

      {/* Comic sheen sweep */}
      <div
        className="absolute -inset-32 rotate-12 opacity-28 blur-2xl"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.20) 35%, rgba(255,255,255,.10) 50%, transparent 70%)",
          transform: "translate3d(calc(var(--bg-x,0)*90px), 0, 0)"
        }}
      />
    </div>
  );
}
