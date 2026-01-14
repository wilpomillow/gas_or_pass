// src/components/AudioVisualizer.tsx
"use client";

import { useEffect, useRef } from "react";

type Variant = "square" | "wide";

type Props = {
  analyser: AnalyserNode | null;
  active: boolean;
  variant?: Variant;
};

export default function AudioVisualizer({ analyser, active, variant = "wide" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // extra smoothing state (low-pass on the line itself)
  const prevYRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.max(1, canvas.clientWidth);
      const h = Math.max(1, canvas.clientHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // reset smoothing buffer when size changes
      prevYRef.current = null;
    };

    setSize();

    const ro = new ResizeObserver(() => setSize());
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // transparent background (no fill, no frame)
      ctx.clearRect(0, 0, w, h);

      if (!analyser || !active) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // smoother analyser output
      analyser.smoothingTimeConstant = 0.95;
      analyser.fftSize = 2048;

      const bufferLen = analyser.fftSize;
      const raw = new Uint8Array(bufferLen);
      analyser.getByteTimeDomainData(raw);

      const paddingX = 10;
      const paddingY = 10;

      const innerW = Math.max(1, w - paddingX * 2);
      const innerH = Math.max(1, h - paddingY * 2);

      const midY = paddingY + innerH / 2;

      // keep amplitude tasteful and stable
      const amp = innerH * 0.28;

      // downsample for smoother curve (fewer points = less jitter)
      const N = Math.min(180, Math.max(90, Math.floor(innerW / 3))); // adaptive
      const step = innerW / (N - 1);

      if (!prevYRef.current || prevYRef.current.length !== N) {
        prevYRef.current = new Float32Array(N);
        prevYRef.current.fill(midY);
      }

      // 0..1 (higher = smoother, lower = snappier)
      const alpha = 0.86;

      // Build a smooth quadratic path through midpoints
      const ys = new Float32Array(N);

      for (let i = 0; i < N; i++) {
        // sample raw at proportional index
        const idx = Math.floor((i / (N - 1)) * (bufferLen - 1));
        const v = (raw[idx] - 128) / 128; // [-1..1]
        const targetY = midY + v * amp;

        // low-pass filter to smooth motion
        const prev = prevYRef.current[i];
        const filtered = prev * alpha + targetY * (1 - alpha);
        prevYRef.current[i] = filtered;
        ys[i] = filtered;
      }

      ctx.beginPath();

      let x0 = paddingX;
      let y0 = ys[0];
      ctx.moveTo(x0, y0);

      for (let i = 1; i < N; i++) {
        const x1 = paddingX + i * step;
        const y1 = ys[i];

        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;

        ctx.quadraticCurveTo(x0, y0, cx, cy);

        x0 = x1;
        y0 = y1;
      }

      // comic under-stroke (brown)
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(141, 92, 66, 0.95)"; // #8D5C42-ish
      ctx.lineWidth = 12;
      ctx.stroke();

      // top stroke (white)
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 7;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [analyser, active]);

  const aspectClass = variant === "square" ? "aspect-square" : "aspect-[2/1]";

  return (
  <div
    className={`
      w-full
      ${aspectClass}
      rounded-3xl
      white-border
      bg-white/10
      overflow-hidden
      relative
    `}
  >
    <canvas ref={canvasRef} className="h-full w-full block" />
  </div>
);
}
