"use client"

import { useMemo, useState } from "react"
import DOMPurify from "dompurify"

interface RichSynopsisProps {
  html?: string | null
  className?: string
}

export function RichSynopsis({ html, className }: RichSynopsisProps) {
  const [expanded, setExpanded] = useState(false)
  const { sanitizedHtml, preview, hasMore } = useMemo(() => {
    const safeHtml = DOMPurify.sanitize(html || "")
    const plainText = safeHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#0?39;/gi, "'")
    const words = plainText.trim().split(/\s+/).filter(Boolean)
    return {
      sanitizedHtml: safeHtml,
      preview: `${words.slice(0, 100).join(" ")}${words.length > 100 ? "..." : ""}`,
      hasMore: words.length > 100,
    }
  }, [html])

  if (!html) return <p className={className}>No synopsis available for this series.</p>

  return (
    <div className="space-y-3">
      {expanded ? (
        <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      ) : (
        <p className={className}>{preview}</p>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {expanded ? "View Less" : "View More"}
        </button>
      )}
    </div>
  )
}
