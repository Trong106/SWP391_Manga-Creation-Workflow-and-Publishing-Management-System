"use client"

import DOMPurify from "dompurify"

interface RichSynopsisProps {
  html?: string | null
  className?: string
}

export function RichSynopsis({ html, className }: RichSynopsisProps) {
  if (!html) return <p className={className}>No synopsis available for this series.</p>
  return <div className={className} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
}
