"use client"

import { useState, useEffect } from "react"
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
import { Loader2, Upload, BookOpen, Heart, Eye, Bookmark, Calendar, User, Info, FileText } from "lucide-react"

interface SeriesDetailModalProps {
  seriesId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void // Callback to refresh parent list
}

export function SeriesDetailModal({ seriesId, isOpen, onClose, onUpdate }: SeriesDetailModalProps) {
  const { token, role, logout } = useAuth()
  const [series, setSeries] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
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
        throw new Error("Tải lên ảnh bìa thất bại")
      }

      await fetchDetails()
      if (onUpdate) onUpdate()
    } catch (err: any) {
      alert(err.message || "Lỗi tải ảnh bìa")
    } finally {
      setUploading(false)
    }
  }

  const getFullCoverUrl = (coverPath?: string) => {
    if (!coverPath) return ""
    if (coverPath.startsWith("http")) return coverPath
    return `${API_BASE_URL}${coverPath}`
  }

  const formatStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "proposal":
      case "ongoing":
        return "Đang tiến hành"
      case "completed":
        return "Hoàn thành"
      case "hiatus":
        return "Tạm ngưng"
      case "cancelled":
        return "Đã hủy"
      default:
        return status || "Đang tiến hành"
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#18181b] text-white border-zinc-800 p-6 scrollbar-thin">
        <DialogTitle className="sr-only">
          Chi tiết truyện {series?.title || "Manga Details"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {series?.synopsis || "Tóm tắt nội dung truyện tranh"}
        </DialogDescription>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
            <p className="text-zinc-400 text-sm">Đang tải thông tin truyện...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-400">
            <p>Có lỗi xảy ra: {error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchDetails}>Thử lại</Button>
          </div>
        ) : series ? (
          <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span>Trang chủ</span>
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
                      <span className="text-xs text-zinc-500">Chưa có ảnh bìa</span>
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
                      <span>Tải ảnh bìa lên</span>
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
                      <span className="text-zinc-400 min-w-24">Tác giả:</span>
                      <span className="text-zinc-200 font-medium">{series.mangakaName}</span>
                    </div>
                  )}
                  {series.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Ngày tạo:</span>
                      <span className="text-zinc-200">{new Date(series.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  )}
                  {chapters && chapters.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Tổng số chap:</span>
                      <span className="text-zinc-200 font-medium">{chapters.length}</span>
                    </div>
                  )}
                  {series.status && (
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Tình trạng:</span>
                      <Badge variant="outline" className={getStatusColor(series.status)}>
                        {formatStatus(series.status)}
                      </Badge>
                    </div>
                  )}
                  {series.readerCount !== undefined && series.readerCount !== null && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-zinc-400 min-w-24">Lượt xem:</span>
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
                      Chưa phân loại
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
                        alert(`Bắt đầu đọc Chương 1: ${chapters[chapters.length - 1].title || "Không có tiêu đề"}`)
                      } else {
                        alert("Bộ truyện chưa cập nhật chương nào.")
                      }
                    }}
                  >
                    Đọc từ đầu
                  </Button>
                </div>
              </div>
            </div>

            {/* Giới thiệu truyện */}
            <div className="space-y-2 border-t border-zinc-800 pt-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Giới Thiệu
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed bg-[#202023] p-4 rounded-lg border border-zinc-800/40">
                {series.synopsis || "Chưa có tóm tắt giới thiệu cho bộ truyện này."}
              </p>
            </div>

            {/* Danh sách chương */}
            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Danh Sách Chương
              </h3>
              <div className="border border-zinc-800 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin bg-[#1e1e21]">
                {chapters.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm">
                    Chưa có chương nào được cập nhật.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/80">
                    {chapters.map((ch) => (
                      <div
                        key={ch.chapterId}
                        className="flex items-center justify-between p-3.5 hover:bg-zinc-800/50 transition-colors text-sm cursor-pointer group"
                      >
                        <span className="text-zinc-200 group-hover:text-primary transition-colors font-medium">
                          Chương {ch.chapterNumber}{ch.title ? `: ${ch.title}` : ""}
                        </span>
                        <span className="text-xs text-zinc-500 shrink-0">
                          {new Date(ch.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    ))}
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
