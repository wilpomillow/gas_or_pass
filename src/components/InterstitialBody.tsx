// src/components/InterstitialBody.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

type Props = {
  title: string;
  href: string;
  imageSrc: string;
};

export default function InterstitialBody({ title, href, imageSrc }: Props) {
  return (
    <div className="space-y-4">
      <Link
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block text-center text-2xl md:text-3xl font-extrabold tracking-tight text-white outline-white-thin"
      >
        {title}
      </Link>

      <Link href={href} target="_blank" rel="noreferrer" className="block">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10">
          <motion.div
            animate={{
              rotate: [0, -2.5, 2.5, -2.5, 2.5, 0],
              x: [0, -2, 2, -2, 2, 0],
            }}
            transition={{
              duration: 0.6,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 3.2,
            }}
          >
            <Image
              src={imageSrc}
              alt="Who Gives A Crap toilet paper"
              width={1600}
              height={900}
              className="h-auto w-full"
            />
          </motion.div>
        </div>
      </Link>

      <p className="text-center text-sm text-white/70">A sponsored interruption.</p>
    </div>
  );
}
