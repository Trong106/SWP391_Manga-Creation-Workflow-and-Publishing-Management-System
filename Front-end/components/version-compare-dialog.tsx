"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Activity, AlertTriangle, ArrowLeft, Download, History, Loader2, Sparkles } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PageVersion = {
  pageVersionId: string
  pageId: string
  versionNumber: number
  fileUrl: string
  fileName: string
  uploadedByName: string
  createdAt: string
  note?: string | null
  isCurrent: boolean
}

type ChapterVersionPage = {
  pageId: string
  pageNumber: number
  status: string
  currentImageUrl: string
  changedAfterRevision: boolean
  versions: PageVersion[]
}

type AuditEvent = {
  auditLogId: string
  userName?: string | null
  action: string
  entityType: string
  detailsJson?: string | null
  createdAt: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "page" | "chapter"
  pageId?: string | null
  chapterId?: string | null
  title?: string
  token?: string | null
}

function fullUrl(path?: string | null) {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return `${API_BASE_URL}${path}`
}

function formatDate(value?: string | null) {
  if (!value) return ""
  return new Date(value).toLocaleString()
}

export function VersionCompareDialog({ open, onOpenChange, mode, pageId, chapterId, title, token }: Props) {
  const leftRef = useRef<HTMLDivElement | null>(null)
  const rightRef = useRef<HTMLDivElement | null>(null)
  const syncingRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [pageVersions, setPageVersions] = useState<PageVersion[]>([])
  const [chapterPages, setChapterPages] = useState<ChapterVersionPage[]>([])
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>("")
  const [selectedVersionId, setSelectedVersionId] = useState<string>("")

  useEffect(() => {
    if (!open || !token) return

    const load = async () => {
      setLoading(true)
      try {
        if (mode === "page" && pageId) {
          const res = await fetch(`${API_BASE_URL}/api/pages/${pageId}/versions`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) throw new Error("Failed to load page versions.")
          const versions = await res.json()
          setPageVersions(versions)
          setChapterPages([])
          setAuditEvents([])
          setSelectedVersionId(versions.find((v: PageVersion) => !v.isCurrent)?.pageVersionId || versions[0]?.pageVersionId || "")
        }

        if (mode === "chapter" && chapterId) {
          const [versionRes, auditRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/chapters/${chapterId}/versions`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_BASE_URL}/api/chapters/${chapterId}/audit-timeline`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ])
          if (!versionRes.ok) throw new Error("Failed to load chapter versions.")
          const data = await versionRes.json()
          const pages = data.pages || []
          setChapterPages(pages)
          setPageVersions([])
          setSelectedPageId(pages.find((p: ChapterVersionPage) => p.changedAfterRevision)?.pageId || pages[0]?.pageId || "")
          const audit = auditRes.ok ? await auditRes.json() : []
          setAuditEvents(Array.isArray(audit) ? audit : [])
        }
      } catch (err: any) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [open, token, mode, pageId, chapterId])

  const activePage = useMemo(
    () => chapterPages.find((page) => page.pageId === selectedPageId) || chapterPages[0],
    [chapterPages, selectedPageId]
  )

  const versions = mode === "chapter" ? activePage?.versions || [] : pageVersions
  const currentVersion = versions.find((version) => version.isCurrent) || versions[0]
  const selectedVersion = versions.find((version) => version.pageVersionId === selectedVersionId) || versions.find((version) => !version.isCurrent) || currentVersion

  useEffect(() => {
    if (mode !== "chapter" || !activePage) return
    const fallback = activePage.versions.find((version) => !version.isCurrent) || activePage.versions[0]
    setSelectedVersionId(fallback?.pageVersionId || "")
  }, [activePage?.pageId, mode])

  const syncScroll = (source: "left" | "right") => {
    if (syncingRef.current) return
    const from = source === "left" ? leftRef.current : rightRef.current
    const to = source === "left" ? rightRef.current : leftRef.current
    if (!from || !to) return
    syncingRef.current = true
    to.scrollTop = from.scrollTop
    to.scrollLeft = from.scrollLeft
    window.setTimeout(() => {
      syncingRef.current = false
    }, 40)
  }

  const downloadVersion = (version?: PageVersion) => {
    if (!version?.fileUrl) return
    const a = document.createElement("a")
    a.href = fullUrl(version.fileUrl)
    a.download = version.fileName || `page-v${version.versionNumber}`
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!open) return null

  return (
    <section className="flex h-[calc(100vh-5rem)] min-h-[720px] w-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-[#0b0c0d] text-white">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <History className="h-5 w-5 text-[#00dfc0]" />
            {title || (mode === "chapter" ? "Chapter Versions" : "Page Versions")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Compare an older version on the left with the latest version on the right. Both panes scroll together.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="border-zinc-800 bg-[#121416] text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#00dfc0]" />
          Loading version history...
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-h-0 space-y-4 overflow-y-auto border-r border-zinc-800 bg-[#121416] p-4">
            {mode === "chapter" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Pages</p>
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-2">
                  {chapterPages.map((page) => (
                    <button
                      key={page.pageId}
                      onClick={() => setSelectedPageId(page.pageId)}
                      className={`relative rounded border p-2 text-left text-xs transition-colors ${
                        activePage?.pageId === page.pageId
                          ? "border-[#00dfc0] bg-[#00dfc0]/10 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      Page {page.pageNumber}
                      {page.changedAfterRevision && (
                        <Badge className="mt-1 w-full justify-center bg-amber-500 text-black">
                          <Sparkles className="mr-1 h-3 w-3" />
                          Changed
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Compare Version</p>
              <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                <SelectTrigger className="border-zinc-800 bg-zinc-950 text-xs text-white">
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-950 text-white">
                  {versions.map((version) => (
                    <SelectItem key={version.pageVersionId} value={version.pageVersionId}>
                      v{version.versionNumber} {version.isCurrent ? "(current)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="border-zinc-800 text-zinc-300" onClick={() => downloadVersion(selectedVersion)}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Left
              </Button>
              <Button size="sm" variant="outline" className="border-zinc-800 text-zinc-300" onClick={() => downloadVersion(currentVersion)}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Latest
              </Button>
            </div>

            {mode === "chapter" && (
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <Activity className="h-3.5 w-3.5" />
                  Audit Timeline
                </p>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {auditEvents.map((event) => (
                    <div key={event.auditLogId} className="rounded border border-zinc-800 bg-zinc-950 p-2 text-xs">
                      <p className="font-semibold text-zinc-200">{event.action.replaceAll("_", " ")}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">{event.userName || "System"} - {formatDate(event.createdAt)}</p>
                    </div>
                  ))}
                  {auditEvents.length === 0 && (
                    <div className="rounded border border-dashed border-zinc-800 p-3 text-center text-xs text-zinc-600">
                      No audit events recorded for this chapter yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          {versions.length === 0 ? (
            <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-500">
              <AlertTriangle className="mr-2 h-5 w-5" />
              No versions available.
            </div>
          ) : (
            <div className="grid min-h-0 gap-0 md:grid-cols-2">
              <div className="min-h-0 border-r border-zinc-800 bg-zinc-950">
                <div className="flex min-h-12 items-center justify-between border-b border-zinc-800 px-4 py-2 text-sm text-zinc-300">
                  <span className="font-semibold">Selected v{selectedVersion?.versionNumber}</span>
                  <span className="text-xs text-zinc-500">{selectedVersion?.uploadedByName}</span>
                </div>
                <div ref={leftRef} onScroll={() => syncScroll("left")} className="h-[calc(100vh-211px)] overflow-auto bg-[#050607] p-4">
                  <img src={fullUrl(selectedVersion?.fileUrl)} alt="Selected version" className="mx-auto h-auto w-full max-w-[980px] object-contain" />
                </div>
              </div>
              <div className="min-h-0 bg-zinc-950">
                <div className="flex min-h-12 items-center justify-between border-b border-[#00dfc0]/30 px-4 py-2 text-sm text-zinc-300">
                  <span className="font-semibold text-[#00dfc0]">Latest v{currentVersion?.versionNumber}</span>
                  <span className="text-xs text-zinc-500">{currentVersion?.uploadedByName}</span>
                </div>
                <div ref={rightRef} onScroll={() => syncScroll("right")} className="h-[calc(100vh-211px)] overflow-auto bg-[#050607] p-4">
                  <img src={fullUrl(currentVersion?.fileUrl)} alt="Latest version" className="mx-auto h-auto w-full max-w-[980px] object-contain" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
