// src/components/InterstitialCard.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import type { InterstitialCard as InterstitialCardType } from "@/lib/injectInterstitialCards"

export default function InterstitialCard({ card }: { card: InterstitialCardType }) {
  return (
    <div className="w-full max-w-[520px]">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <Link href={card.href} target="_blank" rel="noreferrer" className="block">
          <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
            {card.title}
          </h2>
        </Link>

        <div className="mt-4 overflow-hidden rounded-xl border bg-white">
          <Link href={card.href} target="_blank" rel="noreferrer" className="block">
            <motion.div
              // “shake in intervals”
              animate={{
                rotate: [0, -2.5, 2.5, -2.5, 2.5, 0],
                x: [0, -2, 2, -2, 2, 0],
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 3.2, // <-- interval gap
              }}
            >
              <Image
                src={card.imageSrc}
                alt="Who Gives A Crap toilet paper"
                width={1600}
                height={900}
                className="h-auto w-full"
                priority={false}
              />
            </motion.div>
          </Link>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Sponsored interruption. Click if you dare.
        </p>
      </div>
    </div>
  )
}
