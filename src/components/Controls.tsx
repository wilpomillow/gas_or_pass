"use client";

import type { CardGuess } from "@/lib/types";
import { XCircle, CheckCircle2 } from "lucide-react";

type Props = {
  onPick: (g: CardGuess) => void;
};

export default function Controls({ onPick }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onPick("no")}
        className="white-border-extrathin rounded-3xl bg-[#fdba74]/40 py-4 text-2xl font-extrabold hover:bg-[#fdba74]/50 flex items-center justify-center gap-2 text-[#8F5D42] outline-white-extrathin"
      >
        <XCircle className="h-6 w-6" />
        PASS
      </button>

      <button
        onClick={() => onPick("yes")}
        className="white-border-extrathin rounded-3xl bg-[#fdba74]/95 py-4 text-2xl font-extrabold text-[#2c1812] hover:bg-[#fed7aa] flex items-center justify-center gap-2 text-[#8F5D42] outline-white-extrathin"
      >
        <CheckCircle2 className="h-6 w-6" />
        GAS
      </button>
    </div>
  );
}
