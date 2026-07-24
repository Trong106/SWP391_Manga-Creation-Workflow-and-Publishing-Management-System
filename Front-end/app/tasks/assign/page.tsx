"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import {
  Layers,
  Users,
  Plus,
  DollarSign,
  Loader2,
  AlertCircle,
  BookOpen,
  FileText,
  Clock,
  X,
  Crosshair,
  Eraser,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Series {
  seriesId: string
  title: string
  status: string
  coverImageUrl?: string
}

interface Chapter {
  chapterId: string
  chapterNumber: number
  title?: string
  status: string
}

interface Page {
  pageId: string
  pageNumber: number
  status: string
  currentImageUrl?: string
  imageUrl?: string
}

interface TaskRecord {
  taskId: string
  title: string
  description?: string
  type: string
  pageId: string
  pageNumber: number
  chapterNumber: number
  seriesTitle?: string
  assigneeId?: string
  assigneeName?: string
  status: string
  dueDate?: string
  paymentAmount: number
  createdAt: string
  regionId?: string
  regionType?: string
  regionX?: number
  regionY?: number
  regionWidth?: number
  regionHeight?: number
}

interface Assistant {
  id: string
  name: string
  avatar?: string
  specialty?: string
  rating?: number
  tasksCompleted: number
  currentTasks: number
  status: string
}

interface CreateTaskForm {
  title: string
  description: string
  type: string
  assigneeId: string
  dueDate: string
  pageId: string
}

interface RegionSelection {
  x: number
  y: number
  width: number
  height: number
}

const TASK_TYPES = [
  { value: "line_art", label: "Line Art", basePay: 20 },
  { value: "background", label: "Background", basePay: 15 },
  { value: "effects", label: "Effects", basePay: 10 },
  { value: "coloring", label: "Coloring", basePay: 25 },
  { value: "lettering", label: "Lettering", basePay: 12 },
]

const TASK_PRICE_TABLE = TASK_TYPES.reduce<Record<string, number>>((acc, taskType) => {
  acc[taskType.value] = taskType.basePay
  return acc
}, {})

const TASK_TEMPLATES = [
  {
    label: "Background Cleanup",
    title: "Background cleanup",
    type: "background",
    description: "Clean perspective lines, remove rough sketch artifacts, and prepare the background layer for the next production pass.",
  },
  {
    label: "Line Art Polish",
    title: "Line art polish",
    type: "line_art",
    description: "Refine character line weight, close open strokes, and keep line art ready for screentone/coloring.",
  },
  {
    label: "Lettering Pass",
    title: "Lettering and SFX pass",
    type: "lettering",
    description: "Place dialogue, sound effects, and balloon text while preserving panel readability.",
  },
]

const typeColors: Record<string, string> = {
  line_art: "bg-green-500/20 text-green-400 border-green-700/30",
  background: "bg-blue-500/20 text-blue-400 border-blue-700/30",
  effects: "bg-yellow-500/20 text-yellow-400 border-yellow-700/30",
  coloring: "bg-purple-500/20 text-purple-400 border-purple-700/30",
  lettering: "bg-cyan-500/20 text-cyan-400 border-cyan-700/30",
}

const statusColors: Record<string, string> = {
  pending: "bg-zinc-800 text-zinc-300",
  in_progress: "bg-purple-900/40 text-purple-300",
  submitted: "bg-cyan-900/40 text-cyan-300",
  approved: "bg-emerald-900/40 text-emerald-300",
  revision: "bg-red-900/40 text-red-300",
  cancelled: "bg-zinc-900 text-zinc-500",
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TaskAssignPage() {
  const { token, role } = useAuth()

  const [series, setSeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("")
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>("")
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>("")
  const [pageTasks, setPageTasks] = useState<TaskRecord[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [querySeriesId, setQuerySeriesId] = useState("")
  const [queryChapterId, setQueryChapterId] = useState("")
  const [queryTargetApplied, setQueryTargetApplied] = useState(false)

  const [loadingSeries, setLoadingSeries] = useState(true)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingPages, setLoadingPages] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reTaskDialogOpen, setReTaskDialogOpen] = useState(false)
  const [reTaskTarget, setReTaskTarget] = useState<TaskRecord | null>(null)
  const [reTaskDueDate, setReTaskDueDate] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateTaskForm>({
    title: "",
    description: "",
    type: "",
    assigneeId: "",
    dueDate: "",
    pageId: "",
  })
  const [selectedRegion, setSelectedRegion] = useState<RegionSelection | null>(null)
  const [draftRegion, setDraftRegion] = useState<RegionSelection | null>(null)
  const [isDrawingRegion, setIsDrawingRegion] = useState(false)
  const [inspectTask, setInspectTask] = useState<TaskRecord | null>(null)
  const drawStartRef = useRef<{ x: number; y: number } | null>(null)

  const authHeader = { Authorization: `Bearer ${token}` }

  // ── Load series for the current mangaka ──────────────────────────────────
  const loadSeries = useCallback(async () => {
    if (!token) return
    try {
      setLoadingSeries(true)
      const res = await fetch(`${API_BASE_URL}/api/series`, { headers: authHeader })
      if (!res.ok) throw new Error("Failed to load series")
      const data: Series[] = await res.json()
      setSeries(data)
    } catch (err) {
      toast.error("Failed to load your series.")
    } finally {
      setLoadingSeries(false)
    }
  }, [token])

  // ── Load chapters when series changes ────────────────────────────────────
  const loadChapters = useCallback(async (seriesId: string) => {
    if (!token || !seriesId) return
    try {
      setLoadingChapters(true)
      setChapters([])
      setSelectedChapterId("")
      setPages([])
      setSelectedPageId("")
      setPageTasks([])
      const res = await fetch(`${API_BASE_URL}/api/series/${seriesId}/chapters`, { headers: authHeader })
      if (!res.ok) throw new Error("Failed to load chapters")
      const data: Chapter[] = await res.json()
      setChapters(data)
    } catch (err) {
      toast.error("Failed to load chapters.")
    } finally {
      setLoadingChapters(false)
    }
  }, [token])

  // ── Load pages when chapter changes ──────────────────────────────────────
  const loadPages = useCallback(async (chapterId: string) => {
    if (!token || !chapterId) return
    try {
      setLoadingPages(true)
      setPages([])
      setSelectedPageId("")
      setPageTasks([])
      const res = await fetch(`${API_BASE_URL}/api/chapters/${chapterId}/pages`, { headers: authHeader })
      if (!res.ok) throw new Error("Failed to load pages")
      const data: Page[] = await res.json()
      setPages(data)
    } catch (err) {
      toast.error("Failed to load pages.")
    } finally {
      setLoadingPages(false)
    }
  }, [token])

  // ── Load tasks for selected page ──────────────────────────────────────────
  const loadPageTasks = useCallback(async (pageId: string) => {
    if (!token || !pageId) return
    try {
      setLoadingTasks(true)
      const res = await fetch(`${API_BASE_URL}/api/pages/${pageId}/tasks`, { headers: authHeader })
      if (!res.ok) throw new Error("Failed to load tasks")
      const data: TaskRecord[] = await res.json()
      setPageTasks(data)
    } catch (err) {
      toast.error("Failed to load tasks for this page.")
    } finally {
      setLoadingTasks(false)
    }
  }, [token])

  // ── Load assistants ───────────────────────────────────────────────────────
  const loadAssistants = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/assistants`, { headers: authHeader })
      if (!res.ok) throw new Error("Failed to load assistants")
      const data = await res.json()
      // Map the assistant data from either API endpoint format
      const mapped: Assistant[] = (Array.isArray(data) ? data : []).map((a: any) => ({
        id: a.assistantId ?? a.id,
        name: a.fullName ?? a.name,
        avatar: a.avatar,
        specialty: a.specialty,
        rating: a.rating,
        tasksCompleted: a.tasksCompleted ?? 0,
        currentTasks: a.currentTasks ?? 0,
        status: a.status ?? "active",
      }))
      setAssistants(mapped)
    } catch (err) {
      // Non-critical - assistants list just won't show
      console.error("Failed to load assistants:", err)
    }
  }, [token])

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setQuerySeriesId(params.get("seriesId") ?? "")
    setQueryChapterId(params.get("chapterId") ?? "")
  }, [])
  useEffect(() => { loadSeries(); loadAssistants() }, [loadSeries, loadAssistants])
  useEffect(() => {
    if (querySeriesId && !queryTargetApplied) {
      setSelectedSeriesId(querySeriesId)
    }
  }, [querySeriesId, queryTargetApplied])
  useEffect(() => { if (selectedSeriesId) loadChapters(selectedSeriesId) }, [selectedSeriesId, loadChapters])
  useEffect(() => { if (selectedChapterId) loadPages(selectedChapterId) }, [selectedChapterId, loadPages])
  useEffect(() => { if (selectedPageId) loadPageTasks(selectedPageId) }, [selectedPageId, loadPageTasks])
  useEffect(() => {
    if (!queryChapterId || queryTargetApplied || chapters.length === 0) return
    if (chapters.some((chapter) => chapter.chapterId === queryChapterId)) {
      setSelectedChapterId(queryChapterId)
    }
  }, [chapters, queryChapterId, queryTargetApplied])
  useEffect(() => {
    if (!queryChapterId || queryTargetApplied || selectedChapterId !== queryChapterId || pages.length === 0) return
    const firstOpenPage = pages.find((page) => page.status?.toLowerCase() !== "approved") ?? pages[0]
    setSelectedPageId(firstOpenPage.pageId)
    setQueryTargetApplied(true)
  }, [pages, queryChapterId, queryTargetApplied, selectedChapterId])
  useEffect(() => {
    setSelectedRegion(null)
    setDraftRegion(null)
    setIsDrawingRegion(false)
    drawStartRef.current = null
  }, [selectedPageId])
  useEffect(() => {
    if (!isDialogOpen) setFormError(null)
  }, [isDialogOpen])

  // ── Create task ───────────────────────────────────────────────────────────
  const getTodayInputDate = () => {
    const now = new Date()
    const month = `${now.getMonth() + 1}`.padStart(2, "0")
    const day = `${now.getDate()}`.padStart(2, "0")
    return `${now.getFullYear()}-${month}-${day}`
  }
  const formatInputDateForMessage = (dateValue: string) => {
    const [year, month, day] = dateValue.split("-")
    return `${month}/${day}/${year}`
  }
  const todayDate = getTodayInputDate()
  const updateForm = (patch: Partial<CreateTaskForm>) => {
    setFormError(null)
    setForm((current) => ({ ...current, ...patch }))
  }

  const getFullImageUrl = (path?: string) => {
    if (!path) return ""
    if (path.startsWith("http")) return path
    return `${API_BASE_URL}${path}`
  }

  const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

  const getPointerPercent = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: clampPercent(((event.clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((event.clientY - rect.top) / rect.height) * 100),
    }
  }

  const handleRegionPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedPage) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getPointerPercent(event)
    drawStartRef.current = point
    setDraftRegion({ x: point.x, y: point.y, width: 0, height: 0 })
    setIsDrawingRegion(true)
    setFormError(null)
  }

  const handleRegionPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingRegion || !drawStartRef.current) return
    const point = getPointerPercent(event)
    const start = drawStartRef.current
    setDraftRegion({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    })
  }

  const finishRegionDrawing = () => {
    if (!isDrawingRegion) return
    setIsDrawingRegion(false)
    drawStartRef.current = null
    if (draftRegion && draftRegion.width >= 2 && draftRegion.height >= 2) {
      setSelectedRegion({
        x: Number(draftRegion.x.toFixed(2)),
        y: Number(draftRegion.y.toFixed(2)),
        width: Number(draftRegion.width.toFixed(2)),
        height: Number(draftRegion.height.toFixed(2)),
      })
    } else if (draftRegion) {
      toast.error("Please drag a larger region on the manga page.")
    }
    setDraftRegion(null)
  }

  const clearSelectedRegion = () => {
    setSelectedRegion(null)
    setDraftRegion(null)
    setIsDrawingRegion(false)
    drawStartRef.current = null
  }

  const handleCreateTask = async () => {
    setFormError(null)

    const missingFields = [
      !form.title.trim() ? "Task Title" : null,
      !form.type ? "Task Type" : null,
      !form.assigneeId ? "Assign To" : null,
      !form.dueDate ? "Due Date" : null,
    ].filter(Boolean)

    if (missingFields.length > 0) {
      const message = `Please fill in: ${missingFields.join(", ")}.`
      setFormError(message)
      toast.error(message)
      return
    }
    if (!selectedPageId) {
      const message = "Please select a target page before creating a task."
      setFormError(message)
      toast.error(message)
      return
    }
    if (!selectedRegion) {
      const message = "Please drag-select a region on the manga page before creating a task."
      setFormError(message)
      toast.error(message)
      return
    }
    if (form.dueDate && form.dueDate < todayDate) {
      const message = `Value must be ${formatInputDateForMessage(todayDate)} or later.`
      setFormError(message)
      toast.error(message)
      return
    }
    const basePay = TASK_PRICE_TABLE[form.type] ?? 0
    try {
      setSubmitting(true)
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        assigneeId: form.assigneeId,
        dueDate: form.dueDate || null,
        paymentAmount: basePay,
        region: {
          type: form.type || "custom",
          x: selectedRegion.x,
          y: selectedRegion.y,
          width: selectedRegion.width,
          height: selectedRegion.height,
        },
      }
      const res = await fetch(`${API_BASE_URL}/api/pages/${selectedPageId}/tasks`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Failed to create task")
      }
      toast.success("Task created and assigned successfully!")
      setFormError(null)
      setIsDialogOpen(false)
      setForm({ title: "", description: "", type: "", assigneeId: "", dueDate: "", pageId: "" })
      clearSelectedRegion()
      loadPageTasks(selectedPageId)
    } catch (err: any) {
      const message = err.message || "Failed to create task."
      setFormError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete (cancel) task ─────────────────────────────────────────────────
  const handleCancelTask = async (taskId: string) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (!res.ok) throw new Error("Failed to cancel task")
      toast.success("Task cancelled.")
      loadPageTasks(selectedPageId)
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel task.")
    }
  }

  const openReTaskDialog = (task: TaskRecord) => {
    setReTaskTarget(task)
    setReTaskDueDate(task.dueDate || todayDate)
    setReTaskDialogOpen(true)
  }

  const handleReTask = async () => {
    if (!token || !reTaskTarget) return
    if (!reTaskDueDate) {
      toast.error("Please choose a new due date.")
      return
    }
    if (reTaskDueDate < todayDate) {
      toast.error(`Value must be ${formatInputDateForMessage(todayDate)} or later.`)
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${API_BASE_URL}/api/tasks/${reTaskTarget.taskId}/re-task`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ newDueDate: reTaskDueDate }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Failed to re-task.")
      }
      toast.success("Task moved back to Todo for the original assistant.")
      setReTaskDialogOpen(false)
      setReTaskTarget(null)
      setReTaskDueDate("")
      loadPageTasks(selectedPageId)
    } catch (err: any) {
      toast.error(err.message || "Failed to re-task.")
    } finally {
      setSubmitting(false)
    }
  }

  const applyTaskTemplate = (template: typeof TASK_TEMPLATES[number]) => {
    setForm((current) => ({
      ...current,
      title: template.title,
      type: template.type,
      description: template.description,
    }))
    setFormError(null)
  }

  // ── Guard: only mangaka ───────────────────────────────────────────────────
  if (role !== "mangaka") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
        <p className="text-zinc-400 text-sm">Task Assignment is reserved for Mangaka accounts.</p>
      </div>
    )
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const selectedSeries = series.find(s => s.seriesId === selectedSeriesId)
  const selectedChapter = chapters.find(c => c.chapterId === selectedChapterId)
  const selectedPage = pages.find(p => p.pageId === selectedPageId)
  const selectedPageImageUrl = getFullImageUrl(selectedPage?.currentImageUrl ?? selectedPage?.imageUrl)
  const inspectTaskHasRegion =
    inspectTask?.regionX != null &&
    inspectTask?.regionY != null &&
    inspectTask?.regionWidth != null &&
    inspectTask?.regionHeight != null
  const isSelectedPageApproved = selectedPage?.status?.toLowerCase() === "approved"
  const selectedTaskType = TASK_TYPES.find(t => t.value === form.type)
  const formBasePay = selectedTaskType?.basePay ?? 0

  const canReTaskPage = selectedPage?.status?.toLowerCase() === "revision"
  const requiredTaskTypes = ["line_art", "background", "lettering"]
  const requiredTaskCount = requiredTaskTypes.filter(type => pageTasks.some(task => task.type === type)).length

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Page Header */}
      <div className="mb-2 stagger-item">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3" id="task-assign-heading">
          <Layers className="w-8 h-8 text-primary" />
          Task Assignment
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Assign production tasks to your assistants for each page in a chapter.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Selection + Task List ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Series / Chapter / Page Selector */}
          <Card className="bg-card border-border stagger-item">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Select Target
              </CardTitle>
              <CardDescription className="text-xs">Choose the series, chapter, and page to manage tasks for.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSeries ? (
                <div className="flex items-center gap-2 text-zinc-400 text-sm py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading your series...
                </div>
              ) : series.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4">No series found. Create a series first.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Series */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">Series</Label>
                    <Select value={selectedSeriesId} onValueChange={setSelectedSeriesId}>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white text-sm">
                        <SelectValue placeholder="Select series" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                        {series.map(s => (
                          <SelectItem key={s.seriesId} value={s.seriesId} className="text-sm hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer">
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Chapter */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">Chapter</Label>
                    {loadingChapters ? (
                      <div className="h-10 flex items-center text-zinc-400 text-xs gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <Select value={selectedChapterId} onValueChange={setSelectedChapterId} disabled={chapters.length === 0}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white text-sm">
                          <SelectValue placeholder={chapters.length === 0 ? "No chapters" : "Select chapter"} />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white max-h-60">
                          {chapters.map(c => (
                            <SelectItem key={c.chapterId} value={c.chapterId} className="text-sm hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer">
                              Ch. {c.chapterNumber}{c.title ? ` — ${c.title}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Page */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400 uppercase font-semibold tracking-wider">Page</Label>
                    {loadingPages ? (
                      <div className="h-10 flex items-center text-zinc-400 text-xs gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                      </div>
                    ) : (
                      <Select value={selectedPageId} onValueChange={setSelectedPageId} disabled={pages.length === 0}>
                        <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white text-sm">
                          <SelectValue placeholder={pages.length === 0 ? "No pages" : "Select page"} />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white max-h-60">
                          {pages.map(p => (
                            <SelectItem key={p.pageId} value={p.pageId} className="text-sm hover:bg-zinc-900 focus:bg-zinc-900 cursor-pointer">
                              Page {p.pageNumber}
                              {p.status !== "uploaded" ? ` (${p.status})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {!selectedPageId && !loadingSeries && series.length > 0 && (
            <Card className="bg-card border-border stagger-item">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Series Production Queue
                </CardTitle>
                <CardDescription className="text-xs">
                  Start by choosing a series, then drill down to the chapter and page that need production tasks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {series.map((item) => {
                    const isActive = item.seriesId === selectedSeriesId
                    return (
                      <button
                        key={item.seriesId}
                        type="button"
                        onClick={() => setSelectedSeriesId(item.seriesId)}
                        className={`group flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                          isActive
                            ? "border-primary/50 bg-primary/10"
                            : "border-zinc-900/70 bg-zinc-950/45 hover:border-primary/30 hover:bg-zinc-900/50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950">
                            {item.coverImageUrl ? (
                              <img
                                src={getFullImageUrl(item.coverImageUrl)}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <BookOpen className="h-5 w-5 text-zinc-600" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white group-hover:text-primary">{item.title}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Status: <span className="capitalize text-zinc-300">{item.status}</span>
                            </p>
                          </div>
                        </div>
                        <Badge className={isActive ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-300"}>
                          {isActive ? "Selected" : "Choose"}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task List for Selected Page */}
          <Card className="bg-card border-border stagger-item">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Tasks
                  {selectedPage && (
                    <span className="text-xs font-normal text-zinc-400 ml-1">
                      — Page {selectedPage.pageNumber}
                      {selectedChapter ? `, Ch. ${selectedChapter.chapterNumber}` : ""}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {!selectedPageId
                    ? "Select a page above to view and manage its tasks."
                    : `${pageTasks.length} task${pageTasks.length !== 1 ? "s" : ""} on this page.`}
                </CardDescription>
              </div>

              {/* Add Task Button */}
              {selectedPageId && isSelectedPageApproved ? (
                <Button
                  size="sm"
                  disabled
                  className="bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  title="Approved pages are locked and cannot receive new tasks."
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Page Approved
                </Button>
              ) : selectedPageId && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold btn-magnetic"
                      id="add-task-btn"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="flex h-[min(920px,calc(100dvh-2rem))] w-[min(760px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-white">
                    <DialogHeader className="shrink-0 border-b border-zinc-800/70 px-6 pb-4 pt-6">
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Assign a production task for Page {selectedPage?.pageNumber}
                        {selectedChapter ? `, Chapter ${selectedChapter.chapterNumber}` : ""}
                        {selectedSeries ? ` of "${selectedSeries.title}"` : ""}.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-zinc-300">Quick Templates</Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {TASK_TEMPLATES.map((template) => (
                            <Button
                              key={template.label}
                              type="button"
                              variant="outline"
                              onClick={() => applyTaskTemplate(template)}
                              className="h-auto justify-start border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white btn-magnetic"
                            >
                              {template.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="flex items-center gap-2 text-sm text-zinc-300">
                            <Crosshair className="h-4 w-4 text-primary" />
                            Page Region <span className="text-red-400">*</span>
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearSelectedRegion}
                            disabled={!selectedRegion && !draftRegion}
                            className="h-8 border-zinc-800 bg-zinc-900/60 px-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                          >
                            <Eraser className="mr-1.5 h-3.5 w-3.5" />
                            Clear
                          </Button>
                        </div>

                        {selectedPageImageUrl ? (
                          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
                            <div
                              className="relative mx-auto inline-block max-h-[320px] max-w-full touch-none overflow-hidden rounded-lg border border-zinc-800 bg-black/50 align-middle cursor-crosshair"
                              onPointerDown={handleRegionPointerDown}
                              onPointerMove={handleRegionPointerMove}
                              onPointerUp={finishRegionDrawing}
                              onPointerCancel={finishRegionDrawing}
                            >
                              <img
                                src={selectedPageImageUrl}
                                alt={`Page ${selectedPage?.pageNumber}`}
                                className="block max-h-[320px] max-w-full select-none object-contain"
                                draggable={false}
                              />
                              {selectedRegion && (
                                <div
                                  className="absolute border-2 border-primary bg-primary/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"
                                  style={{
                                    left: `${selectedRegion.x}%`,
                                    top: `${selectedRegion.y}%`,
                                    width: `${selectedRegion.width}%`,
                                    height: `${selectedRegion.height}%`,
                                  }}
                                />
                              )}
                              {draftRegion && (
                                <div
                                  className="absolute border-2 border-dashed border-amber-300 bg-amber-300/10"
                                  style={{
                                    left: `${draftRegion.x}%`,
                                    top: `${draftRegion.y}%`,
                                    width: `${draftRegion.width}%`,
                                    height: `${draftRegion.height}%`,
                                  }}
                                />
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                              <span>Drag on the page to mark the exact area for this task.</span>
                              {selectedRegion && (
                                <span className="font-mono text-primary">
                                  x {selectedRegion.x}% / y {selectedRegion.y}% / {selectedRegion.width}% x {selectedRegion.height}%
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-500">
                            This page does not have an image preview yet.
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">Task Title <span className="text-red-400">*</span></Label>
                        <Input
                          placeholder="e.g., Color backgrounds for battle scene"
                          value={form.title}
                          onChange={e => updateForm({ title: e.target.value })}
                          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"
                          id="task-title-input"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">Description</Label>
                        <Textarea
                          placeholder="Optional details for the assistant..."
                          value={form.description}
                          onChange={e => updateForm({ description: e.target.value })}
                          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 resize-none h-20"
                          id="task-desc-input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Type */}
                        <div className="space-y-1.5">
                          <Label className="text-sm text-zinc-300">Task Type <span className="text-red-400">*</span></Label>
                          <Select value={form.type} onValueChange={v => updateForm({ type: v })}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white" id="task-type-select">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                              {TASK_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
                                  {t.label} - ${t.basePay}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-1.5">
                          <Label className="text-sm text-zinc-300">Assign To <span className="text-red-400">*</span></Label>
                          <Select value={form.assigneeId || undefined} onValueChange={v => updateForm({ assigneeId: v })}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white" id="task-assignee-select">
                              <SelectValue placeholder="Select assistant" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                              {assistants.filter(a => a.status === "active").map(a => (
                                <SelectItem key={a.id} value={a.id} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-5 h-5">
                                      <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${a.avatar || a.name}`} />
                                      <AvatarFallback className="text-[8px]">{a.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <span>{a.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Default payment */}
                        <div className="space-y-1.5">
                          <Label className="text-sm text-zinc-300">Default Task Payment</Label>
                          <div className="flex h-11 items-center rounded-md border border-zinc-700 bg-zinc-900 px-3 font-mono font-bold text-primary">
                            ${formBasePay.toFixed(2)}
                          </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                          <Label className="text-sm text-zinc-300">Due Date <span className="text-red-400">*</span></Label>
                          <Input
                            type="date"
                            required
                            min={todayDate}
                            value={form.dueDate}
                            onChange={e => updateForm({ dueDate: e.target.value })}
                            className="bg-zinc-900 border-zinc-700 text-white"
                            id="task-duedate-input"
                          />
                        </div>
                      </div>

                    </div>

                    {formError && (
                      <div className="mx-6 mb-4 flex shrink-0 items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <DialogFooter className="shrink-0 border-t border-zinc-800/70 px-6 py-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-900">
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold btn-magnetic"
                        onClick={handleCreateTask}
                        disabled={submitting}
                        id="confirm-create-task-btn"
                      >
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Create Task
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              {!selectedPageId ? (
                <div className="py-10 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
                  <Layers className="w-10 h-10 text-zinc-700" />
                  <div>
                    <p className="font-semibold text-zinc-300">No target page selected</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Select a series, chapter, and page above to inspect task coverage and assign work by region.
                    </p>
                  </div>
                </div>
              ) : loadingTasks ? (
                <div className="py-10 flex items-center justify-center gap-2 text-zinc-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading tasks...
                </div>
              ) : pageTasks.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">No tasks yet on this page.</p>
                  <p className="text-zinc-600 text-xs">Click "Add Task" to create the first task.</p>
                </div>
              ) : (
                pageTasks.map(task => (
                  <div
                    key={task.taskId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setInspectTask(task)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setInspectTask(task)
                      }
                    }}
                    className="flex cursor-pointer flex-col gap-3 rounded-xl border border-zinc-900/60 bg-zinc-950/50 p-4 transition-colors hover:border-primary/35 hover:bg-zinc-900/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:flex-row sm:items-center group"
                    title="Click to review this task region"
                  >
                    {/* Type badge */}
                    <Badge className={`text-[10px] uppercase font-bold tracking-wider shrink-0 border ${typeColors[task.type] ?? "bg-zinc-800 text-zinc-300"}`}>
                      {task.type.replace("_", " ")}
                    </Badge>

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate group-hover:text-primary transition-colors">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{task.description}</p>
                      )}
                    </div>

                    {/* Total pay */}
                    <div className="flex items-center gap-1.5 shrink-0 text-primary font-mono font-bold text-sm">
                      <DollarSign className="w-3.5 h-3.5" />
                      {task.paymentAmount.toFixed(2)}
                    </div>

                    {/* Due date */}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 text-xs">
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    )}

                    {/* Assignee */}
                    {task.assigneeName && task.assigneeId ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.assigneeName}`} />
                          <AvatarFallback className="text-[8px]">{task.assigneeName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-zinc-300 font-medium">{task.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">No assistant</span>
                    )}

                    {/* Status */}
                    <Badge className={`text-[9px] uppercase font-bold shrink-0 ${statusColors[task.status] ?? "bg-zinc-800 text-zinc-300"}`}>
                      {task.status.replace("_", " ")}
                    </Badge>

                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-zinc-500 transition-colors group-hover:border-primary/40 group-hover:text-primary">
                      <Eye className="h-3.5 w-3.5" />
                    </div>

                    {/* Cancel (only for pending) */}
                    {task.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSeriesCancelled}
                        className="shrink-0 text-zinc-600 hover:text-destructive hover:bg-destructive/10 w-7 h-7 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleCancelTask(task.taskId)
                        }}
                        id={`cancel-task-btn-${task.taskId}`}
                        title="Cancel task"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {canReTaskPage && task.status === "approved" && task.assigneeId && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSeriesCancelled}
                        className="h-8 shrink-0 border-amber-700/40 bg-amber-950/20 px-3 text-xs font-bold text-amber-300 hover:bg-amber-900/30 hover:text-amber-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={(event) => {
                          event.stopPropagation()
                          openReTaskDialog(task)
                        }}
                        id={`retask-btn-${task.taskId}`}
                      >
                        Re-task
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Dialog open={!!inspectTask} onOpenChange={(open) => !open && setInspectTask(null)}>
            <DialogContent className="flex h-[min(820px,calc(100dvh-2rem))] w-[min(760px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden border-zinc-800 bg-zinc-950 p-0 text-white">
              <DialogHeader className="shrink-0 border-b border-zinc-800/70 px-6 pb-4 pt-6">
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Task Region Preview
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Review the page region assigned to this task.
                </DialogDescription>
              </DialogHeader>

              {inspectTask && (
                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
                    {selectedPageImageUrl ? (
                      <div className="relative mx-auto inline-block max-h-[540px] max-w-full overflow-hidden rounded-lg border border-zinc-800 bg-black/50 align-middle">
                        <img
                          src={selectedPageImageUrl}
                          alt={`Page ${selectedPage?.pageNumber}`}
                          className="block max-h-[540px] max-w-full select-none object-contain"
                          draggable={false}
                        />
                        {inspectTaskHasRegion && (
                          <div
                            className="pointer-events-none absolute rounded-md border-2 border-primary bg-primary/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.28),0_0_22px_rgba(20,184,166,0.55)]"
                            style={{
                              left: `${inspectTask.regionX}%`,
                              top: `${inspectTask.regionY}%`,
                              width: `${inspectTask.regionWidth}%`,
                              height: `${inspectTask.regionHeight}%`,
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex min-h-[340px] items-center justify-center rounded-lg border border-dashed border-zinc-800 text-sm text-zinc-500">
                        This page does not have an image preview yet.
                      </div>
                    )}
                    {!inspectTaskHasRegion && (
                      <p className="mt-3 text-xs text-amber-300">
                        This task does not have a saved region. Create a new task by drag-selecting a page area.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-3 rounded-xl border border-zinc-850 bg-zinc-900/40 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Task</p>
                      <p className="mt-1 font-bold text-white">{inspectTask.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Type</p>
                      <Badge className={`mt-1 border text-[10px] uppercase font-bold ${typeColors[inspectTask.type] ?? "bg-zinc-800 text-zinc-300"}`}>
                        {inspectTask.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Assigned To</p>
                      <p className="mt-1 text-zinc-200">{inspectTask.assigneeName || "No assistant"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Due Date</p>
                      <p className="mt-1 text-zinc-200">
                        {inspectTask.dueDate
                          ? new Date(inspectTask.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "Not set"}
                      </p>
                    </div>
                    {inspectTask.description && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</p>
                        <p className="mt-1 text-zinc-300">{inspectTask.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter className="shrink-0 border-t border-zinc-800/70 px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInspectTask(null)}
                  className="border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={reTaskDialogOpen} onOpenChange={setReTaskDialogOpen}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Re-task Approved Work</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Only the due date can be changed. Assistant, task name, page, payment, and task details stay the same.
                </DialogDescription>
              </DialogHeader>

              {reTaskTarget && (
                <div className="space-y-4 py-2">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-300">
                    <p className="font-bold text-white">{reTaskTarget.title}</p>
                    <p className="mt-1">Assistant: {reTaskTarget.assigneeName || "No assistant"}</p>
                    <p>Page: {reTaskTarget.pageNumber}</p>
                    <p>Payment: ${reTaskTarget.paymentAmount.toFixed(2)}</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-zinc-300">New Due Date</Label>
                    <Input
                      type="date"
                      min={todayDate}
                      value={reTaskDueDate}
                      onChange={(e) => setReTaskDueDate(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setReTaskDialogOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-900">
                  Cancel
                </Button>
                <Button type="button" onClick={handleReTask} disabled={submitting} className="bg-amber-500 text-black hover:bg-amber-400 font-bold">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirm Re-task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Fixed Price Table */}
          <Card className="bg-card border-border stagger-item">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Task Price Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {TASK_TYPES.map((taskType) => (
                  <div
                    key={taskType.value}
                    className="flex items-center justify-between rounded-lg border border-zinc-900/70 bg-zinc-950/45 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-300">{taskType.label}</span>
                    <span className="font-mono font-bold text-primary">${taskType.basePay.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Summary + Assistants ────────────────────────────────── */}
        <div className="space-y-5">

          {/* Assignment Summary */}
          <Card className="bg-card border-border overflow-hidden stagger-item">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assignment Summary</CardTitle>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                {selectedPage ? `${selectedSeries?.title ?? "Selected series"} - Page ${selectedPage.pageNumber}` : "No target selected"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Total Tasks</span>
                <span className="font-bold text-white">{selectedPageId ? pageTasks.length : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Required Types</span>
                <span className="font-bold text-emerald-400">{selectedPageId ? `${requiredTaskCount}/3` : "Line Art / Background / Lettering"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Optional Types</span>
                <span className="font-bold text-yellow-400">{selectedPageId ? pageTasks.filter(t => t.type === "coloring" || t.type === "effects").length : "Coloring / Effects"}</span>
              </div>
              {/* Visual progress bar */}
              {pageTasks.length > 0 && (
                <div className="mt-1 progress-animated">
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Required Coverage</span>
                    <span>{Math.round((requiredTaskCount / 3) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${(requiredTaskCount / 3) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Assistants */}
          <Card className="bg-card border-border stagger-item">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Available Assistants
              </CardTitle>
              <CardDescription className="text-xs">
                {assistants.filter(a => a.status === "active").length} production assistants in your studio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {assistants.length === 0 ? (
                <p className="text-zinc-500 text-xs py-4 text-center">No assistants found in the database.</p>
              ) : (
                assistants.filter(a => a.status === "active").map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 bg-zinc-950/50 rounded-lg border border-zinc-900/60 hover:border-zinc-700/60 transition-colors"
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${a.avatar || a.name}`} />
                      <AvatarFallback className="text-xs">{a.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{a.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{a.specialty ?? "General Assistant"}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
