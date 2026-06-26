"use client"

import { useAuth } from "@/lib/auth-context"
import { StatsCards as MetricCard } from "@/components/manga/stats-cards"
import { TeamActivity as RecentActivity } from "@/components/manga/team-activity"
import { ProjectList as NewMangaGrid } from "@/components/manga/project-list"
import { useState, useEffect, useRef } from "react"
import { API_BASE_URL } from "@/lib/api-config"
import { SeriesDetailModal } from "@/components/manga/series-detail-modal"
import { BookOpen, Star, Eye, Bookmark, TrendingUp, X, FolderOpen, Clock, Plus, Loader2, DollarSign, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

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

const STAGES = [
  { id: "storyboard", label: "Storyboard", emoji: "📝" },
  { id: "penciling", label: "Penciling", emoji: "✏️" },
  { id: "inking", label: "Inking", emoji: "✒️" },
  { id: "coloring", label: "Coloring", emoji: "🎨" },
  { id: "lettering", label: "Lettering", emoji: "💬" },
  { id: "review", label: "Review", emoji: "👁️" },
]

function getStageIdFromTaskType(type: string): string {
  const t = type.toLowerCase()
  if (t === "line_art") return "penciling"
  if (t === "background" || t === "effects") return "inking"
  if (t === "coloring") return "coloring"
  if (t === "lettering") return "lettering"
  if (t === "review") return "review"
  return "storyboard"
}

export default function Dashboard() {
  const { role, user, token } = useAuth()
  const isMangaka = role === "mangaka"
  const authHeader = token ? { "Authorization": `Bearer ${token}` } : undefined
  const currentRole = ROLE_INFO[role || 'mangaka'] || ROLE_INFO['mangaka']
  const [metrics, setMetrics] = useState<any[]>(currentRole.metrics)
  const [topSeries, setTopSeries] = useState<any[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [tasks, setTasks] = useState<any[]>([])

  // Task creation states
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskType, setTaskType] = useState<string>("line_art")
  const [dialogSeriesId, setDialogSeriesId] = useState<string>("")
  const [dialogChapterId, setDialogChapterId] = useState<string>("")
  const [dialogPageId, setDialogPageId] = useState<string>("")
  const [dialogAssigneeId, setDialogAssigneeId] = useState<string>("")
  const [dueDate, setDueDate] = useState("")
  const [paymentAmount, setPaymentAmount] = useState<string>("0")

  // Options lists
  const [seriesList, setSeriesList] = useState<any[]>([])
  const [chaptersList, setChaptersList] = useState<any[]>([])
  const [pagesList, setPagesList] = useState<any[]>([])
  const [assistantsList, setAssistantsList] = useState<any[]>([])

  const openNewTaskDialog = (initialStageId?: string) => {
    setTaskTitle("")
    setTaskDescription("")
    
    // Map stage.id to task type
    let type = "line_art"
    if (initialStageId === "storyboard") type = "line_art"
    if (initialStageId === "penciling") type = "line_art"
    if (initialStageId === "inking") type = "background"
    if (initialStageId === "coloring") type = "coloring"
    if (initialStageId === "lettering") type = "lettering"
    if (initialStageId === "review") type = "review"

    setTaskType(type)
    setDialogSeriesId("")
    setDialogChapterId("")
    setDialogPageId("")
    setDialogAssigneeId("")
    setDueDate("")
    setPaymentAmount("0")
    setFormError(null)

    // Pre-fetch lists
    fetchSeriesList()
    fetchAssistantsList()

    setIsTaskDialogOpen(true)
  }

  const fetchSeriesList = () => {
    if (!authHeader) return

    fetch(`${API_BASE_URL}/api/data/series`, { headers: authHeader })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSeriesList(data)
        }
      })
      .catch((err) => console.error("Error loading series options:", err))
  }

  const fetchAssistantsList = () => {
    if (!authHeader) return

    fetch(`${API_BASE_URL}/api/data/team`, { headers: authHeader })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAssistantsList(data)
        }
      })
      .catch((err) => console.error("Error loading assistants options:", err))
  }

  const handleSeriesChange = (seriesId: string) => {
    setDialogSeriesId(seriesId)
    setDialogChapterId("")
    setDialogPageId("")
    setChaptersList([])
    setPagesList([])

    if (!seriesId) return

    fetch(`${API_BASE_URL}/api/series/${seriesId}/chapters`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load chapters")
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setChaptersList(data)
        }
      })
      .catch((err) => console.error("Error loading chapters:", err))
  }

  const handleChapterChange = (chapterId: string) => {
    setDialogChapterId(chapterId)
    setDialogPageId("")
    setPagesList([])

    if (!chapterId) return

    fetch(`${API_BASE_URL}/api/chapters/${chapterId}/pages`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load pages")
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setPagesList(data)
        }
      })
      .catch((err) => console.error("Error loading pages:", err))
  }

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!taskTitle.trim()) {
      setFormError("Task title is required.")
      return
    }
    if (!dialogSeriesId) {
      setFormError("Please select a series.")
      return
    }
    if (!dialogChapterId) {
      setFormError("Please select a chapter.")
      return
    }
    if (!dialogPageId) {
      setFormError("Please select a page.")
      return
    }

    setFormLoading(true)

    const payload = {
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      type: taskType,
      regionId: null,
      assigneeId: dialogAssigneeId === "unassigned" || !dialogAssigneeId ? null : dialogAssigneeId,
      dueDate: dueDate || null,
      paymentAmount: parseFloat(paymentAmount) || 0
    }

    fetch(`${API_BASE_URL}/api/pages/${dialogPageId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const responseData = await res.json()
        if (!res.ok) {
          throw new Error(responseData.message || "Failed to create task")
        }
        return responseData
      })
      .then(() => {
        setIsTaskDialogOpen(false)
        fetchTasks() // Refresh task counts and details!
      })
      .catch((err) => {
        console.error("Error creating task:", err)
        setFormError(err.message)
      })
      .finally(() => {
        setFormLoading(false)
      })
  }

  const fetchTasks = () => {
    if (!authHeader) return

    fetch(`${API_BASE_URL}/api/data/tasks`, { headers: authHeader })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTasks(data)
        }
      })
      .catch((err) => console.error("Error fetching tasks:", err))
  }

  useEffect(() => {
    fetchTasks()
  }, [token])

  // Fetch metrics
  useEffect(() => {
    if (role && user?.id && authHeader) {
      fetch(`${API_BASE_URL}/api/data/dashboard-metrics?role=${role}&userId=${user.id}`, { headers: authHeader })
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
  }, [role, user?.id, token])

  // Fetch top series (Highest views & revenue)
  const fetchTopSeries = () => {
    if (!authHeader) return

    fetch(`${API_BASE_URL}/api/data/series`, { headers: authHeader })
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
  }, [token])

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

        {/* Production Pipeline Filter Button */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded-lg text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors shadow-sm cursor-pointer"
          >
            <span>📊 Production Pipeline</span>
          </button>
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 rounded-xl bg-zinc-950 border border-zinc-850 shadow-2xl p-2 z-40 space-y-1">
                {STAGES.map((stage) => {
                  const count = tasks.filter(t => getStageIdFromTaskType(t.type) === stage.id).length
                  return (
                    <div
                      key={stage.id}
                      onClick={() => {
                        setSelectedStage(stage.id)
                        setIsDrawerOpen(true)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors text-left cursor-pointer group/item"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="text-sm">{stage.emoji}</span>
                        <span>{stage.label}</span>
                      </span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isMangaka && (
                          <button
                            onClick={() => {
                              openNewTaskDialog(stage.id)
                              setIsDropdownOpen(false)
                            }}
                            className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-primary transition-opacity animate-fade-in cursor-pointer"
                            title="Add task"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${count > 0 ? 'bg-primary/20 text-primary border border-primary/10' : 'bg-zinc-900 text-zinc-650'}`}>
                          {count}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
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

      {/* Activity Logs */}
      <div className="border-t border-zinc-800/80 pt-6">
        <RecentActivity />
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

      {/* Side Drawer for Pipeline Tasks */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-[#121214] border-l border-zinc-850 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">
              {STAGES.find(s => s.id === selectedStage)?.emoji}
            </span>
            <div>
              <h2 className="font-bold text-lg text-white leading-tight">
                {STAGES.find(s => s.id === selectedStage)?.label} Stage
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {tasks.filter(t => getStageIdFromTaskType(t.type) === selectedStage).length} active tasks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMangaka && (
              <button
                onClick={() => openNewTaskDialog(selectedStage || undefined)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add task</span>
              </button>
            )}
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {tasks.filter(t => getStageIdFromTaskType(t.type) === selectedStage).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center">
              <FolderOpen className="w-12 h-12 text-zinc-700 mb-3 mx-auto" />
              <p className="text-sm font-medium text-zinc-300">No tasks in this stage</p>
              <p className="text-xs text-zinc-650 mt-1 mb-4">Check back later or assign new work</p>
              {isMangaka && (
                <button
                  onClick={() => openNewTaskDialog(selectedStage || undefined)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              )}
            </div>
          ) : (
            tasks
              .filter(t => getStageIdFromTaskType(t.type) === selectedStage)
              .map((t) => {
                // Priority mapping
                let priority: "low" | "medium" | "high" = "medium"
                if (t.status === "revision" || t.status === "rejected") {
                  priority = "high"
                } else if (t.status === "pending") {
                  priority = "low"
                }

                const priorityColors = {
                  low: "bg-green-500/15 text-green-400 border-green-500/10",
                  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/10",
                  high: "bg-red-500/15 text-red-400 border-red-500/10",
                }

                // Progress mapping
                const progressMap: Record<string, number> = {
                  pending: 10,
                  in_progress: 50,
                  submitted: 80,
                  approved: 100,
                  revision: 40,
                  cancelled: 0,
                }
                const progress = progressMap[t.status.toLowerCase()] || 0

                // Format date
                const formatDueDate = (dateStr?: string) => {
                  if (!dateStr || dateStr === "TBD") return "TBD"
                  try {
                    const date = new Date(dateStr)
                    if (isNaN(date.getTime())) return dateStr
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                    return `${months[date.getMonth()]} ${date.getDate()}`
                  } catch {
                    return dateStr
                  }
                }

                return (
                  <div
                    key={t.id}
                    className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl space-y-3.5 hover:border-zinc-800 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-sm text-zinc-100 line-clamp-2 leading-snug">
                        {t.title}
                      </h3>
                      <Badge variant="outline" className={`text-[10px] uppercase px-1.5 py-0.5 shrink-0 ${priorityColors[priority]}`}>
                        {priority}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                        <span>Series: <span className="text-zinc-200">{t.seriesTitle}</span></span>
                        <span>Ch {t.chapterNumber}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Progress</span>
                        <span className="font-semibold text-zinc-200">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-zinc-800/85" />
                    </div>

                    <div className="flex items-center justify-between pt-2.5 text-xs border-t border-zinc-800/40 text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Due {formatDueDate(t.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5 shrink-0">
                          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${t.assigneeAvatar || "kenji"}`} />
                          <AvatarFallback>{t.assigneeName?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="text-zinc-300 font-medium">{t.assigneeName || "Unassigned"}</span>
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>

      {/* Drawer Backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Task Creation Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New Task
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Assign a new task to your studio assistants or self-assign for review.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTaskSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-zinc-300">Task Title</Label>
              <Input
                id="title"
                placeholder="e.g. Draw character designs, background ink..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-600 text-sm focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-zinc-300">Description</Label>
              <Textarea
                id="description"
                placeholder="Task details and instructions..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="bg-zinc-950/40 border-zinc-850 text-white placeholder-zinc-600 text-sm focus-visible:ring-primary resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">Task Type</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="line_art">Line Art</SelectItem>
                    <SelectItem value="background">Background</SelectItem>
                    <SelectItem value="effects">Effects</SelectItem>
                    <SelectItem value="coloring">Coloring</SelectItem>
                    <SelectItem value="lettering">Lettering</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">Series</Label>
                <Select value={dialogSeriesId} onValueChange={handleSeriesChange}>
                  <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white text-sm">
                    <SelectValue placeholder="Select series" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {seriesList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">Chapter</Label>
                <Select 
                  value={dialogChapterId} 
                  onValueChange={handleChapterChange}
                  disabled={!dialogSeriesId}
                >
                  <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white text-sm disabled:opacity-50">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {chaptersList.map((c) => (
                      <SelectItem key={c.chapterId} value={c.chapterId}>
                        Ch. {c.chapterNumber} - {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">Manga Page</Label>
                <Select 
                  value={dialogPageId} 
                  onValueChange={setDialogPageId}
                  disabled={!dialogChapterId}
                >
                  <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white text-sm disabled:opacity-50">
                    <SelectValue placeholder="Select page" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {pagesList.map((p) => (
                      <SelectItem key={p.pageId} value={p.pageId}>
                        Page {p.pageNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-300">Assign To (Assistant)</Label>
              <Select value={dialogAssigneeId} onValueChange={setDialogAssigneeId}>
                <SelectTrigger className="bg-zinc-950/40 border-zinc-800 text-white text-sm">
                  <SelectValue placeholder="Unassigned / Freelancer" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="unassigned">Unassigned / Freelancer</SelectItem>
                  {assistantsList.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.specialty || "Assistant"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-zinc-950/40 border-zinc-800 text-white text-sm focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment" className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                  Payment Amount
                </Label>
                <Input
                  id="payment"
                  type="number"
                  min="0"
                  placeholder="e.g. 150"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-zinc-950/40 border-zinc-800 text-white text-sm focus-visible:ring-primary"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsTaskDialogOpen(false)}
                className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
