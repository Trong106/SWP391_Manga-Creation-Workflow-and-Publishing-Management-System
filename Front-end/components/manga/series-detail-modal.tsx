"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, BookOpen, Heart, Eye, Bookmark, Calendar, User, Info, FileText, AlertTriangle } from "lucide-react"

interface SeriesDetailModalProps {
  seriesId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void // Callback to refresh parent list
}

export function SeriesDetailModal({ seriesId, isOpen, onClose, onUpdate }: SeriesDetailModalProps) {
  const { token, role, logout } = useAuth()
  const router = useRouter()
  const [series, setSeries] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submittingChapterId, setSubmittingChapterId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && seriesId && token) {
      fetchDetails()
    }
  }, [isOpen, seriesId, token])

  const fetchDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch series details
      const seriesRes = await fetch(`${API_BASE_URL}/api/series/${seriesId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (seriesRes.status === 401) {
        logout()
        return
      }
      if (!seriesRes.ok) throw new Error("Failed to fetch series details")
      const seriesData = await seriesRes.json()
      setSeries(seriesData)

      // Fetch chapters list
      const chaptersRes = await fetch(`${API_BASE_URL}/api/series/${seriesId}/chapters`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (chaptersRes.status === 401) {
        logout()
        return
      }
      if (!chaptersRes.ok) throw new Error("Failed to fetch chapters list")
      const chaptersData = await chaptersRes.json()
      // Sort descending (highest chapter number first)
      const sortedChapters = [...chaptersData].sort((a, b) => b.chapterNumber - a.chapterNumber)
      setChapters(sortedChapters)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !seriesId || !token) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`${API_BASE_URL}/api/series/${seriesId}/upload-cover`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      if (!res.ok) {
        throw new Error("Cover image upload failed")
      }

      await fetchDetails()
      if (onUpdate) onUpdate()
    } catch (err: any) {
      alert(err.message || "Error uploading cover image")
    } finally {
      setUploading(false)
    }
  }

  const getFullCoverUrl = (coverPath?: string) => {
    if (!coverPath) return ""
    if (coverPath.startsWith("http")) return coverPath
    return `${API_BASE_URL}${coverPath}`
  }

  const handleSubmitChapter = async (chapterId: string) => {
    if (!token) return

    setSubmittingChapterId(chapterId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/chapters/${chapterId}/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Could not submit chapter. Please make sure every page has been approved.")
      }

      await fetchDetails()
      if (onUpdate) onUpdate()
      alert("Chapter submitted to Tantou Editor for content review.")
    } catch (err: any) {
      alert(err.message || "Server connection error")
    } finally {
      setSubmittingChapterId(null)
    }
  }

  const formatStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "proposal":
      case "ongoing":
        return "In Progress"
      case "completed":
        return "Completed"
      case "hiatus":
        return "Hiatus"
      case "cancelled":
        return "Cancelled"
      default:
        return status || "In Progress"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "hiatus": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/30"
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const getChapterStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "editorial_ready": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "tantou_review": return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      case "revision_requested": return "bg-orange-500/20 text-orange-300 border-orange-500/30"
      case "published": return "bg-green-500/20 text-green-300 border-green-500/30"
      default: return "bg-zinc-700/50 text-zinc-300 border-zinc-700"
    }
  }

  const canSubmitChapter = (chapter: any) => {
    const lockedStatuses = ["tantou_review", "editorial_ready", "scheduled", "published"]
    if (role !== "mangaka" || lockedStatuses.includes((chapter.status || "").toLowerCase())) {
      return false
    }

    const pageCount = chapter.pageCount ?? 0
    const approvedPageCount = chapter.approvedPageCount ?? 0
    return pageCount > 0 && approvedPageCount === pageCount
  }

  const getSubmitChapterBlockReason = (chapter: any) => {
    const status = (chapter.status || "").toLowerCase()
    const lockedStatuses = ["tantou_review", "editorial_ready", "scheduled", "published"]
    if (lockedStatuses.includes(status)) {
      return "Chapter has already moved to the publishing workflow."
    }

    const pageCount = chapter.pageCount ?? 0
    const approvedPageCount = chapter.approvedPageCount ?? 0
    if (pageCount === 0) {
      return "Upload at least one page before submitting."
    }
    if (approvedPageCount < pageCount) {
      return `Approve all pages first (${approvedPageCount}/${pageCount} approved).`
    }
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#18181b] text-white border-zinc-800 p-6 scrollbar-thin">
        <DialogTitle className="sr-only">
          Manga Details: {series?.title || ""}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {series?.synopsis || "Manga synopsis summary"}
        </DialogDescription>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
            <p className="text-zinc-400 text-sm">Loading series details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-400">
            <p>An error occurred: {error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchDetails}>Try again</Button>
          </div>
        ) : series ? (
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span>Home</span>
              <span>/</span>
              <span className="text-primary font-medium">{series.title}</span>
            </div>

            {/* Layout trên: Ảnh bìa + Metadata */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cột trái: Ảnh bìa (hoặc upload) */}
              <div className="w-full md:w-56 shrink-0 relative group">
                <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  {series.coverImageUrl ? (
                    <img
                      src={getFullCoverUrl(series.coverImageUrl)}
                      alt={series.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                      <span className="text-xs text-zinc-500">No cover image</span>
                    </div>
                  )}

                  {/* Overlay Upload dành riêng cho Mangaka */}
                  {role === "mangaka" && (
                    <label
                      htmlFor="cover-upload"
                      className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs"
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                      ) : (
                        <Upload className="w-6 h-6 text-white mb-2" />
                      )}
                      <span>Upload cover</span>
                    </label>
                  )}
                </div>
                {role === "mangaka" && (
                  <input
                    type="file"
                    id="cover-upload"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                )}
              </div>

              {/* Cột phải: Thông tin chi tiết */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-white leading-tight">{series.title}</h2>
                  {series.titleJp && (
                    <p className="text-sm text-zinc-400 mt-0.5 italic">{series.titleJp}</p>
                  )}
                </div>

                {/* Metadata List - Xếp dọc và chỉ hiển thị khi có dữ liệu từ backend API */}
                <div className="flex flex-col gap-2.5 text-sm border-t border-b border-zinc-800/80 py-4">
                  {series.mangakaName && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Author:</span>
                      <span className="text-zinc-200 font-medium">{series.mangakaName}</span>
                    </div>
                  )}
                  {series.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Created Date:</span>
                      <span className="text-zinc-200">{new Date(series.createdAt).toLocaleDateString("en-US")}</span>
                    </div>
                  )}
                  {chapters && chapters.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Total Chapters:</span>
                      <span className="text-zinc-200 font-medium">{chapters.length}</span>
                    </div>
                  )}
                  {series.status && (
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Status:</span>
                      <Badge variant="outline" className={getStatusColor(series.status)}>
                        {formatStatus(series.status)}
                      </Badge>
                    </div>
                  )}
                  {series.readerCount !== undefined && series.readerCount !== null && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Views:</span>
                      <span className="text-zinc-200 font-medium">{(series.readerCount || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Thể loại */}
                <div className="flex flex-wrap gap-1.5">
                  {series.genres?.map((genre: string) => (
                    <Badge key={genre} variant="secondary" className="bg-zinc-800 text-zinc-300 border-none text-[11px] px-2 py-0.5">
                      {genre}
                    </Badge>
                  ))}
                  {(!series.genres || series.genres.length === 0) && (
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 border-none text-[11px]">
                      Uncategorized
                    </Badge>
                  )}
                </div>

                {/* Khối nút hành động */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-500 text-white font-medium"
                    onClick={() => {
                      if (chapters.length > 0) {
                        router.push(`/chapters/${chapters[chapters.length - 1].chapterId}`)
                        onClose()
                      } else {
                        alert("No chapters uploaded yet.")
                      }
                    }}
                  >
                    Read First Chapter
                  </Button>
                </div>
              </div>
            </div>

            {series.riskLevel && series.riskLevel !== "normal" && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-100">
                      {series.riskLevel === "cancelled" ? "Cancelled by Editorial Board" : "Editorial risk notice"}
                    </h3>
                    <p className="mt-1 text-sm text-amber-100/80">
                      {series.cancellationReason || series.riskReason || "This series needs attention before the next editorial review."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Giới thiệu truyện */}
            <div className="space-y-2 border-t border-zinc-800 pt-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Synopsis
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed bg-[#202023] p-4 rounded-lg border border-zinc-800/40">
                {series.synopsis || "No synopsis available for this series."}
              </p>
            </div>

            {/* Danh sách chương */}
            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Chapter List
              </h3>
              <div className="border border-zinc-800 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin bg-[#1e1e21]">
                {chapters.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm">
                    No chapters available.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/80">
                    {chapters.map((ch) => {
                      const submitBlockReason = getSubmitChapterBlockReason(ch)
                      const showSubmitButton = role === "mangaka" && !["tantou_review", "editorial_ready", "scheduled", "published"].includes((ch.status || "").toLowerCase())

                      return (
                        <div
                          key={ch.chapterId}
                          onClick={() => {
                            router.push(`/chapters/${ch.chapterId}`)
                            onClose()
                          }}
                          className="flex items-center justify-between gap-3 p-3.5 hover:bg-zinc-800/50 transition-colors text-sm cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-zinc-200 group-hover:text-primary transition-colors font-medium">
                              Chapter {ch.chapterNumber}{ch.title ? `: ${ch.title}` : ""}
                            </span>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={`${getChapterStatusColor(ch.status)} text-[10px] px-1.5 py-0`}>
                                {(ch.status || "draft").replaceAll("_", " ")}
                              </Badge>
                              <span className="text-[11px] text-zinc-500">
                                {ch.approvedPageCount ?? 0}/{ch.pageCount ?? 0} pages approved
                              </span>
                              <span className="text-[11px] text-zinc-600">
                                {new Date(ch.createdAt).toLocaleDateString("en-US")}
                              </span>
                            </div>
                            {showSubmitButton && submitBlockReason && (
                              <p className="mt-1 text-[11px] text-amber-300">
                                {submitBlockReason}
                              </p>
                            )}
                          </div>
                          {showSubmitButton && (
                            <Button
                              size="sm"
                              title={submitBlockReason || "Submit chapter to Tantou Editor"}
                              onClick={(event) => {
                                event.stopPropagation()
                                if (!canSubmitChapter(ch)) return
                                handleSubmitChapter(ch.chapterId)
                              }}
                              disabled={submittingChapterId === ch.chapterId || !canSubmitChapter(ch)}
                              className="shrink-0 bg-[#00dfc0] text-black hover:bg-[#00dfc0]/90 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {submittingChapterId === ch.chapterId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <FileText className="w-4 h-4 mr-1.5" />
                                  Submit Chapter
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
