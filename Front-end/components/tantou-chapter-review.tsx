"use client"

import { type MouseEvent, useEffect, useMemo, useState } from "react"
import { AlertTriangle, BookOpen, Check, CheckCircle2, History, Loader2, MessageSquare, MousePointer2, Pencil, Square, X } from "lucide-react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { VersionCompareDialog } from "@/components/version-compare-dialog"

type Annotation = {
  id: string
  x: number
  y: number
  width?: number | null
  height?: number | null
  body: string
  status: string
}

type ReviewPageItem = {
  id: string
  number: number
  status: string
  imageUrl?: string | null
  annotations: Annotation[]
}

type ReviewChapter = {
  chapterId: string
  chapterNumber: number
  title?: string | null
  status: string
  dueDate?: string | null
  submittedForPublishingAt?: string | null
  tantouReviewNote?: string | null
  seriesTitle: string
  author: string
  coverImageUrl?: string | null
  pageCount: number
  pages: ReviewPageItem[]
}

type DraftAnnotation = {
  pageId: string
  x: number
  y: number
  width?: number
  height?: number
}

const statusColor: Record<string, string> = {
  tantou_review: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  revision_requested: "border-orange-500/30 bg-orange-500/15 text-orange-300",
  editorial_ready: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
}

function fullUrl(path?: string | null) {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return `${API_BASE_URL}${path}`
}

export function TantouChapterReview() {
  const { token, role, loading: authLoading, logout } = useAuth()
  const [chapters, setChapters] = useState<ReviewChapter[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tool, setTool] = useState<"pin" | "box">("box")
  const [dragStart, setDragStart] = useState<{ x: number; y: number; pageId: string } | null>(null)
  const [draftAnnotation, setDraftAnnotation] = useState<DraftAnnotation | null>(null)
  const [annotationText, setAnnotationText] = useState("")
  const [reviewNote, setReviewNote] = useState("")
  const [savingAnnotation, setSavingAnnotation] = useState(false)
  const [submittingDecision, setSubmittingDecision] = useState(false)
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)

  const refreshSidebarBadges = () => {
    window.dispatchEvent(new Event("mangaflow:badges-refresh"))
  }

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.chapterId === selectedId) ?? chapters[0],
    [chapters, selectedId]
  )

  const fetchQueue = async () => {
    if (!token) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/data/chapter-review-queue`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        logout()
        return
      }

      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to load chapter review queue.")
      }

      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setChapters(list)
      setSelectedId((current) =>
        current && list.some((chapter) => chapter.chapterId === current)
          ? current
          : list[0]?.chapterId ?? null
      )
    } catch (err: any) {
      setError(err.message || "Could not load Tantou review queue.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && role === "tantou") {
      fetchQueue()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [token, role, authLoading])

  const measurePoint = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    }
  }

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>, pageId: string) => {
    const point = measurePoint(event)
    if (tool === "pin") {
      setDraftAnnotation({ pageId, x: point.x, y: point.y, width: 0, height: 0 })
      return
    }
    setDragStart({ ...point, pageId })
  }

  const handleMouseUp = (event: MouseEvent<HTMLDivElement>, pageId: string) => {
    if (tool !== "box" || !dragStart || dragStart.pageId !== pageId) return

    const point = measurePoint(event)
    const x = Math.min(dragStart.x, point.x)
    const y = Math.min(dragStart.y, point.y)
    const width = Math.abs(point.x - dragStart.x)
    const height = Math.abs(point.y - dragStart.y)

    setDraftAnnotation({
      pageId,
      x,
      y,
      width: Math.max(width, 2),
      height: Math.max(height, 2),
    })
    setDragStart(null)
  }

  const saveAnnotation = async () => {
    if (!token || !draftAnnotation || !annotationText.trim()) return
    setSavingAnnotation(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/pages/${draftAnnotation.pageId}/annotations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          x: draftAnnotation.x,
          y: draftAnnotation.y,
          width: draftAnnotation.width,
          height: draftAnnotation.height,
          body: annotationText.trim(),
        }),
      })

      if (!res.ok) throw new Error("Failed to save annotation.")
      const created = await res.json()

      setChapters((current) =>
        current.map((chapter) => ({
          ...chapter,
          pages: chapter.pages.map((page) =>
            page.id === draftAnnotation.pageId
              ? { ...page, annotations: [...(page.annotations || []), created] }
              : page
          ),
        }))
      )
      setDraftAnnotation(null)
      setAnnotationText("")
    } catch (err: any) {
      alert(err.message || "Could not save annotation.")
    } finally {
      setSavingAnnotation(false)
    }
  }

  const submitDecision = async (decision: "approved" | "revision_requested") => {
    if (!token || !selectedChapter) return
    const readyPages = selectedChapter.pages.filter((page) => page.status === "approved").length
    const canApproveChapter = selectedChapter.pages.length > 0 && readyPages === selectedChapter.pages.length
    if (decision === "approved" && !canApproveChapter) {
      alert("This chapter still has pages that are not approved by Mangaka. Request revision or wait until pages are approved again.")
      return
    }
    if (decision === "revision_requested" && !reviewNote.trim()) {
      alert("Please add a review note before requesting revision.")
      return
    }

    setSubmittingDecision(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/chapters/${selectedChapter.chapterId}/tantou-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          note: reviewNote.trim() || (decision === "approved" ? "Chapter content approved." : "Revision requested."),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Failed to submit chapter decision.")
      }

      await fetchQueue()
      refreshSidebarBadges()
      setReviewNote("")
      setDraftAnnotation(null)
      setAnnotationText("")
    } catch (err: any) {
      alert(err.message || "Could not submit review decision.")
    } finally {
      setSubmittingDecision(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-white">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#00dfc0]" />
        <p className="text-sm text-zinc-400">Loading chapters for Tantou review...</p>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-white">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#00dfc0]" />
        <p className="text-sm text-zinc-400">Checking access...</p>
      </div>
    )
  }

  if (!token || role !== "tantou") {
    return (
      <Card className="border-red-950 bg-red-950/20">
        <CardContent className="flex items-center gap-3 p-5 text-red-300">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">Chapter Review is only available for Tantou Editor.</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-950 bg-red-950/20">
        <CardContent className="flex items-center gap-3 p-5 text-red-300">
          <AlertTriangle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </CardContent>
      </Card>
    )
  }

  if (!selectedChapter) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-[#101214] text-center">
        <BookOpen className="mb-4 h-12 w-12 text-zinc-700" />
        <h1 className="text-xl font-semibold text-white">No chapters waiting for content review</h1>
        <p className="mt-2 text-sm text-zinc-500">Mangaka-submitted chapters will appear here after page production is approved.</p>
      </div>
    )
  }

  if (versionDialogOpen) {
    return (
      <VersionCompareDialog
        open={versionDialogOpen}
        onOpenChange={setVersionDialogOpen}
        mode="chapter"
        chapterId={selectedChapter.chapterId}
        title={`Chapter ${selectedChapter.chapterNumber} Versions`}
        token={token}
      />
    )
  }

  const approvedPageCount = selectedChapter.pages.filter((page) => page.status === "approved").length
  const canApproveChapter = selectedChapter.pages.length > 0 && approvedPageCount === selectedChapter.pages.length

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside className="space-y-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <BookOpen className="h-7 w-7 text-[#00dfc0]" />
            Chapter Review
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Content-level review for Tantou Editor</p>
        </div>

        <div className="space-y-2">
          {chapters.map((chapter) => (
            <button
              key={chapter.chapterId}
              onClick={() => {
                setSelectedId(chapter.chapterId)
                setDraftAnnotation(null)
                setAnnotationText("")
                setReviewNote(chapter.tantouReviewNote || "")
              }}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                chapter.chapterId === selectedChapter.chapterId
                  ? "border-[#00dfc0]/50 bg-[#00dfc0]/10"
                  : "border-zinc-800 bg-[#151719] hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{chapter.seriesTitle}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">Chapter {chapter.chapterNumber}{chapter.title ? `: ${chapter.title}` : ""}</p>
                </div>
                <Badge variant="outline" className={statusColor[chapter.status] || "border-zinc-700 text-zinc-300"}>
                  {chapter.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-zinc-500">{chapter.pageCount} pages by {chapter.author}</p>
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0 overflow-hidden rounded-lg border border-[#1A1D1F] bg-[#0B0C0D]">
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1D1F] bg-[#121416]/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-white">{selectedChapter.seriesTitle}</h2>
            <p className="text-xs font-medium text-[#00dfc0]">
              Chapter {selectedChapter.chapterNumber}{selectedChapter.title ? `: ${selectedChapter.title}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setVersionDialogOpen(true)}
              className="border-zinc-800 bg-[#121416] text-zinc-300"
            >
              <History className="mr-1.5 h-4 w-4" />
              Chapter Versions
            </Button>
            <Button
              size="sm"
              variant={tool === "pin" ? "default" : "outline"}
              onClick={() => setTool("pin")}
              className={tool === "pin" ? "bg-[#00dfc0] text-black hover:bg-[#00dfc0]/90" : "border-zinc-800 bg-[#121416] text-zinc-300"}
            >
              <MousePointer2 className="mr-1.5 h-4 w-4" />
              Pin
            </Button>
            <Button
              size="sm"
              variant={tool === "box" ? "default" : "outline"}
              onClick={() => setTool("box")}
              className={tool === "box" ? "bg-[#00dfc0] text-black hover:bg-[#00dfc0]/90" : "border-zinc-800 bg-[#121416] text-zinc-300"}
            >
              <Square className="mr-1.5 h-4 w-4" />
              Area
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center py-4">
          <div className="flex w-full max-w-4xl flex-col items-center">
            {selectedChapter.pages.map((page) => (
              <div
                key={page.id}
                className="group relative flex w-full flex-col items-center"
                onMouseDown={(event) => handleMouseDown(event, page.id)}
                onMouseUp={(event) => handleMouseUp(event, page.id)}
              >
                {page.imageUrl ? (
                  <img
                    src={fullUrl(page.imageUrl)}
                    alt={`Page ${page.number}`}
                    className="h-auto w-full select-none border-b border-[#121416] object-contain"
                    draggable={false}
                  />
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center border-b border-[#121416] bg-zinc-950 text-zinc-600">
                    Page {page.number}
                  </div>
                )}

                {page.annotations?.map((annotation, index) => {
                  const isBox = annotation.width && annotation.height
                  return (
                    <div
                      key={annotation.id}
                      title={annotation.body}
                      className={isBox ? "absolute border-2 border-amber-400 bg-amber-300/15" : "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-black shadow"}
                      style={{
                        left: `${annotation.x}%`,
                        top: `${annotation.y}%`,
                        width: isBox ? `${annotation.width}%` : undefined,
                        height: isBox ? `${annotation.height}%` : undefined,
                      }}
                    >
                      {!isBox && index + 1}
                    </div>
                  )
                })}

                {draftAnnotation?.pageId === page.id && (
                  <div
                    className={draftAnnotation.width ? "absolute border-2 border-[#00dfc0] bg-[#00dfc0]/15" : "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#00dfc0] text-xs font-bold text-black"}
                    style={{
                      left: `${draftAnnotation.x}%`,
                      top: `${draftAnnotation.y}%`,
                      width: draftAnnotation.width ? `${draftAnnotation.width}%` : undefined,
                      height: draftAnnotation.height ? `${draftAnnotation.height}%` : undefined,
                    }}
                  />
                )}

                <div className="absolute bottom-3 right-4 rounded bg-black/75 px-2.5 py-1 text-[10px] font-mono text-zinc-300 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  Page {page.number} / {selectedChapter.pages.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <aside className="space-y-4">
        <Card className="border-zinc-800 bg-[#1e2022] text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Review Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
              <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-zinc-500">Pages</p>
                <p className="mt-1 text-lg font-bold text-white">{selectedChapter.pageCount}</p>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-zinc-500">Ready Pages</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {approvedPageCount}/{selectedChapter.pages.length}
                </p>
              </div>
            </div>

            {!canApproveChapter && (
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
                This chapter still contains pages that are not approved by Mangaka. Tantou can request revision now, but approval is locked until all pages return to approved status.
              </div>
            )}

            <Textarea
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Write chapter-level content note, dialogue issue, or required changes..."
              className="min-h-[120px] border-zinc-800 bg-zinc-950 text-sm text-white placeholder:text-zinc-600"
            />

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => submitDecision("revision_requested")}
                disabled={submittingDecision}
                variant="outline"
                className="h-auto min-h-11 min-w-0 px-2 py-2 text-xs leading-tight whitespace-normal border-orange-500/30 text-orange-300 hover:bg-orange-500/10"
              >
                <X className="mr-1 h-4 w-4 shrink-0" />
                <span className="min-w-0 text-center">Request Revision</span>
              </Button>
              <Button
                onClick={() => submitDecision("approved")}
                disabled={submittingDecision || !canApproveChapter}
                title={!canApproveChapter ? "All pages must be approved before chapter approval." : undefined}
                className="h-auto min-h-11 min-w-0 px-2 py-2 text-xs font-bold leading-tight whitespace-normal bg-[#00dfc0] text-black hover:bg-[#00dfc0]/90"
              >
                <Check className="mr-1 h-4 w-4 shrink-0" />
                <span className="min-w-0 text-center">Approve Chapter</span>
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              Approval sends the chapter to Editorial scheduling. Revision keeps it with Mangaka until content issues are resolved.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-[#1e2022] text-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Pencil className="h-4 w-4 text-[#00dfc0]" />
              Mark Required Change
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {draftAnnotation ? (
              <>
                <div className="rounded border border-[#00dfc0]/30 bg-[#00dfc0]/10 p-3 text-xs text-zinc-300">
                  Selected point on page. Add a note and save it as an annotation.
                </div>
                <Textarea
                  value={annotationText}
                  onChange={(event) => setAnnotationText(event.target.value)}
                  placeholder="Describe the exact content/dialogue/art correction..."
                  className="min-h-[92px] border-zinc-800 bg-zinc-950 text-sm text-white placeholder:text-zinc-600"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                    onClick={() => {
                      setDraftAnnotation(null)
                      setAnnotationText("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={savingAnnotation || !annotationText.trim()}
                    onClick={saveAnnotation}
                    className="flex-1 bg-[#00dfc0] font-bold text-black hover:bg-[#00dfc0]/90"
                  >
                    {savingAnnotation ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Mark"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
                Choose Pin or Area, then click or drag directly on a manga page.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-[#1e2022] text-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-amber-300" />
              Open Marks
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[320px] space-y-3 overflow-y-auto">
            {selectedChapter.pages.flatMap((page) =>
              (page.annotations || []).map((annotation) => (
                <div key={annotation.id} className="rounded border border-zinc-800 bg-zinc-950/50 p-3 text-xs">
                  <div className="mb-1 flex items-center justify-between gap-2 text-zinc-500">
                    <span>Page {page.number}</span>
                    {annotation.status === "resolved" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-300">open</Badge>
                    )}
                  </div>
                  <p className="leading-relaxed text-zinc-300">{annotation.body}</p>
                </div>
              ))
            )}
            {selectedChapter.pages.every((page) => !page.annotations?.length) && (
              <p className="py-6 text-center text-xs text-zinc-600">No marks added yet.</p>
            )}
          </CardContent>
        </Card>
      </aside>

    </div>
  )
}
