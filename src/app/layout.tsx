// src/app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"
import { Fredoka } from "next/font/google"

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
})

export const metadata: Metadata = {
  title: "Gas or Pass",
  description: "Game by Wilpo Millow",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} dark`}>
      <body className="font-[var(--font-fredoka)]">{children}</body>
    </html>
  )
}
