"use client"

import { useState, useEffect } from "react"
import { Star, Eye, Bookmark, FileText, BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { SeriesDetailModal } from "./series-detail-modal"
import { formatRelativeTime, parseApiDateTime } from "@/lib/date-time"
import { useNow } from "@/lib/use-now"

export function ProjectList() {
  const { token } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const now = useNow()

  const fetchSeries = () => {
    if (!token) return

    fetch(`${API_BASE_URL}/api/data/series`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Sắp xếp theo thứ tự cập nhật mới nhất đến cũ nhất cho mục "Danh Sách Truyện Tranh Mới"
          const sorted = [...data].sort(
            (a, b) => parseApiDateTime(b.updatedAtRaw)!.getTime() - parseApiDateTime(a.updatedAtRaw)!.getTime()
          )
          setProjects(sorted)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching projects:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchSeries()
  }, [token])

  const getFullCoverUrl = (coverPath?: string) => {
    if (!coverPath) return ""
    if (coverPath.startsWith("http")) return coverPath
    return `${API_BASE_URL}${coverPath}`
  }

  const handleCardClick = (id: string) => {
    setSelectedSeriesId(id)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📖 New Series List
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400 text-sm">Loading new series...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 text-sm">No new series found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {projects.map((project) => {
            const coverUrl = getFullCoverUrl(project.coverImageUrl)
            const updatedTime = formatRelativeTime(project.updatedAtRaw, now)
            return (
              <div
                key={project.id}
                onClick={() => handleCardClick(project.id)}
                className="group cursor-pointer space-y-2.5"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-zinc-800 bg-[#202023] flex items-center justify-center">
                  {project.coverImageUrl ? (
                    <img
                      src={coverUrl}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <BookOpen className="w-8 h-8 text-zinc-700 mx-auto mb-1" />
                      <span className="text-[10px] text-zinc-500">No cover</span>
                    </div>
                  )}

                  {/* Time Badge top-left */}
                  <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-[#000000]/70 text-zinc-200 border border-zinc-800/40">
                    {updatedTime}
                  </div>

                  {/* Rating or Bookmark top-right */}
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-[#000000]/60 text-white/90 hover:text-yellow-500 hover:bg-[#000000]/80 transition-colors">
                    <Bookmark className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm truncate text-zinc-100 group-hover:text-primary transition-colors leading-tight">
                    {project.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Chapter {project.chapters ?? 0}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                      <Eye className="w-3 h-3" />
                      {project.readerCount >= 1000 ? `${(project.readerCount / 1000).toFixed(1)}k` : project.readerCount}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Series Detail Modal */}
      {selectedSeriesId && (
        <SeriesDetailModal
          seriesId={selectedSeriesId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSeriesId(null)
          }}
          onUpdate={fetchSeries}
        />
      )}
    </div>
  )
}
