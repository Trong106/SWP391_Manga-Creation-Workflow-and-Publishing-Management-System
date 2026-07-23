"use client"

import { useState, useEffect, type PointerEvent } from "react"
import { Eye, Check, CheckCheck, X, MessageSquare, ChevronLeft, ChevronRight, Pencil, ArrowLeft, BookOpen, Clock, History, MousePointer2, Square, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { TantouChapterReview } from "@/components/tantou-chapter-review"
import { VersionCompareDialog } from "@/components/version-compare-dialog"
import { formatRelativeTime } from "@/lib/date-time"
import { useNow } from "@/lib/use-now"

export default function ReviewPage() {
  const { role } = useAuth()

  if (role === "tantou") {
    return <TantouChapterReview />
  }

  return <MangakaReviewPage />
}

function MangakaReviewPage() {
  const { token } = useAuth()
  
  // Navigation & selection state
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null)
  const [activeSeriesTitle, setActiveSeriesTitle] = useState("")
  
  // Data states
  const [reviewSeries, setReviewSeries] = useState<any[]>([])
  const [loadingQueue, setLoadingQueue] = useState(true)
  
  const [pages, setPages] = useState<any[]>([])
  const [loadingPages, setLoadingPages] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  
  // Chapter filter inside selected series
  const [chapters, setChapters] = useState<string[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("all")
  
  // Interaction states
  const [annotationMode, setAnnotationMode] = useState(false)
  const [comment, setComment] = useState("")
  const [bulkApproving, setBulkApproving] = useState(false)
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [versionMode, setVersionMode] = useState<"page" | "chapter">("page")
  const [bulkApproveConfirmOpen, setBulkApproveConfirmOpen] = useState(false)
  const [bulkApproveTargetCount, setBulkApproveTargetCount] = useState(0)
  const now = useNow()

  const refreshSidebarBadges = () => {
    window.dispatchEvent(new Event("mangaflow:badges-refresh"))
  }

  // Fetch the Review Series queue (Screen 1)
  const fetchQueue = () => {
    if (!token) return

    setLoadingQueue(true)
    fetch(`${API_BASE_URL}/api/data/review-series`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviewSeries(data)
        }
        setLoadingQueue(false)
      })
      .catch((err) => {
        console.error("Error fetching review queue:", err)
        setLoadingQueue(false)
      })
  }

  useEffect(() => {
    fetchQueue()
  }, [token])

  // Fetch pages when a series is selected (Screen 2)
  useEffect(() => {
    if (activeSeriesId && token) {
      setLoadingPages(true)
      fetch(`${API_BASE_URL}/api/data/review-pages`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Lọc các trang thuộc series đang chọn
            const seriesPages = data.filter((p: any) => p.seriesId === activeSeriesId)
            setPages(seriesPages)
            setCurrentPageIndex(0)

            // Lấy danh sách chapter phân biệt để lọc
            const uniqueChapters = Array.from(new Set(seriesPages.map((p: any) => p.chapterNumber.toString())))
            setChapters(uniqueChapters)
            setSelectedChapter("all")
          }
          setLoadingPages(false)
        })
        .catch((err) => {
          console.error("Error fetching review pages:", err)
          setLoadingPages(false)
        })
    }
  }, [activeSeriesId, token])

  // Filter pages by chapter dropdown
  const displayedPages = selectedChapter === "all"
    ? pages
    : pages.filter((p) => p.chapterNumber.toString() === selectedChapter)

  const activePage = displayedPages[currentPageIndex]

  const getFullCoverUrl = (coverPath?: string) => {
    if (!coverPath) return ""
    if (coverPath.startsWith("http")) return coverPath
    return `${API_BASE_URL}${coverPath}`
  }


  // Handle page approval
  const handleApprovePage = async () => {
    if (!activePage || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/pages/${activePage.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ decision: "approved", note: "Page approved" })
      })
      if (res.ok) {
        toast.success("Page approved successfully!")
        // Refresh pages
        const updated = pages.filter((p) => p.id !== activePage.id)
        setPages(updated)
        setCurrentPageIndex((current) => Math.min(current, Math.max(updated.length - 1, 0)))
        refreshSidebarBadges()
      } else {
        toast.error("Failed to approve page")
      }
    } catch (err) {
      console.error(err)
      toast.error("Server connection error")
    }
  }

  const handleBulkApproveDisplayed = async () => {
    setBulkApproveConfirmOpen(false)
    const targets = displayedPages.filter((p) => p.status !== "approved")
    if (targets.length === 0) return

    setBulkApproving(true)
    try {
      const results = await Promise.all(targets.map((page) =>
        fetch(`${API_BASE_URL}/api/pages/${page.id}/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ decision: "approved", note: "Bulk approved from Review Pages" })
        })
      ))

      const failed = results.filter((res) => !res.ok).length
      const approvedIds = new Set(targets.filter((_, index) => results[index].ok).map((page) => page.id))
      setPages((current) => {
        const updated = current.filter((page) => !approvedIds.has(page.id))
        setCurrentPageIndex((index) => Math.min(index, Math.max(updated.length - 1, 0)))
        return updated
      })
      refreshSidebarBadges()
      if (failed) {
        toast.error(`Bulk approve completed with ${failed} failed page(s).`)
      } else {
        toast.success("All pages approved successfully!")
      }
    } catch (err) {
      console.error(err)
      toast.error("Connection error while bulk approving pages.")
    } finally {
      setBulkApproving(false)
    }
  }

  // Handle request revision
  const handleRequestRevision = async () => {
    if (!activePage || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/pages/${activePage.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ decision: "revision_requested", note: "Revision requested" })
      })
      if (res.ok) {
        toast.success("Revision requested successfully!")
        const updated = pages.filter((p) => p.id !== activePage.id)
        setPages(updated)
        setCurrentPageIndex((current) => Math.min(current, Math.max(updated.length - 1, 0)))
        refreshSidebarBadges()
      } else {
        toast.error("Failed to request revision")
      }
    } catch (err) {
      console.error(err)
      toast.error("Server connection error")
    }
  }

  const [tool, setTool] = useState<"pin" | "box">("box")
  const [dragStart, setDragStart] = useState<{ x: number; y: number; pageId: string; pointerId: number } | null>(null)
  const [draftAnnotation, setDraftAnnotation] = useState<any | null>(null)
  const [annotationText, setAnnotationText] = useState("")
  const [savingAnnotation, setSavingAnnotation] = useState(false)
  const [annotationDialogOpen, setAnnotationDialogOpen] = useState(false)
  const [deletingAnnotationId, setDeletingAnnotationId] = useState<string | null>(null)

  const measurePoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100)),
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>, pageId: string) => {
    if (event.button !== 0) return
    const point = measurePoint(event)
    if (tool === "pin") {
      setDraftAnnotation({ pageId, x: point.x, y: point.y, width: 0, height: 0 })
      setAnnotationDialogOpen(true)
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragStart({ ...point, pageId, pointerId: event.pointerId })
    setDraftAnnotation({ pageId, x: point.x, y: point.y, width: 0, height: 0 })
  }

  const updateAreaDraft = (event: PointerEvent<HTMLDivElement>, pageId: string) => {
    if (tool !== "box" || !dragStart || dragStart.pageId !== pageId || dragStart.pointerId !== event.pointerId) return

    const point = measurePoint(event)
    const x = Math.min(dragStart.x, point.x)
    const y = Math.min(dragStart.y, point.y)
    const width = Math.abs(point.x - dragStart.x)
    const height = Math.abs(point.y - dragStart.y)

    setDraftAnnotation({ pageId, x, y, width, height })
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>, pageId: string) => {
    if (tool !== "box" || !dragStart || dragStart.pageId !== pageId) return
    const point = measurePoint(event)
    const completedDraft = {
      pageId,
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      width: Math.abs(point.x - dragStart.x),
      height: Math.abs(point.y - dragStart.y),
    }
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDragStart(null)
    if (completedDraft.width < 0.5 || completedDraft.height < 0.5) {
      setDraftAnnotation(null)
      return
    }
    setDraftAnnotation(completedDraft)
    setAnnotationDialogOpen(true)
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
      const payload = await res.json()
      const created = { ...payload, id: payload.id || payload.annotationId }

      setPages((current) =>
        current.map((page) =>
          page.id === draftAnnotation.pageId
            ? { ...page, annotations: [...(page.annotations || []), created] }
            : page
        )
      )
      setDraftAnnotation(null)
      setAnnotationText("")
      setAnnotationDialogOpen(false)
    } catch (err: any) {
      alert(err.message || "Could not save annotation.")
    } finally {
      setSavingAnnotation(false)
    }
  }

  const cancelAnnotation = () => {
    setDraftAnnotation(null)
    setAnnotationText("")
    setAnnotationDialogOpen(false)
  }

  const deleteAnnotation = async (pageId: string, annotationId: string) => {
    if (!token || deletingAnnotationId) return
    setDeletingAnnotationId(annotationId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/pages/annotations/${annotationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message || "Failed to delete the review mark.")
      }

      setPages((current) =>
        current.map((page) => {
          if (page.id !== pageId) return page
          const annotations = (page.annotations || []).filter((ann: any) => (ann.id || ann.annotationId) !== annotationId)
          return { ...page, annotations }
        })
      )
    } catch (err: any) {
      alert(err.message || "Could not delete the review mark.")
    } finally {
      setDeletingAnnotationId(null)
    }
  }

  // Handle posting comments
  const handlePostComment = async () => {
    if (!activePage || !comment.trim() || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/pages/${activePage.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ body: comment })
      })
      if (res.ok) {
        const newComment = await res.json()
        const updated = pages.map((p) => {
          if (p.id === activePage.id) {
            return { ...p, comments: [...(p.comments || []), newComment] }
          }
          return p
        })
        setPages(updated)
        setComment("")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const statusColors = {
    pending: "bg-muted text-muted-foreground",
    review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    revision: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  }

  if (versionDialogOpen && activePage) {
    return (
      <VersionCompareDialog
        open={versionDialogOpen}
        onOpenChange={setVersionDialogOpen}
        mode={versionMode}
        pageId={activePage?.id}
        chapterId={activePage?.chapterId}
        title={versionMode === "chapter" ? `Chapter ${activePage?.chapterNumber} Versions` : `Page ${activePage?.number} Versions`}
        token={token}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* SCREEN 1: Review Queue List */}
      {!activeSeriesId ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Eye className="w-8 h-8 text-primary" />
              Review Pages Queue
            </h1>
            <p className="text-muted-foreground mt-1">
              List of series with completed drawings waiting for review (Sorted by earliest completion time).
            </p>
          </div>

          {loadingQueue ? (
            <div className="text-center py-12 text-zinc-400 text-sm">Loading review queue...</div>
          ) : reviewSeries.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">No manga pages currently need review. 🎉</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {reviewSeries.map((s) => {
                const coverUrl = getFullCoverUrl(s.coverImageUrl)
                const relativeTime = formatRelativeTime(s.oldestReviewPageTime, now)
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveSeriesId(s.id)
                      setActiveSeriesTitle(s.title)
                    }}
                    className="group cursor-pointer space-y-2.5"
                  >
                    {/* Image Cover */}
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-zinc-800 bg-[#202023] flex items-center justify-center">
                      {s.coverImageUrl ? (
                        <img
                          src={coverUrl}
                          alt={s.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <BookOpen className="w-8 h-8 text-zinc-700 mx-auto mb-1" />
                          <span className="text-[10px] text-zinc-500">No cover</span>
                        </div>
                      )}

                      {/* Time Badge top-left */}
                      <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-amber-500 text-black font-bold flex items-center gap-1 shadow-lg">
                        <Clock className="w-3 h-3" />
                        {relativeTime}
                      </div>
                    </div>

                    {/* Text info */}
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-sm truncate text-zinc-100 group-hover:text-primary transition-colors leading-tight">
                        {s.title}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {s.chapters} chapters • {s.genre}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* SCREEN 2: Main Annotation Viewer */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveSeriesId(null)
                setActiveSeriesTitle("")
                fetchQueue()
              }}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to review list
            </Button>
            <div className="text-right">
              <h2 className="text-xl font-bold text-white leading-none">{activeSeriesTitle}</h2>
              <span className="text-xs text-zinc-500">Review Board</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Cột trái: Manga Viewer */}
            <div className="lg:col-span-3 space-y-4">
              {/* Toolbar */}
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">Filter Chapter:</span>
                    <Select value={selectedChapter} onValueChange={(v) => {
                      setSelectedChapter(v)
                      setCurrentPageIndex(0)
                    }}>
                      <SelectTrigger className="w-32 bg-zinc-950 border-zinc-800 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                        <SelectItem value="all">All chapters</SelectItem>
                        {chapters.map((ch) => (
                          <SelectItem key={ch} value={ch}>Chapter {ch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const targets = displayedPages.filter((p) => p.status !== "approved")
                        if (targets.length === 0) {
                          toast("All visible pages are already approved.")
                          return
                        }
                        setBulkApproveTargetCount(targets.length)
                        setBulkApproveConfirmOpen(true)
                      }}
                      disabled={bulkApproving || displayedPages.length === 0}
                      className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <CheckCheck className="w-4 h-4 mr-2" />
                      {bulkApproving ? "Approving..." : "Bulk Approve"}
                    </Button>
                    {activePage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setVersionMode("page")
                          setVersionDialogOpen(true)
                        }}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      >
                        <History className="w-4 h-4 mr-2" />
                        Page Versions
                      </Button>
                    )}
                    {activePage?.chapterId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setVersionMode("chapter")
                          setVersionDialogOpen(true)
                        }}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      >
                        <History className="w-4 h-4 mr-2" />
                        Chapter Versions
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={annotationMode ? "default" : "outline"}
                      onClick={() => {
                        setAnnotationMode(!annotationMode)
                        setDraftAnnotation(null)
                      }}
                      className={annotationMode ? "bg-primary text-primary-foreground font-semibold" : "border-zinc-800 text-zinc-300 hover:bg-zinc-800"}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      {annotationMode ? "Drawing Mode On" : "Draw Revision Note"}
                    </Button>
                    {annotationMode && (
                      <>
                        <Button
                          size="sm"
                          variant={tool === "pin" ? "default" : "outline"}
                          onClick={() => setTool("pin")}
                          className={tool === "pin" ? "bg-[#00dfc0] text-black hover:bg-[#00dfc0]/90" : "border-zinc-800 text-zinc-300 hover:bg-zinc-850"}
                        >
                          <MousePointer2 className="mr-1.5 h-4 w-4" />
                          Pin
                        </Button>
                        <Button
                          size="sm"
                          variant={tool === "box" ? "default" : "outline"}
                          onClick={() => setTool("box")}
                          className={tool === "box" ? "bg-[#00dfc0] text-black hover:bg-[#00dfc0]/90" : "border-zinc-800 text-zinc-300 hover:bg-zinc-855"}
                        >
                          <Square className="mr-1.5 h-4 w-4" />
                          Area
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Main Image View */}
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardContent className="p-6">
                  {loadingPages ? (
                    <div className="aspect-[3/4] bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-400">
                      Loading pages...
                    </div>
                  ) : displayedPages.length === 0 ? (
                    <div className="aspect-[3/4] bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 text-sm">
                      No pages waiting for review in this filter.
                    </div>
                  ) : (
                    <div
                      onPointerDown={(event) => {
                        if (annotationMode && activePage) handlePointerDown(event, activePage.id)
                      }}
                      onPointerMove={(event) => {
                        if (annotationMode && activePage) updateAreaDraft(event, activePage.id)
                      }}
                      onPointerUp={(event) => {
                        if (annotationMode && activePage) handlePointerUp(event, activePage.id)
                      }}
                      onPointerCancel={() => {
                        setDragStart(null)
                        setDraftAnnotation(null)
                      }}
                      className={`aspect-[3/4] bg-zinc-950 rounded-lg flex items-center justify-center relative overflow-hidden touch-none ${
                        annotationMode ? "cursor-crosshair border border-primary/50" : ""
                      }`}
                    >
                      {activePage?.imageUrl ? (
                        <img
                          src={getFullCoverUrl(activePage.imageUrl)}
                          alt={`Page ${activePage.number}`}
                          className="max-h-full max-w-full object-contain select-none"
                          draggable={false}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-4xl font-bold text-zinc-700 mb-2">Page {activePage?.number}</p>
                          <p className="text-zinc-500 text-xs">Image not uploaded yet</p>
                        </div>
                      )}

                      {/* Render annotations overlay */}
                      {activePage?.annotations?.map((ann: any, index: number) => {
                        const isBox = Boolean(ann.width && ann.height)
                        return (
                          <div
                            key={ann.id || ann.annotationId || index}
                            title={ann.body}
                            className={
                              isBox
                                ? "pointer-events-none absolute border-2 border-amber-400 bg-amber-300/15"
                                : "pointer-events-none absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-black border border-black shadow-lg"
                            }
                            style={{
                              left: `${ann.x}%`,
                              top: `${ann.y}%`,
                              width: isBox ? `${ann.width}%` : undefined,
                              height: isBox ? `${ann.height}%` : undefined,
                            }}
                          >
                            {isBox ? (
                              <span className="absolute -left-2 -top-7 rounded bg-amber-400 px-2 py-0.5 text-xs font-bold text-black shadow">
                                {index + 1}
                              </span>
                            ) : (
                              index + 1
                            )}
                            {ann.status === "open" && (
                              <button
                                type="button"
                                title="Delete this review mark"
                                disabled={deletingAnnotationId === (ann.id || ann.annotationId)}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void deleteAnnotation(activePage.id, ann.id || ann.annotationId)
                                }}
                                className="pointer-events-auto absolute -right-3 -top-3 flex h-5 w-5 items-center justify-center rounded-full border border-red-400 bg-red-600 text-white shadow-lg transition hover:bg-red-500 disabled:opacity-60 text-[10px]"
                              >
                                {deletingAnnotationId === (ann.id || ann.annotationId) ? (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {draftAnnotation && activePage && draftAnnotation.pageId === activePage.id && (
                        <div
                          className={draftAnnotation.width ? "absolute border-2 border-[#00dfc0] bg-[#00dfc0]/15" : "absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#00dfc0] text-xs font-bold text-black border border-black shadow-lg"}
                          style={{
                            left: `${draftAnnotation.x}%`,
                            top: `${draftAnnotation.y}%`,
                            width: draftAnnotation.width ? `${draftAnnotation.width}%` : undefined,
                            height: draftAnnotation.height ? `${draftAnnotation.height}%` : undefined,
                          }}
                        />
                      )}
                    </div>
                  )}

                  {/* Navigation controls */}
                  {displayedPages.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                        disabled={currentPageIndex === 0}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1.5" />
                        Previous
                      </Button>
                      <span className="text-zinc-400 text-xs">
                        Page <strong>{activePage?.number}</strong> of {displayedPages.length} (Chapter {activePage?.chapterNumber})
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageIndex(Math.min(displayedPages.length - 1, currentPageIndex + 1))}
                        disabled={currentPageIndex === displayedPages.length - 1}
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      >
                        Trang sau
                        <ChevronRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Approval Buttons */}
              {activePage && (
                <Card className="bg-zinc-900 border-zinc-800 text-white">
                  <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400">Current Status:</span>
                      <Badge className={statusColors[activePage.status as keyof typeof statusColors] || "bg-zinc-800 text-zinc-300"}>
                        {activePage.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                        onClick={handleRequestRevision}
                      >
                        <X className="w-4 h-4 mr-1.5" />
                        Request Revision
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-500 text-white"
                        onClick={handleApprovePage}
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Approve Page
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right column: thumbnails and comments */}
            <div className="space-y-6">
              {/* Grid Thumbnail trang */}
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-300">Page Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {displayedPages.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setCurrentPageIndex(idx)}
                        className={`aspect-[3/4] rounded border-2 transition-colors relative flex items-center justify-center text-xs font-semibold ${
                          currentPageIndex === idx
                            ? "border-primary bg-primary/10 text-white"
                            : "border-zinc-850 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {p.number}
                        {p.status === "approved" && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full" />
                        )}
                        {p.hasAnnotations && (
                          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Comments / Discussions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Chat feed */}
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {activePage?.comments?.map((c: any) => (
                      <div key={c.id} className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-850 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="w-5 h-5 shrink-0">
                              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.avatar}`} />
                              <AvatarFallback>{c.userName?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-zinc-200">{c.userName}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">{formatRelativeTime(c.createdAt, now)}</span>
                        </div>
                        <p className="text-zinc-400 leading-normal">{c.body}</p>
                      </div>
                    ))}
                    {(!activePage?.comments || activePage.comments.length === 0) && (
                      <div className="text-center py-6 text-zinc-600 text-xs">No comments yet for this page.</div>
                    )}
                  </div>

                  {/* Input form */}
                  {activePage && (
                    <div className="space-y-2 pt-2 border-t border-zinc-850">
                      <Textarea
                        placeholder="Add discussion comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-zinc-950 border-zinc-850 text-xs text-white min-h-[60px]"
                      />
                      <Button
                        size="sm"
                        onClick={handlePostComment}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-medium text-xs py-1.5"
                      >
                        Post Comment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      <Dialog open={annotationDialogOpen} onOpenChange={(open) => !open && cancelAnnotation()}>
        <DialogContent className="max-w-lg border-zinc-800 bg-[#151719] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-[#00dfc0]" />
              Add Review Reason
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Explain the required change for this page. This reason will be sent to the assigned Assistant.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={annotationText}
            onChange={(event) => setAnnotationText(event.target.value)}
            placeholder="Describe the exact content, dialogue, or artwork correction..."
            className="min-h-[140px] border-zinc-800 bg-zinc-950 text-sm text-white placeholder:text-zinc-600"
          />
          <DialogFooter>
            <Button variant="outline" onClick={cancelAnnotation} className="border-zinc-800 text-zinc-300">
              Cancel
            </Button>
            <Button disabled={savingAnnotation || !annotationText.trim()} onClick={saveAnnotation} className="bg-[#00dfc0] font-bold text-black hover:bg-[#00dfc0]/90">
              {savingAnnotation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Mark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkApproveConfirmOpen} onOpenChange={setBulkApproveConfirmOpen}>
        <AlertDialogContent className="border-zinc-800 bg-[#151719] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
              Bulk Approve Pages
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to approve all <strong>{bulkApproveTargetCount}</strong> visible page(s) in this chapter? This will mark them as approved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkApproveDisplayed}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              Approve All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
