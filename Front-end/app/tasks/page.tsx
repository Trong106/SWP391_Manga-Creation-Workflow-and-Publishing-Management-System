"use client"

import { useState, useEffect } from "react"
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
  Coins,
  ChevronRight,
  Eye,
  FileCheck,
  Download,
  BookOpen,
  MessageCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
}

export default function AssistantTasksPage() {
  const { user, role, token } = useAuth()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("dueDate")
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null)

  // State for Resource Modal
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [selectedTaskResource, setSelectedTaskResource] = useState<any | null>(null)
  const [loadingResource, setLoadingResource] = useState(false)
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)
  const [askingTaskId, setAskingTaskId] = useState<string | null>(null)

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

      toast.success("Task started successfully! Status updated to In Progress.")
      fetchTasks()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Something went wrong starting this task.")
    } finally {
      setStartingTaskId(null)
    }
  }

  const handleAskMangaka = async (task: Task) => {
    if (!token) return
    const message = window.prompt(
      `Ask ${task.assignerName} for clarification:`,
      `Please clarify the requirement for "${task.title}" on page ${task.pageNumber}.`
    )
    if (message === null) return

    try {
      setAskingTaskId(task.taskId)
      const res = await fetch(`${API_BASE_URL}/api/tasks/${task.taskId}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Failed to send clarification request.")
      }

      toast.success(`Notification sent to ${task.assignerName}.`)
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
  const approvedTasks = tasks.filter(t => t.status.toLowerCase() === "approved")
  const submittedTasks = tasks.filter(t => t.status.toLowerCase() === "submitted")
  
  // Earnings
  const approvedPayout = approvedTasks.reduce((sum, t) => sum + t.paymentAmount, 0)
  const pendingReview = submittedTasks.reduce((sum, t) => sum + t.paymentAmount, 0)

  // Active Progress by Series
  const seriesGroups: Record<string, { approved: number; total: number }> = {}
  tasks.forEach(t => {
    const sTitle = t.seriesTitle || "Uncategorized"
    if (!seriesGroups[sTitle]) {
      seriesGroups[sTitle] = { approved: 0, total: 0 }
    }
    seriesGroups[sTitle].total++
    if (t.status.toLowerCase() === "approved") {
      seriesGroups[sTitle].approved++
    }
  })
  
  const activeProgress = Object.entries(seriesGroups).map(([title, stats]) => ({
    title,
    percentage: Math.round((stats.approved / stats.total) * 100)
  }))

  // Recent Milestones: show completed or submitted tasks sorted by updatedAt
  const milestones = [...tasks]
    .filter(t => t.status.toLowerCase() === "approved" || t.status.toLowerCase() === "submitted" || t.status.toLowerCase() === "revision")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  // Filtering
  const filteredTasks = tasks.filter(t => {
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

  const getStatusBadgeClass = (statusStr: string) => {
    const s = statusStr.toLowerCase()
    if (s === "in_progress") return "bg-purple-950/40 text-purple-400 border border-purple-800/30"
    if (s === "submitted") return "bg-cyan-950/40 text-cyan-400 border border-cyan-800/30"
    if (s === "approved") return "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
    if (s === "revision") return "bg-red-950/40 text-red-400 border border-red-800/30"
    return "bg-zinc-900 text-zinc-400 border border-zinc-800"
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight" id="main-tasks-heading">My Tasks</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your assigned production tasks across active series.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main tasks list (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Filters and Sorting Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
            <div className="flex flex-wrap gap-1">
              {["all", "todo", "in_progress", "submitted", "approved", "revision"].map((filter) => (
                <Button
                  key={filter}
                  id={`filter-btn-${filter}`}
                  onClick={() => setActiveFilter(filter)}
                  variant={activeFilter === filter ? "default" : "ghost"}
                  className={`text-xs font-semibold px-3 py-1.5 h-auto capitalize ${
                    activeFilter === filter 
                      ? "bg-primary text-primary-foreground" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  {filter === "todo" ? "Todo" : filter.replace("_", " ")}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-400 font-medium">Sort:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-select-trigger" className="bg-zinc-950 border-zinc-850 text-white text-xs h-9 w-44">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedTasks.map((task) => {
                const s = task.status.toLowerCase()
                return (
                  <Card key={task.taskId} className="bg-card border-border hover:border-primary/40 hover:shadow-[0_0_15px_rgba(73,252,220,0.05)] transition-all flex flex-col gap-4 p-5 group relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 ${getStatusBadgeClass(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </Badge>
                          <span className="text-zinc-500 text-[10px] font-mono">Page #{task.pageNumber}</span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-150 group-hover:text-primary transition-colors mt-1.5 leading-snug line-clamp-1">{task.title}</h3>
                        <p className="text-xs font-semibold text-primary">{task.seriesTitle || "No Series Specified"}</p>
                        <p className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                          Chapter {task.chapterNumber} {task.chapterTitle ? `: ${task.chapterTitle}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold text-base font-mono">${task.paymentAmount.toFixed(2)}</p>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Payout</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3.5 border-y border-zinc-900/60 text-xs">
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider">Type</p>
                        <p className="font-semibold text-zinc-300 mt-0.5">{formatTaskType(task.type)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider">Due Date</p>
                        <p className="font-semibold text-zinc-300 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          {formatDueDate(task.dueDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2.5">
                      <div className="flex items-center gap-2">
                        {s === "in_progress" && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        )}
                        <span className="text-xs font-semibold text-zinc-300">
                          {s === "pending" && "Status: Todo"}
                          {s === "in_progress" && "Status: In Progress"}
                          {s === "submitted" && "Status: Submitted"}
                          {s === "approved" && "Status: Approved"}
                          {s === "revision" && "Status: Revision Required"}
                          {s === "cancelled" && "Status: Cancelled"}
                        </span>
                      </div>

                      {/* Action buttons based on task state */}
                      <div className="flex items-center gap-2">
                        {s !== "cancelled" && (
                          <Button
                            variant="outline"
                            onClick={() => handleOpenResources(task.taskId)}
                            disabled={loadingResource && loadingTaskId === task.taskId}
                            className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 font-semibold text-xs h-8 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {loadingResource && loadingTaskId === task.taskId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            Resources
                          </Button>
                        )}

                        {(s === "pending" || s === "revision") && (
                          <Button
                            id={`start-task-btn-${task.taskId}`}
                            onClick={() => handleStartTask(task.taskId)}
                            disabled={startingTaskId === task.taskId}
                            className="bg-primary hover:bg-primary-container text-background font-bold text-xs h-8 px-4 rounded-lg shadow-sm transition-all cursor-pointer"
                          >
                            {startingTaskId === task.taskId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 mr-1" />
                                Start Task
                              </>
                            )}
                          </Button>
                        )}

                        {s === "in_progress" && (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleAskMangaka(task)}
                              disabled={askingTaskId === task.taskId}
                              className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 font-semibold text-xs h-8 px-3 rounded-lg transition-all"
                            >
                              {askingTaskId === task.taskId ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              ) : (
                                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                              )}
                              Ask
                            </Button>
                            <Link href={`/submit?taskId=${task.taskId}`} passHref>
                              <Button
                                id={`open-files-btn-${task.taskId}`}
                                className="bg-primary hover:bg-primary-container text-background font-bold text-xs h-8 px-4 rounded-lg shadow-sm transition-all cursor-pointer"
                              >
                                Open Files
                              </Button>
                            </Link>
                          </>
                        )}

                        {(s === "submitted" || s === "approved") && (
                          <Link href={`/submit?taskId=${task.taskId}`} passHref>
                            <Button
                              id={`view-submission-btn-${task.taskId}`}
                              variant="outline"
                              className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 font-bold text-xs h-8 px-4 rounded-lg transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Submission
                            </Button>
                          </Link>
                        )}

                        {s === "cancelled" && (
                          <Button
                            disabled
                            variant="ghost"
                            className="text-zinc-500 cursor-default opacity-50 font-bold text-xs h-8 px-4"
                          >
                            <Lock className="w-3.5 h-3.5 mr-1" />
                            Cancelled
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Right side progress panel (4 cols) */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          {/* Weekly Earnings Card */}
          <Card className="bg-card border-border overflow-hidden relative">
            <div className="h-1.5 bg-primary w-full"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Weekly Earnings
              </CardTitle>
              <CardDescription className="text-zinc-550 text-xs">Accumulated task payouts for this review cycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-xl space-y-1">
                <p className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider">Approved Payout</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary font-mono">${approvedPayout.toFixed(2)}</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  {/* Visual ratio of approved compared to total active */}
                  <div 
                    className="bg-primary h-full transition-all duration-550" 
                    style={{ width: `${tasks.length > 0 ? (approvedTasks.length / tasks.length) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-900/60 p-4 rounded-xl">
                <p className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider">Pending Review</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-zinc-300 font-mono">${pendingReview.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Series Progress */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Active Progress
              </CardTitle>
              <CardDescription className="text-zinc-550 text-xs">Your task completion percentage per active series.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {activeProgress.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">No active progress data.</div>
              ) : (
                activeProgress.map((series) => (
                  <div key={series.title} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-zinc-300">
                      <span className="truncate max-w-[200px]">{series.title}</span>
                      <span className="text-primary font-mono">{series.percentage}%</span>
                    </div>
                    <Progress value={series.percentage} className="h-1.5 bg-zinc-900" />
                  </div>
                ))
              )}

              {/* Recent Milestones inside side panel */}
              {milestones.length > 0 && (
                <div className="mt-8 pt-6 border-t border-zinc-900/60 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-250 uppercase tracking-wider border-l-2 border-primary pl-2.5">
                    Recent Milestones
                  </h4>
                  <div className="space-y-4">
                    {milestones.map((task) => (
                      <div key={task.taskId} className="flex gap-3 items-start text-xs">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          task.status.toLowerCase() === "approved" 
                            ? "bg-primary animate-pulse" 
                            : task.status.toLowerCase() === "submitted"
                            ? "bg-cyan-400"
                            : "bg-red-400"
                        }`} />
                        <div>
                          <p className="font-semibold text-zinc-250 leading-tight">
                            {task.status.toLowerCase() === "approved" ? "Approved" : task.status.toLowerCase() === "submitted" ? "Submitted" : "Revision"}: {task.title}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {task.seriesTitle} • Ch. {task.chapterNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Confirmation and Preview Modal */}
      <Dialog open={isResourceModalOpen} onOpenChange={setIsResourceModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950/95 border border-zinc-800 text-white backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-400 animate-bounce" />
              Task Resources & Download Confirmation
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Preview the original manga page and download the resource.
            </DialogDescription>
          </DialogHeader>

          {selectedTaskResource && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center p-2 group">
                <AspectRatio ratio={3 / 4} className="w-full relative overflow-hidden rounded-lg">
                  {selectedTaskResource.imageUrl ? (
                    <img
                      src={selectedTaskResource.imageUrl.startsWith("http") ? selectedTaskResource.imageUrl : `${API_BASE_URL}${selectedTaskResource.imageUrl}`}
                      alt="Manga Page Original Preview"
                      className="w-full h-full object-contain rounded-lg transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-650">
                      <BookOpen className="w-12 h-12 mb-2 opacity-55 animate-pulse" />
                      <span className="text-xs">No preview image available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <span className="text-[10px] text-zinc-350 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-xs border border-zinc-800">
                      Hover to zoom image
                    </span>
                  </div>
                </AspectRatio>
              </div>

              <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-850 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Series Title</span>
                  <span className="font-semibold text-zinc-200">{selectedTaskResource.seriesTitle || "N/A"}</span>
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
            </div>
          )}

          <DialogFooter className="pt-4 flex gap-2 sm:gap-0 border-t border-zinc-800/50">
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
    </div>
  )
}
