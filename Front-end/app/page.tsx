"use client"

import { useAuth } from "@/lib/auth-context"
import { StatsCards as MetricCard } from "@/components/manga/stats-cards"
import { TeamActivity as RecentActivity } from "@/components/manga/team-activity"
import { WorkflowBoard as QuickActions } from "@/components/manga/workflow-board"
import { ProjectList as NewMangaGrid } from "@/components/manga/project-list"
import { useState, useEffect, useRef } from "react"
import { API_BASE_URL } from "@/lib/api-config"
import { SeriesDetailModal } from "@/components/manga/series-detail-modal"
import { BookOpen, Star, Eye, Bookmark, TrendingUp } from "lucide-react"

// Định nghĩa danh sách tính năng theo từng vai trò 
const ROLE_INFO: Record<string, { name: string; desc: string; metrics: { title: string; val: string; change: string; icon: string }[] }> = {
  mangaka: {
    name: 'Yuki Tanaka (Mangaka)',
    desc: 'Studio Owner / Main Artist',
    metrics: [
      { title: "Active Series", val: "3", change: "+1 this month", icon: "📚" },
      { title: "Team Members", val: "12", change: "4 Assistants active", icon: "👥" },
      { title: "Pages This Week", val: "24", change: "Target: 30 pages", icon: "📄" }
    ]
  },
  assistant: {
    name: 'Kenji Yamamoto (Assistant)',
    desc: 'Studio Assistant & Line Artist',
    metrics: [
      { title: "Assigned Tasks", val: "5 pending", change: "2 urgent tasks", icon: "📋" },
      { title: "Downloaded Pages", val: "14 pages", change: "Ready to ink", icon: "💾" },
      { title: "Earned Payroll", val: "$450", change: "This chapter cycle", icon: "💰" }
    ]
  },
  tantou: {
    name: 'Minh Nguyen (Tantou Editor)',
    desc: 'Quality Control / Publishing Manager',
    metrics: [
      { title: "Studio Progress", val: "85%", change: "Chapter 45 in review", icon: "📉" },
      { title: "Pages to Review", val: "8 pages", change: "3 annotated edits", icon: "👀" },
      { title: "Publish Status", val: "Pending", change: "Waiting for approval", icon: "🚀" }
    ]
  },
  editorial: {
    name: 'Tuan Dinh (Editorial Board)',
    desc: 'High-Level Publishing Authority',
    metrics: [
      { title: "New Proposals", val: "2 pending", change: "1 Action, 1 Romance", icon: "⚖️" },
      { title: "Reader Votes", val: "45.2K", change: "+12% overall traffic", icon: "🗳️" },
      { title: "Global Ranking", val: "Top 3", change: "Dragon Hunters series", icon: "🏆" }
    ]
  }
}

export default function Dashboard() {
  const { role, user, token } = useAuth()
  const currentRole = ROLE_INFO[role || 'mangaka'] || ROLE_INFO['mangaka']
  const [metrics, setMetrics] = useState<any[]>(currentRole.metrics)
  const [topSeries, setTopSeries] = useState<any[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch metrics
  useEffect(() => {
    if (role && user?.id) {
      fetch(`${API_BASE_URL}/api/data/dashboard-metrics?role=${role}&userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMetrics(data)
          }
        })
        .catch((err) => {
          console.error("Error fetching dashboard metrics:", err)
        })
    }
  }, [role, user?.id])

  // Fetch top series (Highest views & revenue)
  const fetchTopSeries = () => {
    fetch(`${API_BASE_URL}/api/data/series`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Sắp xếp theo lượt xem (readerCount) giảm dần và doanh thu cao nhất
          const sorted = [...data].sort((a, b) => b.readerCount - a.readerCount)
          setTopSeries(sorted)
        }
      })
      .catch((err) => {
        console.error("Error fetching top series:", err)
      })
  }

  useEffect(() => {
    fetchTopSeries()
  }, [])

  // Auto-scroll effect for "Truyện Top" row (scrolls left by 1 item every 2 seconds)
  useEffect(() => {
    if (topSeries.length === 0) return
    const el = scrollRef.current
    if (!el) return

    const interval = setInterval(() => {
      const cardWidth = 160 + 16 // card width: 160px + gap: 16px
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        el.scrollBy({ left: cardWidth, behavior: "smooth" })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [topSeries])

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const displayName = user?.name || currentRole.name

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 animate-gradient">{displayName}</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
            <span className="italic">{currentRole.desc}</span>
          </p>
        </div>
      </div>

      {/* hàng "Truyện Top" - Tự động kéo trái mỗi 2s */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🔥 Top Series
        </h2>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
        >
          {topSeries.map((project, idx) => {
            const coverUrl = getFullCoverUrl(project.coverImageUrl)
            return (
              <div
                key={project.id}
                onClick={() => handleCardClick(project.id)}
                className="w-40 shrink-0 group cursor-pointer space-y-2 relative"
              >
                {/* Ranking tag */}
                <div className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-black shadow-lg">
                  Top {idx + 1}
                </div>

                {/* Cover container */}
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-zinc-800 bg-[#202023] flex items-center justify-center">
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

                  {/* Bookmark tag */}
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-[#000000]/60 text-white/90 hover:text-yellow-500 hover:bg-[#000000]/80 transition-colors">
                    <Bookmark className="w-3 h-3" />
                  </div>
                </div>

                {/* Text info */}
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-sm truncate text-zinc-100 group-hover:text-primary transition-colors leading-tight">
                    {project.title}
                  </h4>
                  <div className="flex justify-between items-center text-[11px] text-zinc-400">
                    <span>Chapter {project.chapters}</span>
                    <span className="text-zinc-500 font-medium">
                      ${(project.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {topSeries.length === 0 && (
            <div className="text-center py-6 text-zinc-400 text-sm w-full">Loading top series...</div>
          )}
        </div>
      </div>

      {/* Hàng dưới: Danh Sách Truyện Tranh Mới (tĩnh) */}
      <div className="border-t border-zinc-800/80 pt-6">
        <NewMangaGrid />
      </div>

      {/* Metrics Section */}
      <div className="border-t border-zinc-800/80 pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Studio Performance Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((m, idx) => (
            <MetricCard key={idx} title={m.title} value={m.val} change={m.change} icon={m.icon} />
          ))}
        </div>
      </div>

      {/* Activity Logs & pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-t border-zinc-800/80 pt-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Reusable Series Detail Modal */}
      {selectedSeriesId && (
        <SeriesDetailModal
          seriesId={selectedSeriesId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSeriesId(null)
          }}
          onUpdate={fetchTopSeries}
        />
      )}
    </div>
  )
}