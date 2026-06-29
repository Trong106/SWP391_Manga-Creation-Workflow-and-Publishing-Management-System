"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import {
  Layers,
  Users,
  Plus,
  Check,
  Trash2,
  DollarSign,
  Calendar,
  ChevronDown,
  Loader2,
  AlertCircle,
  BookOpen,
  FileText,
  Clock,
  X,
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
}

interface Assistant {
  id: string
  name: string
  avatar?: string
  specialty?: string
  rating?: number
  hourlyRate?: number
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
  paymentAmount: string
  pageId: string
}

const TASK_TYPES = [
  { value: "line_art", label: "Line Art" },
  { value: "background", label: "Background" },
  { value: "effects", label: "Effects" },
  { value: "coloring", label: "Coloring" },
  { value: "lettering", label: "Lettering" },
  { value: "review", label: "Review" },
]

const TASK_TEMPLATES = [
  {
    label: "Background Cleanup",
    title: "Background cleanup",
    type: "background",
    description: "Clean perspective lines, remove rough sketch artifacts, and prepare the background layer for final review.",
    paymentAmount: "120",
  },
  {
    label: "Line Art Polish",
    title: "Line art polish",
    type: "line_art",
    description: "Refine character line weight, close open strokes, and keep line art ready for screentone/coloring.",
    paymentAmount: "150",
  },
  {
    label: "Lettering Pass",
    title: "Lettering and SFX pass",
    type: "lettering",
    description: "Place dialogue, sound effects, and balloon text while preserving panel readability.",
    paymentAmount: "90",
  },
]

const typeColors: Record<string, string> = {
  line_art: "bg-green-500/20 text-green-400 border-green-700/30",
  background: "bg-blue-500/20 text-blue-400 border-blue-700/30",
  effects: "bg-yellow-500/20 text-yellow-400 border-yellow-700/30",
  coloring: "bg-purple-500/20 text-purple-400 border-purple-700/30",
  lettering: "bg-cyan-500/20 text-cyan-400 border-cyan-700/30",
  review: "bg-orange-500/20 text-orange-400 border-orange-700/30",
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
  const { token, role, user } = useAuth()

  const [series, setSeries] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("")
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>("")
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>("")
  const [pageTasks, setPageTasks] = useState<TaskRecord[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])

  const [loadingSeries, setLoadingSeries] = useState(true)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingPages, setLoadingPages] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<CreateTaskForm>({
    title: "",
    description: "",
    type: "",
    assigneeId: "unassigned",
    dueDate: "",
    paymentAmount: "",
    pageId: "",
  })

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
      if (data.length > 0) setSelectedSeriesId(data[0].seriesId)
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
      if (data.length > 0) setSelectedChapterId(data[0].chapterId)
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
      if (data.length > 0) setSelectedPageId(data[0].pageId)
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
        hourlyRate: a.hourlyRate,
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
  useEffect(() => { loadSeries(); loadAssistants() }, [loadSeries, loadAssistants])
  useEffect(() => { if (selectedSeriesId) loadChapters(selectedSeriesId) }, [selectedSeriesId, loadChapters])
  useEffect(() => { if (selectedChapterId) loadPages(selectedChapterId) }, [selectedChapterId, loadPages])
  useEffect(() => { if (selectedPageId) loadPageTasks(selectedPageId) }, [selectedPageId, loadPageTasks])

  // ── Create task ───────────────────────────────────────────────────────────
  const handleCreateTask = async () => {
    if (!form.title.trim() || !form.type || !selectedPageId) {
      toast.error("Please fill in Title and Task Type.")
      return
    }
    try {
      setSubmitting(true)
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        type: form.type,
        assigneeId: (form.assigneeId && form.assigneeId !== "unassigned") ? form.assigneeId : null,
        dueDate: form.dueDate || null,
        paymentAmount: parseFloat(form.paymentAmount) || 0,
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
      setIsDialogOpen(false)
      setForm({ title: "", description: "", type: "", assigneeId: "unassigned", dueDate: "", paymentAmount: "", pageId: "" })
      loadPageTasks(selectedPageId)
    } catch (err: any) {
      toast.error(err.message || "Failed to create task.")
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

  const applyTaskTemplate = (template: typeof TASK_TEMPLATES[number]) => {
    setForm((current) => ({
      ...current,
      title: template.title,
      type: template.type,
      description: template.description,
      paymentAmount: template.paymentAmount,
    }))
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

  const assignedTasks = pageTasks.filter(t => t.assigneeId)
  const unassignedTasks = pageTasks.filter(t => !t.assigneeId)
  const totalPayout = pageTasks.reduce((sum, t) => sum + t.paymentAmount, 0)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Page Header */}
      <div className="mb-2">
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
          <Card className="bg-card border-border">
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

          {/* Task List for Selected Page */}
          <Card className="bg-card border-border">
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
              {selectedPageId && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                      id="add-task-btn"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Assign a production task for Page {selectedPage?.pageNumber}
                        {selectedChapter ? `, Chapter ${selectedChapter.chapterNumber}` : ""}
                        {selectedSeries ? ` of "${selectedSeries.title}"` : ""}.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label className="text-sm text-zinc-300">Quick Templates</Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {TASK_TEMPLATES.map((template) => (
                            <Button
                              key={template.label}
                              type="button"
                              variant="outline"
                              onClick={() => applyTaskTemplate(template)}
                              className="h-auto justify-start border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                              {template.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="space-y-1.5">
                        <Label className="text-sm text-zinc-300">Task Title <span className="text-red-400">*</span></Label>
                        <Input
                          placeholder="e.g., Color backgrounds for battle scene"
                          value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
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
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 resize-none h-20"
                          id="task-desc-input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Type */}
                        <div className="space-y-1.5">
                          <Label className="text-sm text-zinc-300">Task Type <span className="text-red-400">*</span></Label>
                          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white" id="task-type-select">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                              {TASK_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Assignee */}
                        <div className="space-y-1.5">
                          <Label className="text-sm text-zinc-300">Assign To</Label>
                          <Select value={form.assigneeId} onValueChange={v => setForm(f => ({ ...f, assigneeId: v }))}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white" id="task-assignee-select">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                              <SelectItem value="unassigned" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer text-zinc-400">
                                Unassigned
                              </SelectItem>
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

                      <div className="grid grid-cols-2 gap-4">
                        {/* Payment */}
                        <div className="space-y-1.5">
                          <Label className="text-sm text-zinc-300">Payment (USD)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={form.paymentAmount}
                            onChange={e => setForm(f => ({ ...f, paymentAmount: e.target.value }))}
                            className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600"
                            id="task-payment-input"
                          />
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                          <Label className="text-sm text-zinc-300">Due Date</Label>
                          <Input
                            type="date"
                            value={form.dueDate}
                            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                            className="bg-zinc-900 border-zinc-700 text-white"
                            id="task-duedate-input"
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-900">
                        Cancel
                      </Button>
                      <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                        onClick={handleCreateTask}
                        disabled={submitting || !form.title || !form.type}
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
                  Select a series, chapter, and page to see tasks.
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
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-zinc-950/50 rounded-xl border border-zinc-900/60 hover:border-primary/20 transition-colors group"
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

                    {/* Payment */}
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
                        <Badge className="bg-emerald-900/30 text-emerald-400 border border-emerald-700/30 text-[9px]">
                          <Check className="w-2.5 h-2.5 mr-0.5" /> Assigned
                        </Badge>
                      </div>
                    ) : (
                      <Badge className="bg-zinc-900 text-zinc-500 border border-zinc-800 text-[9px] shrink-0">
                        Unassigned
                      </Badge>
                    )}

                    {/* Status */}
                    <Badge className={`text-[9px] uppercase font-bold shrink-0 ${statusColors[task.status] ?? "bg-zinc-800 text-zinc-300"}`}>
                      {task.status.replace("_", " ")}
                    </Badge>

                    {/* Cancel (only for pending) */}
                    {task.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-zinc-600 hover:text-destructive hover:bg-destructive/10 w-7 h-7"
                        onClick={() => handleCancelTask(task.taskId)}
                        id={`cancel-task-btn-${task.taskId}`}
                        title="Cancel task"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Summary + Assistants ────────────────────────────────── */}
        <div className="space-y-5">

          {/* Assignment Summary */}
          <Card className="bg-card border-border overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assignment Summary</CardTitle>
              {selectedSeries && (
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{selectedSeries.title}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Total Tasks</span>
                <span className="font-bold text-white">{pageTasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Assigned</span>
                <span className="font-bold text-emerald-400">{assignedTasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Unassigned</span>
                <span className="font-bold text-yellow-400">{unassignedTasks.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-zinc-800">
                <span className="text-zinc-400">Total Payout</span>
                <span className="font-bold text-primary text-lg font-mono">${totalPayout.toFixed(2)}</span>
              </div>

              {/* Visual progress bar */}
              {pageTasks.length > 0 && (
                <div className="mt-1">
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <span>Assignment Progress</span>
                    <span>{Math.round((assignedTasks.length / pageTasks.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500 rounded-full"
                      style={{ width: `${(assignedTasks.length / pageTasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Assistants */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Available Assistants
              </CardTitle>
              <CardDescription className="text-xs">
                {assistants.filter(a => a.status === "active").length} active assistants in your studio.
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
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-primary font-mono">
                        {a.hourlyRate ? `$${a.hourlyRate}/hr` : "—"}
                      </p>
                      <p className="text-[9px] text-zinc-500">
                        {a.currentTasks} active
                      </p>
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
