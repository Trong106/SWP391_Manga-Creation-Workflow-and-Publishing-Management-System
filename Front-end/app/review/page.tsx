"use client"

import { useState, useEffect } from "react"
import { Eye, Check, X, MessageSquare, ZoomIn, ChevronLeft, ChevronRight, Pencil, Download, ArrowLeft, BookOpen, Clock } from "lucide-react"
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
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

export default function ReviewPage() {
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

  // Fetch the Review Series queue (Screen 1)
  const fetchQueue = () => {
    setLoadingQueue(true)
    fetch(`${API_BASE_URL}/api/data/review-series`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviewSeries(data)
        }
        setLoadingQueue(false)
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách review queue:", err)
        setLoadingQueue(false)
      })
  }

  useEffect(() => {
    fetchQueue()
  }, [])

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
          console.error("Lỗi lấy trang review:", err)
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

  const getRelativeTime = (timeStr?: string) => {
    if (!timeStr) return ""
    const date = new Date(timeStr)
    const diffMs = new Date().getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins || 1} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    return `${diffDays} ngày trước`
  }

  // Handle page approval
  const handleApprovePage = async () => {
    if (!activePage || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/mangaka/pages/${activePage.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "approved" })
      })
      if (res.ok) {
        alert("Đã duyệt trang thành công!")
        // Refresh pages
        const updated = pages.map((p) => p.id === activePage.id ? { ...p, status: "approved" } : p)
        setPages(updated)
      } else {
        alert("Duyệt trang thất bại")
      }
    } catch (err) {
      console.error(err)
      alert("Lỗi kết nối server")
    }
  }

  // Handle request revision
  const handleRequestRevision = async () => {
    if (!activePage || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/mangaka/pages/${activePage.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "revision" })
      })
      if (res.ok) {
        alert("Đã yêu cầu chỉnh sửa thành công!")
        const updated = pages.map((p) => p.id === activePage.id ? { ...p, status: "revision" } : p)
        setPages(updated)
      } else {
        alert("Thất bại")
      }
    } catch (err) {
      console.error(err)
      alert("Lỗi kết nối")
    }
  }

  // Handle annotation click/placement
  const handlePageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationMode || !activePage || !token) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const body = prompt("Nhập nội dung ghi chú chỉnh sửa:")
    if (!body) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/mangaka/pages/${activePage.id}/annotations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ x, y, body })
      })
      if (res.ok) {
        const newAnn = await res.json()
        const updated = pages.map((p) => {
          if (p.id === activePage.id) {
            return { ...p, annotations: [...(p.annotations || []), newAnn] }
          }
          return p
        })
        setPages(updated)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Handle posting comments
  const handlePostComment = async () => {
    if (!activePage || !comment.trim() || !token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/mangaka/pages/${activePage.id}/comments`, {
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
              Danh sách truyện có trang vẽ hoàn thành chờ duyệt (Được xếp theo thời gian hoàn thành sớm nhất).
            </p>
          </div>

          {loadingQueue ? (
            <div className="text-center py-12 text-zinc-400 text-sm">Đang tải hàng đợi duyệt bài...</div>
          ) : reviewSeries.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">Không có trang truyện nào cần duyệt hiện tại. 🎉</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {reviewSeries.map((s) => {
                const coverUrl = getFullCoverUrl(s.coverImageUrl)
                const relativeTime = getRelativeTime(s.oldestReviewPageTime)
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
                          <span className="text-[10px] text-zinc-500">Chưa có ảnh</span>
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
              Quay lại danh sách duyệt
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
                    <span className="text-xs text-zinc-400">Lọc Chương:</span>
                    <Select value={selectedChapter} onValueChange={(v) => {
                      setSelectedChapter(v)
                      setCurrentPageIndex(0)
                    }}>
                      <SelectTrigger className="w-32 bg-zinc-950 border-zinc-800 text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                        <SelectItem value="all">Tất cả chương</SelectItem>
                        {chapters.map((ch) => (
                          <SelectItem key={ch} value={ch}>Chương {ch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={annotationMode ? "default" : "outline"}
                      onClick={() => setAnnotationMode(!annotationMode)}
                      className={annotationMode ? "bg-primary text-primary-foreground font-semibold" : "border-zinc-800 text-zinc-300 hover:bg-zinc-800"}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      {annotationMode ? "Đang vẽ Note..." : "Vẽ Note sửa bài"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Main Image View */}
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardContent className="p-6">
                  {loadingPages ? (
                    <div className="aspect-[3/4] bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-400">
                      Đang tải trang vẽ...
                    </div>
                  ) : displayedPages.length === 0 ? (
                    <div className="aspect-[3/4] bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 text-sm">
                      Không có trang vẽ nào đang chờ duyệt trong bộ lọc này.
                    </div>
                  ) : (
                    <div
                      onClick={handlePageClick}
                      className={`aspect-[3/4] bg-zinc-950 rounded-lg flex items-center justify-center relative overflow-hidden ${
                        annotationMode ? "cursor-crosshair border border-primary/50" : ""
                      }`}
                    >
                      {activePage?.imageUrl ? (
                        <img
                          src={getFullCoverUrl(activePage.imageUrl)}
                          alt={`Page ${activePage.number}`}
                          className="max-h-full max-w-full object-contain select-none"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-4xl font-bold text-zinc-700 mb-2">Trang {activePage?.number}</p>
                          <p className="text-zinc-500 text-xs">Ảnh chưa tải lên</p>
                        </div>
                      )}

                      {/* Render annotations overlay */}
                      {activePage?.annotations?.map((ann: any, index: number) => (
                        <div
                          key={ann.id}
                          style={{
                            left: `${ann.x}%`,
                            top: `${ann.y}%`,
                          }}
                          title={ann.body}
                          className="absolute w-6 h-6 bg-yellow-500 text-black rounded-full flex items-center justify-center cursor-pointer -translate-x-1/2 -translate-y-1/2 text-xs font-bold shadow-lg border border-black"
                        >
                          {index + 1}
                        </div>
                      ))}
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
                        Trang trước
                      </Button>
                      <span className="text-zinc-400 text-xs">
                        Trang <strong>{activePage?.number}</strong> trên {displayedPages.length} (Chương {activePage?.chapterNumber})
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
                      <span className="text-xs text-zinc-400">Trạng thái hiện tại:</span>
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
                        Yêu cầu sửa lại
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-500 text-white"
                        onClick={handleApprovePage}
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Duyệt thông qua
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Cột phải: Thumbnails & Bình luận */}
            <div className="space-y-6">
              {/* Grid Thumbnail trang */}
              <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-300">Tổng quan trang</CardTitle>
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
                    Bình Luận / Thảo Luận
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
                          <span className="text-[10px] text-zinc-500">{c.createdAt}</span>
                        </div>
                        <p className="text-zinc-400 leading-normal">{c.body}</p>
                      </div>
                    ))}
                    {(!activePage?.comments || activePage.comments.length === 0) && (
                      <div className="text-center py-6 text-zinc-600 text-xs">Chưa có bình luận nào cho trang này.</div>
                    )}
                  </div>

                  {/* Input form */}
                  {activePage && (
                    <div className="space-y-2 pt-2 border-t border-zinc-850">
                      <Textarea
                        placeholder="Thêm ý kiến thảo luận..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-zinc-950 border-zinc-850 text-xs text-white min-h-[60px]"
                      />
                      <Button
                        size="sm"
                        onClick={handlePostComment}
                        className="w-full bg-primary hover:bg-primary/95 text-white font-medium text-xs py-1.5"
                      >
                        Gửi bình luận
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
