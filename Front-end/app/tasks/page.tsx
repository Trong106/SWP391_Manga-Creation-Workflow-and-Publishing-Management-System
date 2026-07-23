"use client"

import { useRef, useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  ListTodo, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  Play, 
  Check, 
  Loader2, 
  Lock, 
  DollarSign,
  TrendingUp,
  ChevronRight,
  Eye,
  FileCheck,
  Download,
  BookOpen,
  MessageCircle,
  ArrowLeft,
  Library,
  Paintbrush,
  PenTool,
  Type,
  Languages,
  Eraser,
  FileText,
  Send
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Task {
  taskId: string
  title: string
  description: string | null
  type: string
  pageId: string
  pageNumber: number
  chapterTitle: string | null
  chapterNumber: number
  seriesTitle: string | null
  seriesId: string | null
  seriesCoverImageUrl: string | null
  regionId: string | null
  assigneeId: string | null
  assigneeName: string | null
  assignerId: string
  assignerName: string
  status: string
  dueDate: string | null
  paymentAmount: number
  createdAt: string
  updatedAt: string
  seriesStatus?: string | null
}

interface TaskResource {
  taskId: string
  pageId: string
  pageNumber: number
  imageUrl: string
  seriesTitle?: string | null
  chapterNumber: number
  revisionNote?: string | null
  revisionAnnotations?: RevisionAnnotation[]
}

interface RevisionAnnotation {
  annotationId: string
  x: number
  y: number
  width?: number | null
  height?: number | null
  body: string
  status: string
}

export default function AssistantTasksPage() {
  const { user, role, token } = useAuth()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("dueDate")
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null)
  const startingTaskRef = useRef<Set<string>>(new Set())

  // State for Resource Modal
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [selectedTaskResource, setSelectedTaskResource] = useState<TaskResource | null>(null)
  const [loadingResource, setLoadingResource] = useState(false)
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const [askingTaskId, setAskingTaskId] = useState<string | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null)

  // Ask Clarification states
  const [isAskDialogOpen, setIsAskDialogOpen] = useState(false)
  const [askMessage, setAskMessage] = useState("")
  const [taskToAsk, setTaskToAsk] = useState<Task | null>(null)

  const handleOpenResources = async (taskId: string) => {
    try {
      setLoadingResource(true)
      setLoadingTaskId(taskId)
      
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/resources`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!res.ok) {
        throw new Error("Failed to fetch task resources from backend")
      }

      const data = await res.json()
      setSelectedTaskResource(data)
      setIsResourceModalOpen(true)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to load task resources.")
    } finally {
      setLoadingResource(false)
      setLoadingTaskId(null)
    }
  }

  const handleDownloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const fullUrl = imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`
      const res = await fetch(fullUrl, { mode: 'cors' })
      if (!res.ok) throw new Error("CORS or network error")
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      window.URL.revokeObjectURL(blobUrl)
      toast.success("Download started successfully!")
    } catch (err) {
      console.error("Fetch blob download failed, falling back to open in tab:", err)
      const fullUrl = imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`
      window.open(fullUrl, "_blank")
      toast.info("Opening image in a new tab. Save it using Ctrl+S.")
    }
  }

  const fetchTasks = async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/tasks/my-tasks`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Failed to load tasks")
      const data = await res.json()
      setTasks(data)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load tasks from server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token && role === "assistant") {
      fetchTasks()
    }
  }, [token, role])

  const handleStartTask = async (taskId: string) => {
    if (!token) return
    if (startingTaskRef.current.has(taskId)) return
    startingTaskRef.current.add(taskId)

    try {
      setStartingTaskId(taskId)
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/start`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to start task")
      }

      const updatedTask: Task = await res.json()
      setTasks((current) =>
        current.map((task) =>
          task.taskId === taskId
            ? { ...task, ...updatedTask, status: "in_progress" }
            : task,
        ),
      )
      toast.success("Task started successfully! Status updated to In Progress.")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Something went wrong starting this task.")
    } finally {
      startingTaskRef.current.delete(taskId)
      setStartingTaskId(null)
    }
  }

  const handleAskMangaka = (task: Task) => {
    setTaskToAsk(task)
    setAskMessage(`Please clarify the requirement for "${task.title}" on page ${task.pageNumber}.`)
    setIsAskDialogOpen(true)
  }

  const handleSubmitAsk = async () => {
    if (!token || !taskToAsk || !askMessage.trim()) return

    try {
      setAskingTaskId(taskToAsk.taskId)
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskToAsk.taskId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ message: askMessage }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Failed to send clarification request.")
      }

      toast.success(`Notification sent to ${taskToAsk.assignerName}.`)
      setIsAskDialogOpen(false)
      setTaskToAsk(null)
      setAskMessage("")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Could not send clarification request.")
    } finally {
      setAskingTaskId(null)
    }
  }

  // Guard Clause for Authorization
  if (role !== "assistant") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
        <p className="text-zinc-400 text-sm">
          This portal is reserved strictly for studio assistants to manage their assigned tasks.
        </p>
      </div>
    )
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-zinc-400 text-sm animate-pulse">Loading assigned tasks...</p>
        </div>
      </div>
    )
  }

  // Dynamic calculations from real database objects (no fake data)
  // Extract all unique series names and their stats for the Selection Dashboard
  const allSeriesGroups: Record<string, { 
    approved: number; 
    pending: number; 
    inProgress: number; 
    submitted: number; 
    revision: number; 
    total: number;
    coverImageUrl: string | null;
    latestTaskDate: Date;
  }> = {}

  tasks.forEach(t => {
    const sTitle = t.seriesTitle || "Uncategorized"
    const taskDate = new Date(t.createdAt || t.updatedAt || 0)
    if (!allSeriesGroups[sTitle]) {
      allSeriesGroups[sTitle] = { 
        approved: 0, 
        pending: 0, 
        inProgress: 0, 
        submitted: 0, 
        revision: 0, 
        total: 0,
        coverImageUrl: t.seriesCoverImageUrl || null,
        latestTaskDate: taskDate
      }
    }
    if (!allSeriesGroups[sTitle].coverImageUrl && t.seriesCoverImageUrl) {
      allSeriesGroups[sTitle].coverImageUrl = t.seriesCoverImageUrl
    }
    if (taskDate > allSeriesGroups[sTitle].latestTaskDate) {
      allSeriesGroups[sTitle].latestTaskDate = taskDate
    }
    allSeriesGroups[sTitle].total++
    const s = t.status.toLowerCase()
    if (s === "approved") allSeriesGroups[sTitle].approved++
    else if (s === "pending") allSeriesGroups[sTitle].pending++
    else if (s === "in_progress") allSeriesGroups[sTitle].inProgress++
    else if (s === "submitted") allSeriesGroups[sTitle].submitted++
    else if (s === "revision") allSeriesGroups[sTitle].revision++
  })

  const seriesList = Object.entries(allSeriesGroups).map(([title, item]) => ({
    title,
    stats: item,
    coverImageUrl: item.coverImageUrl,
    latestTaskDate: item.latestTaskDate,
    percentage: Math.round((item.approved / item.total) * 100)
  })).sort((a, b) => b.latestTaskDate.getTime() - a.latestTaskDate.getTime())

  const displayedTasks = selectedSeries 
    ? tasks.filter(t => (t.seriesTitle || "Uncategorized") === selectedSeries)
    : tasks

  // Active Progress by Series
  const seriesGroups: Record<string, { approved: number; total: number }> = {}
  displayedTasks.forEach(t => {
    const sTitle = t.seriesTitle || "Uncategorized"
    if (!seriesGroups[sTitle]) {
      seriesGroups[sTitle] = { approved: 0, total: 0 }
    }
    displayedTasks.forEach(item => {
      if ((item.seriesTitle || "Uncategorized") === sTitle && item.status.toLowerCase() === "approved") {
        seriesGroups[sTitle].approved = (seriesGroups[sTitle].approved || 0) + 1
      }
    })
  })
  
  const activeProgress = Object.entries(seriesGroups).map(([title, stats]) => {
    const total = displayedTasks.filter(item => (item.seriesTitle || "Uncategorized") === title).length
    const approved = displayedTasks.filter(item => (item.seriesTitle || "Uncategorized") === title && item.status.toLowerCase() === "approved").length
    return {
      title,
      percentage: Math.round(total > 0 ? (approved / total) * 100 : 0)
    }
  })

  // Recent Milestones: show completed or submitted tasks sorted by updatedAt
  const milestones = [...displayedTasks]
    .filter(t => t.status.toLowerCase() === "approved" || t.status.toLowerCase() === "submitted" || t.status.toLowerCase() === "revision")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  // Filtering
  const filteredTasks = displayedTasks.filter(t => {
    if (activeFilter === "all") return true
    if (activeFilter === "todo") return t.status.toLowerCase() === "pending"
    return t.status.toLowerCase() === activeFilter.toLowerCase()
  })

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (sortBy === "payment") {
      return b.paymentAmount - a.paymentAmount
    }
    return 0
  })

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return "TBD"
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  const formatTaskType = (typeStr: string) => {
    return typeStr
      .replace("_", " ")
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  const getTaskTypeIcon = (typeStr: string) => {
    const t = typeStr.toLowerCase()
    if (t.includes("color")) return Paintbrush
    if (t.includes("line") || t.includes("sketch") || t.includes("draw")) return PenTool
    if (t.includes("type") || t.includes("text")) return Type
    if (t.includes("translate")) return Languages
    if (t.includes("clean") || t.includes("erase")) return Eraser
    return FileText
  }

  const getStatusBadgeClass = (statusStr: string) => {
    const s = statusStr.toLowerCase()
    if (s === "in_progress") return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30"
    if (s === "submitted") return "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/30"
    if (s === "approved") return "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30"
    if (s === "revision") return "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30"
    return "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {selectedSeries !== null && (
        <button
          onClick={() => {
            setSelectedSeries(null)
            setActiveFilter("all")
          }}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors group font-semibold cursor-pointer mb-2"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Series Selection
        </button>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight" id="main-tasks-heading">
          {selectedSeries ? `${selectedSeries} Tasks` : "My Tasks"}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          {selectedSeries 
            ? `Manage your assigned production tasks for ${selectedSeries}.`
            : "Select a manga series to view and manage your assigned tasks."}
        </p>
      </div>

      {selectedSeries === null ? (
        seriesList.length === 0 ? (
          <Card className="bg-card border-border p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">No Series Found</h2>
            <p className="text-zinc-400 text-sm max-w-sm">
              You currently have no tasks assigned to any manga series.
            </p>
          </Card>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/50 text-[11px] text-zinc-500 uppercase font-extrabold tracking-wider">
                    <th className="py-4 px-6 w-20">Cover</th>
                    <th className="py-4 px-6">Manga Series</th>
                    <th className="py-4 px-6 w-60">Task Completion</th>
                    <th className="py-4 px-6 text-center w-24">Todo</th>
                    <th className="py-4 px-6 text-center w-24">Doing</th>
                    <th className="py-4 px-6 text-center w-24">Review</th>
                    <th className="py-4 px-6 text-center w-24">Revision</th>
                    <th className="py-4 px-6 text-center w-24">Total</th>
                    <th className="py-4 px-6 text-right w-32">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {seriesList.map((series) => {
                    const hasRevision = series.stats.revision > 0

                    return (
                    <tr
                      key={series.title}
                      onClick={() => setSelectedSeries(series.title)}
                      className={`group transition-colors duration-250 cursor-pointer text-sm ${
                        hasRevision
                          ? "bg-red-950/15 hover:bg-red-950/30 ring-1 ring-inset ring-red-900/50"
                          : "hover:bg-zinc-900/40"
                      }`}
                    >
                      {/* Cover image cell */}
                      <td className="py-4 px-6">
                        {series.coverImageUrl ? (
                          <div className={`w-10 h-14 relative rounded-lg overflow-hidden border bg-zinc-950 shadow-inner ${
                            hasRevision ? "border-red-600/70 shadow-red-950/50" : "border-zinc-800"
                          }`}>
                            <img
                              src={series.coverImageUrl.startsWith("http") ? series.coverImageUrl : `${API_BASE_URL}${series.coverImageUrl}`}
                              alt={series.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className={`w-10 h-14 rounded-lg border bg-zinc-950/60 flex items-center justify-center shadow-inner ${
                            hasRevision ? "border-red-600/70 text-red-400" : "border-zinc-850 text-zinc-650"
                          }`}>
                            <BookOpen className="w-4 h-4 opacity-50" />
                          </div>
                        )}
                      </td>

                      {/* Series Title cell */}
                      <td className={`py-4 px-6 font-bold transition-colors ${
                        hasRevision
                          ? "text-red-100 group-hover:text-red-200"
                          : "text-zinc-200 group-hover:text-primary"
                      }`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-base line-clamp-1">{series.title}</span>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                            hasRevision ? "text-red-300/80" : "text-zinc-500"
                          }`}>
                            <Library className={`w-3 h-3 opacity-70 ${
                              hasRevision ? "text-red-400" : "text-primary"
                            }`} /> Manga Series
                          </span>
                        </div>
                      </td>

                      {/* Progress bar cell */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs font-semibold text-zinc-400">
                            <span className={`font-mono ${hasRevision ? "text-red-400" : "text-primary"}`}>
                              {series.percentage}%
                            </span>
                          </div>
                          <Progress
                            value={series.percentage}
                            className={`h-1.5 bg-zinc-950 ${hasRevision ? "[&>div]:bg-red-500" : ""}`}
                          />
                        </div>
                      </td>

                      {/* Counts cells */}
                      <td className="py-4 px-6 text-center font-semibold text-zinc-400 font-mono">
                        {series.stats.pending > 0 ? (
                          <span className="text-zinc-300 bg-zinc-900/60 border border-zinc-850 px-2 py-0.5 rounded text-xs">
                            {series.stats.pending}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-zinc-400 font-mono">
                        {series.stats.inProgress > 0 ? (
                          <span className="text-purple-400 bg-purple-950/20 border border-purple-900/30 px-2 py-0.5 rounded text-xs animate-pulse">
                            {series.stats.inProgress}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-zinc-400 font-mono">
                        {series.stats.submitted > 0 ? (
                          <span className="text-cyan-400 bg-cyan-950/20 border border-cyan-900/30 px-2 py-0.5 rounded text-xs">
                            {series.stats.submitted}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold font-mono">
                        {series.stats.revision > 0 ? (
                          <span className="inline-flex min-w-7 items-center justify-center rounded border border-red-600/70 bg-red-950/70 px-2 py-0.5 text-xs font-extrabold text-red-200 shadow-[0_0_18px_rgba(239,68,68,0.28)]">
                            {series.stats.revision}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-zinc-300 font-mono">
                        <span className={`px-2 py-0.5 rounded border text-xs ${
                          hasRevision
                            ? "border-red-800/60 bg-red-950/40 text-red-200"
                            : "border-zinc-850 bg-zinc-900 text-zinc-400"
                        }`}>
                          {series.stats.total}
                        </span>
                      </td>

                      {/* Action cell */}
                      <td className="py-4 px-6 text-right">
                        <button className={`inline-flex items-center gap-1 text-xs font-bold group-hover:underline transition-all ${
                          hasRevision ? "text-red-300 hover:text-red-200" : "text-primary"
                        }`}>
                          <span>View Tasks</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Gmail-Style Tabs */}
          <div className="flex border-b border-zinc-850 bg-zinc-950/20 px-2 overflow-x-auto">
            {[
              { id: "all", label: "All Tasks", icon: ListTodo },
              { id: "todo", label: "Todo", icon: Clock },
              { id: "in_progress", label: "In Progress", icon: Play },
              { id: "submitted", label: "Submitted", icon: FileCheck },
              { id: "approved", label: "Approved", icon: Check },
              { id: "revision", label: "Revision", icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeFilter === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? "border-primary text-primary bg-primary/5" 
                      : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Gmail-Style Action Bar */}
          <div className="flex items-center justify-between py-2 px-4 bg-zinc-950/20 border border-zinc-850 rounded-xl text-xs text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-zinc-300">
                {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"} listed
              </span>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-select-trigger" className="bg-zinc-950 border-zinc-850 text-white text-xs h-7 w-36">
                  <SelectValue placeholder="Sort tasks" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-850 text-white">
                  <SelectItem value="dueDate" className="text-xs hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer">Due Date (Soonest)</SelectItem>
                  <SelectItem value="payment" className="text-xs hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer">Payout (Highest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sortedTasks.length === 0 ? (
            <Card className="bg-card border-border p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-white">No Tasks Found</h2>
              <p className="text-zinc-400 text-sm max-w-sm">
                No active tasks match the selected filter. Ensure you are looking at the correct category.
              </p>
            </Card>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl divide-y divide-zinc-900/60">
              {sortedTasks.map((task) => {
                const s = task.status.toLowerCase()
                const isCompleted = s === "approved"
                
                return (
                  <div 
                    key={task.taskId}
                    className="group/row flex items-center justify-between py-3.5 px-4 hover:bg-zinc-900/35 transition-colors duration-150 text-xs"
                  >
                    {/* Left: Status/TaskType Badge, Page Info */}
                    <div className="flex items-center gap-3 shrink-0">
                      {activeFilter === "all" ? (
                        /* Status Badge when showing all */
                        <Badge variant="secondary" className={`text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded ${getStatusBadgeClass(task.status)}`}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      ) : (
                        /* Task Type Badge with Icon when status is pre-filtered */
                        (() => {
                          const TypeIcon = getTaskTypeIcon(task.type)
                          return (
                            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-850 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider">
                              <TypeIcon className="w-3 h-3 text-zinc-550" />
                              <span>{formatTaskType(task.type)}</span>
                            </div>
                          )
                        })()
                      )}

                      {/* Page Info */}
                      <span className="text-zinc-500 font-mono text-[10px] min-w-[55px]">
                        P. #{task.pageNumber}
                      </span>

                      {task.seriesStatus?.toLowerCase() === "cancelled" && (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold px-1.5 py-0.5 shrink-0">
                          Series Cancelled
                        </Badge>
                      )}
                    </div>

                    {/* Middle: Title & Description snippet */}
                    <div className="flex-1 min-w-0 mx-4 flex items-baseline gap-2">
                      <span className={`text-zinc-200 truncate font-semibold text-[13px] ${isCompleted ? "line-through text-zinc-500" : ""}`}>
                        {task.title}
                      </span>
                      <span className="text-zinc-550 truncate text-[11px] font-normal">
                        — {task.description || "No description provided."}
                      </span>
                    </div>

                    {/* Right: Chapter, Payout, Date & Quick Hover Actions */}
                    <div className="flex items-center gap-4 shrink-0 ml-auto justify-end">
                      {/* Chapter Info */}
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Ch. {task.chapterNumber}
                      </span>

                      {/* Payout */}
                      <span className="text-primary font-bold font-mono text-xs min-w-[65px] text-right">
                        ${task.paymentAmount.toFixed(2)}
                      </span>

                      {/* Date (visible when not hovered) */}
                      <span className="text-xs text-zinc-500 font-semibold w-[90px] text-right group-hover/row:hidden">
                        {formatDueDate(task.dueDate)}
                      </span>

                      {/* Actions (visible on hover) */}
                      <div className="hidden group-hover/row:flex items-center gap-1.5 min-w-[90px] justify-end">
                        {s !== "cancelled" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenResources(task.taskId)}
                            disabled={loadingResource && loadingTaskId === task.taskId}
                            title="View Resources"
                            className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg cursor-pointer"
                          >
                            {loadingResource && loadingTaskId === task.taskId ? (
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        )}

                        {(s === "pending" || s === "revision") && (
                          <Button
                            id={`start-task-btn-${task.taskId}`}
                            onClick={() => handleStartTask(task.taskId)}
                            disabled={startingTaskId === task.taskId || task.seriesStatus?.toLowerCase() === "cancelled"}
                            size="sm"
                            className="bg-primary hover:bg-primary-container text-background font-extrabold text-[10px] h-7 px-2.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {startingTaskId === task.taskId ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </>
                            )}
                          </Button>
                        )}

                        {s === "in_progress" && (
                          <Link href={`/submit?taskId=${task.taskId}`} passHref>
                            <Button
                              id={`open-files-btn-${task.taskId}`}
                              className="bg-primary hover:bg-primary-container text-background font-bold text-[10px] h-7 px-2 rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              Open
                            </Button>
                          </Link>
                        )}

                        {(s === "submitted" || s === "approved") && (
                          <Link href={`/submit?taskId=${task.taskId}`} passHref>
                            <Button
                              id={`view-submission-btn-${task.taskId}`}
                              variant="outline"
                              className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 font-bold text-[10px] h-7 px-2 rounded-lg transition-all cursor-pointer"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation and Preview Modal */}
      <Dialog open={isResourceModalOpen} onOpenChange={setIsResourceModalOpen}>
        <DialogContent className="flex max-h-[92vh] w-[min(92vw,860px)] max-w-none flex-col overflow-hidden bg-zinc-950/95 border border-zinc-800 text-white backdrop-blur-md shadow-2xl rounded-2xl p-0 animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="shrink-0 space-y-1.5 border-b border-zinc-800/50 p-5 pb-3">
            <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-400 animate-bounce" />
              Task Resources & Download Confirmation
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Preview the original manga page and download the resource.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {selectedTaskResource && (
              <div className="space-y-4">
                <div className="relative overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-center group">
                  {selectedTaskResource.imageUrl ? (
                    <div className="relative inline-block max-h-[58vh] max-w-full align-middle">
                      <img
                        src={selectedTaskResource.imageUrl.startsWith("http") ? selectedTaskResource.imageUrl : `${API_BASE_URL}${selectedTaskResource.imageUrl}`}
                        alt="Manga Page Original Preview"
                        className="block max-h-[58vh] max-w-full rounded-lg object-contain"
                      />
                      {(selectedTaskResource.revisionAnnotations || []).map((annotation) => {
                        const isBox = annotation.width && annotation.height
                        return (
                          <div
                            key={annotation.annotationId}
                            className="absolute z-20 border-2 border-amber-400 bg-amber-400/20 shadow-[0_0_18px_rgba(251,191,36,0.45)]"
                            style={{
                              left: `${annotation.x}%`,
                              top: `${annotation.y}%`,
                              width: isBox ? `${annotation.width}%` : "18px",
                              height: isBox ? `${annotation.height}%` : "18px",
                              borderRadius: isBox ? "6px" : "9999px",
                            }}
                            title={annotation.body}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-[320px] flex-col items-center justify-center text-zinc-650">
                      <BookOpen className="w-12 h-12 mb-2 opacity-55 animate-pulse" />
                      <span className="text-xs">No preview image available</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-850 space-y-2">
                  <div className="flex justify-between gap-4 text-xs">
                    <span className="text-zinc-500">Series Title</span>
                    <span className="truncate font-semibold text-zinc-200">{selectedTaskResource.seriesTitle || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Chapter</span>
                    <span className="font-semibold text-zinc-200">Ch. {selectedTaskResource.chapterNumber ?? "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Page Number</span>
                    <span className="font-semibold text-primary">Page {selectedTaskResource.pageNumber ?? "N/A"}</span>
                  </div>
                </div>

                {(selectedTaskResource.revisionAnnotations || []).length > 0 && (
                  <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-4 text-xs">
                    <p className="mb-2 font-bold uppercase tracking-wider text-amber-300">Revision note</p>
                    <p className="leading-relaxed text-amber-100">
                      {selectedTaskResource.revisionNote || selectedTaskResource.revisionAnnotations?.[0]?.body}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-zinc-800/50 p-4 flex gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsResourceModalOpen(false)}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl font-semibold text-xs py-2 px-4 border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedTaskResource) {
                  const ext = selectedTaskResource.imageUrl ? selectedTaskResource.imageUrl.split('.').pop() || 'png' : 'png';
                  const title = selectedTaskResource.seriesTitle?.replace(/\s+/g, "_") || "manga_page";
                  const fileName = `${title}_Ch${selectedTaskResource.chapterNumber}_Page${selectedTaskResource.pageNumber}.${ext}`;
                  handleDownloadImage(selectedTaskResource.imageUrl, fileName);
                }
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-xs py-2 px-5 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ask Clarification Dialog */}
      <Dialog open={isAskDialogOpen} onOpenChange={setIsAskDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-950/95 border border-zinc-800 text-white backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Ask for Clarification
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Send a clarification question to {taskToAsk?.assignerName || "Creator"}. They will be notified immediately.
            </DialogDescription>
          </DialogHeader>

          {taskToAsk && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="ask-message" className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  Clarification Message
                </Label>
                <Textarea
                  id="ask-message"
                  value={askMessage}
                  onChange={(e) => setAskMessage(e.target.value)}
                  placeholder="Type your question here..."
                  className="bg-zinc-900/60 border-zinc-800 text-white placeholder-zinc-650 focus-visible:ring-primary min-h-[100px] resize-none text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 flex gap-2 sm:gap-0 border-t border-zinc-800/50">
            <Button
              variant="ghost"
              onClick={() => {
                setIsAskDialogOpen(false)
                setTaskToAsk(null)
                setAskMessage("")
              }}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl font-semibold text-xs py-2 px-4 border border-transparent hover:border-zinc-800 transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAsk}
              disabled={askingTaskId === taskToAsk?.taskId || !askMessage.trim()}
              className="bg-primary hover:bg-primary/95 text-background font-bold text-xs py-2 px-5 rounded-xl shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {askingTaskId === taskToAsk?.taskId ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Question
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
