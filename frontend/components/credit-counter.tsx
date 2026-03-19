"use client"

import { useEffect, useState } from "react"
import { fetchCredits } from "@/lib/api-generate"

export default function CreditCounter() {

  const [credits, setCredits] = useState<number | null>(null)

  async function loadCredits() {
    try {
      const res = await fetchCredits()
      setCredits(res.credits_remaining)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {

    fetchCredits()

    const interval = setInterval(loadCredits, 5000)

    return () => clearInterval(interval)

  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 shadow-lg text-sm font-semibold border-4 rounded-full">
      💰 {credits ?? "..."}
    </div>
  )
}