"use client"

import { useState, useEffect } from "react"
import { Star, BarChart3, Bookmark, FileText, BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL, readJson } from "@/lib/api-config"
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = useNow()

  const fetchSeries = () => {
    if (!token) return

    fetch(`${API_BASE_URL}/api/data/series-reader-votes`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => readJson<any[]>(res))
      .then((data) => {
        if (Array.isArray(data)) {
          // Sort by latest update first for the new series list.
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

  const formatVoteCount = (value?: number | null) => {
    const count = value ?? 0
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
    return count.toLocaleString()
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
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollProjects("left")}
            className="absolute left-0 top-[40%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/90 text-zinc-300 shadow-xl transition-colors hover:border-primary/60 hover:text-white"
            aria-label="Scroll new series left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollProjects("right")}
            className="absolute right-0 top-[40%] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/90 text-zinc-300 shadow-xl transition-colors hover:border-primary/60 hover:text-white"
            aria-label="Scroll new series right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div
            ref={scrollRef}
            className="flex max-w-full gap-5 overflow-x-auto px-12 pb-3 scrollbar-none scroll-smooth"
          >
            {projects.map((project) => {
              const coverUrl = getFullCoverUrl(project.coverImageUrl)
              const updatedTime = formatRelativeTime(project.updatedAtRaw, now)
              return (
                <div
                  key={project.id}
                  onClick={() => handleCardClick(project.id)}
                  className="group w-48 shrink-0 cursor-pointer space-y-2.5"
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
                  <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded bg-[#000000]/70 text-white font-medium border border-zinc-800/40 keep-white">
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
                      <BarChart3 className="w-3 h-3" />
                      {formatVoteCount(project.totalReaderVotes)}
                    </span>
                  </div>
                </div>
                </div>
              )
            })}
          </div>
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
