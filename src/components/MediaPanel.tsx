// src/components/MediaPanel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AudioVisualizer from "./AudioVisualizer";
import { RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  videoSrc?: string | null;
  start?: number | null; // seconds
  end?: number | null; // seconds
  autoPlayAudio?: boolean;
  autoPlayVideo?: boolean;
  showVideo?: boolean;
};

function clampSegment(start: number | null, end: number | null) {
  const s = typeof start === "number" && Number.isFinite(start) ? Math.max(0, start) : 0;
  const e = typeof end === "number" && Number.isFinite(end) && end > s ? end : s + 2.0;
  return { s, e };
}

function seekTo(el: HTMLMediaElement, t: number) {
  return new Promise<void>((resolve) => {
    const onSeeked = () => {
      el.removeEventListener("seeked", onSeeked);
      resolve();
    };
    el.addEventListener("seeked", onSeeked, { once: true });
    try {
      el.currentTime = t;
    } catch {
      el.removeEventListener("seeked", onSeeked);
      resolve();
    }
  });
}

async function ensureMetadata(v: HTMLMediaElement) {
  // HAVE_METADATA = 1
  if ((v as any).readyState >= 1) return;
  await new Promise<void>((resolve) => {
    const onLoaded = () => resolve();
    v.addEventListener("loadedmetadata", onLoaded, { once: true });
  });
}

export default function MediaPanel({
  videoSrc,
  start,
  end,
  autoPlayAudio,
  autoPlayVideo,
  showVideo,
}: Props) {
  const audioVideoRef = useRef<HTMLVideoElement | null>(null); // hidden: drives audio
  const revealVideoRef = useRef<HTMLVideoElement | null>(null); // visible: reveal clip

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);

  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  const canVideo = Boolean(videoSrc);
  const inReveal = Boolean(showVideo);

  const [showListenHint, setShowListenHint] = useState(false);
  const listenTimerRef = useRef<number | null>(null);

  const { s: clipStart, e: clipEnd } = useMemo(() => clampSegment(start ?? null, end ?? null), [start, end]);

  const ensureAnalyser = async () => {
    const v = audioVideoRef.current;
    if (!v) return;

    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = ctxRef.current;

    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.92;
      analyserRef.current = analyser;
    }

    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(v);
      sourceRef.current.connect(analyserRef.current!);
      analyserRef.current!.connect(ctx.destination);
    }

    if (ctx.state === "suspended") await ctx.resume();
  };

  // LISTEN hint (guess only)
  useEffect(() => {
    if (showVideo) return;

    if (listenTimerRef.current) {
      window.clearTimeout(listenTimerRef.current);
      listenTimerRef.current = null;
    }

    setShowListenHint(true);
    listenTimerRef.current = window.setTimeout(() => {
      setShowListenHint(false);
      listenTimerRef.current = null;
    }, 850);

    return () => {
      if (listenTimerRef.current) {
        window.clearTimeout(listenTimerRef.current);
        listenTimerRef.current = null;
      }
    };
  }, [showVideo, videoSrc, clipStart, clipEnd]);

  // AUDIO: enforce segment end (start → end)
  useEffect(() => {
    const v = audioVideoRef.current;
    if (!v) return;

    const onPlay = () => {
      setAudioEnded(false);
      setAudioPlaying(true);
    };
    const onPause = () => setAudioPlaying(false);
    const onEnded = () => {
      setAudioPlaying(false);
      setAudioEnded(true);
    };
    const onTime = () => {
      if (v.currentTime >= clipEnd - 0.04) {
        v.pause();
        setAudioPlaying(false);
        setAudioEnded(true);
      }
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTime);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTime);
    };
  }, [clipEnd]);

  // VIDEO: play from start → end of file (NO clipEnd enforcement)
  useEffect(() => {
    if (!showVideo) return;
    const v = revealVideoRef.current;
    if (!v) return;

    const onPlay = () => {
      setVideoEnded(false);
      setVideoPlaying(true);
    };
    const onPause = () => setVideoPlaying(false);
    const onEnded = () => {
      setVideoPlaying(false);
      setVideoEnded(true);
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
    };
  }, [showVideo]);

  const playAudio = async () => {
    if (!canVideo) return;
    const v = audioVideoRef.current;
    if (!v) return;

    try {
      await ensureAnalyser();
      await ensureMetadata(v);
      await seekTo(v, clipStart);
      await v.play();
    } catch {}
  };

  const replayAudio = async () => {
    if (!canVideo) return;
    const v = audioVideoRef.current;
    if (!v) return;

    try {
      v.pause();
      await playAudio();
    } catch {}
  };

  const playVideo = async () => {
    if (!canVideo || !showVideo) return;
    const v = revealVideoRef.current;
    if (!v) return;

    try {
      await ensureMetadata(v);
      v.pause();
      // v.currentTime = clipStart;
      v.currentTime = 0;
      await v.play();
    } catch {}
  };

  useEffect(() => {
    if (autoPlayAudio) playAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayAudio, videoSrc, clipStart, clipEnd]);

  useEffect(() => {
    if (!autoPlayVideo || !showVideo) return;
    playVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVideo, videoSrc, clipStart]);

  const audioVariant = showVideo ? "wide" : "square";

  const audioBlock = useMemo(() => {
    if (!canVideo) {
      return (
        <div className="rounded-3xl bg-white/10 p-5 white-border text-sm text-white/85">
          <div className="font-bold">No video yet</div>
        </div>
      );
    }

    const showReplay = !audioPlaying && (inReveal || audioEnded);

    return (
      <div className="space-y-0">
        <div className="relative">
          <AudioVisualizer analyser={analyserRef.current} active={audioPlaying} variant={audioVariant as any} />

          <AnimatePresence>
            {!showVideo && showListenHint ? (
              <motion.div
                key="listen-hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }}
                exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }}
                className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
              >
                <div className="white-border rounded-full bg-white/18 px-7 py-2 text-2xl md:text-3xl font-extrabold uppercase text-white">
                  LISTEN
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <button
            onClick={replayAudio}
            className={[
              "absolute inset-[7px] z-30 flex items-center justify-center rounded-[22px]",
              showReplay ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
            ].join(" ")}
            aria-label="Replay audio"
            title="Replay audio"
          >
            <span className="white-border relative h-16 w-16 rounded-3xl bg-white/14 hover:bg-white/20 grid place-items-center">
              <RotateCcw className="h-7 w-7 text-white" />
            </span>
          </button>
        </div>

        <video ref={audioVideoRef} src={videoSrc ?? undefined} preload="auto" playsInline className="hidden" />
      </div>
    );
  }, [canVideo, audioPlaying, audioEnded, audioVariant, inReveal, showVideo, showListenHint, videoSrc]);

  const videoBlock = useMemo(() => {
    if (!showVideo) return null;

    if (!canVideo) {
      return (
        <div className="rounded-3xl bg-white/10 p-5 white-border text-sm text-white/85">
          <div className="font-bold">No video yet</div>
        </div>
      );
    }

    return (
      <div className="space-y-0">
        <div className="relative rounded-3xl bg-white/8 p-3 white-border overflow-hidden">
          <video
            ref={revealVideoRef}
            src={videoSrc ?? undefined}
            controls
            playsInline
            className="h-[160px] md:h-[180px] w-full rounded-2xl object-cover"
          />
        </div>
      </div>
    );
  }, [canVideo, videoSrc, showVideo]);

  return <div className="space-y-5">{audioBlock}{videoBlock}</div>;
}
