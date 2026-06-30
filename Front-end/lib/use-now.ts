"use client"

import { useEffect, useState } from "react"

export function useNow(refreshMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const update = () => setNow(Date.now())
    const interval = window.setInterval(update, refreshMs)
    window.addEventListener("focus", update)
    document.addEventListener("visibilitychange", update)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("focus", update)
      document.removeEventListener("visibilitychange", update)
    }
  }, [refreshMs])

  return now
}
