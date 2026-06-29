"use client"

import { useState, useEffect } from "react"
import { Plus, Clock, MessageSquare, Paperclip, Loader2, DollarSign, Calendar, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Task {
  id: string
  title: string
  chapter: string
  status: string
  assignee: { name: string; avatar: string }
  dueDate: string
  comments: number
  attachments: number
  priority: "low" | "medium" | "high"
  progress?: number
}

interface Column {
  id: string
  title: string
  color: string
  tasks: Task[]
}

const DEFAULT_COLUMNS = [
  {
    id: "storyboard",
    title: "Storyboard",
    color: "bg-blue-500",
  },
  {
    id: "penciling",
    title: "Penciling",
    color: "bg-yellow-500",
  },
  {
    id: "inking",
    title: "Inking",
    color: "bg-orange-500",
  },
  {
    id: "coloring",
    title: "Coloring",
    color: "bg-purple-500",
  },
  {
    id: "lettering",
    title: "Lettering",
    color: "bg-teal-500",
  },
  {
    id: "review",
    title: "Review",
    color: "bg-accent",
  },
]

const priorityColors = {
  low: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-red-500/20 text-red-400",
}

const activeTaskStatuses = new Set(["pending", "assigned", "in_progress", "submitted", "revision"])

const statusLabels: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In progress",
  submitted: "Submitted",
  revision: "Revision",
}

const statusStyles: Record<string, string> = {
  pending: "border-zinc-700 bg-zinc-900/70 text-zinc-300",
  assigned: "border-blue-800/40 bg-blue-950/30 text-blue-300",
  in_progress: "border-purple-800/40 bg-purple-950/30 text-purple-300",
  submitted: "border-cyan-800/40 bg-cyan-950/30 text-cyan-300",
  revision: "border-red-800/40 bg-red-950/30 text-red-300",
}

function getColumnIdFromTaskType(type: string): string {
  const t = type.toLowerCase()
  if (t === "line_art") return "penciling"
  if (t === "background" || t === "effects") return "inking"
  if (t === "coloring") return "coloring"
  if (t === "lettering") return "lettering"
  if (t === "review") return "review"
  return "storyboard"
}

const mapColumnIdToType = (columnId: string): string => {
  if (columnId === "storyboard") return "review"
  if (columnId === "penciling") return "line_art"
  if (columnId === "inking") return "background"
  if (columnId === "coloring") return "coloring"
  if (columnId === "lettering") return "lettering"
  if (columnId === "review") return "review"
  return "line_art"
}

function formatDueDate(dateStr: string): string {
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

export function WorkflowBoard() {
  const { token, role } = useAuth()
  const isMangaka = role === "mangaka"
  const authHeader = token ? { "Authorization": `Bearer ${token}` } : undefined

  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS.map(col => ({ ...col, tasks: [] })))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog & form fields state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [taskType, setTaskType] = useState<string>("line_art")
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("")
  const [selectedChapterId, setSelectedChapterId] = useState<string>("")
  const [selectedPageId, setSelectedPageId] = useState<string>("")
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("")
  const [dueDate, setDueDate] = useState("")
  const [paymentAmount, setPaymentAmount] = useState<string>("0")

  // Options lists
  const [seriesList, setSeriesList] = useState<any[]>([])
  const [chaptersList, setChaptersList] = useState<any[]>([])
  const [pagesList, setPagesList] = useState<any[]>([])
  const [assistantsList, setAssistantsList] = useState<any[]>([])

  const loadTasks = () => {
    if (!authHeader) return

    setLoading(true)
    fetch(`${API_BASE_URL}/api/data/tasks`, { headers: authHeader })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch workflow tasks")
        return res.json()
      })
      .then((data: any[]) => {
        const activeTasks = data.filter((t) => activeTaskStatuses.has(String(t.status || "").toLowerCase()))

        const updatedColumns = DEFAULT_COLUMNS.map((col) => {
          const colTasks = activeTasks
            .filter((t) => getColumnIdFromTaskType(t.type) === col.id)
            .map((t) => {
              const hash = t.id.replace(/-/g, "")
              const comments = (parseInt(hash.substring(0, 2), 16) % 5) || 0
              const attachments = (parseInt(hash.substring(2, 4), 16) % 4) || 0
              
              let priority: "low" | "medium" | "high" = "medium"
              if (t.status === "revision" || t.status === "rejected") {
                priority = "high"
              } else if (t.status === "pending") {
                priority = "low"
              }

              const progressMap: Record<string, number> = {
                pending: 10,
                in_progress: 50,
                submitted: 80,
                approved: 100,
                revision: 40,
                cancelled: 0,
              }
              const progress = progressMap[t.status.toLowerCase()] || 0

              return {
                id: t.id,
                title: t.title,
                chapter: `${t.seriesTitle} (Ch ${t.chapterNumber})`,
                status: t.status,
                assignee: {
                  name: t.assigneeName || "Unassigned",
                  avatar: t.assigneeAvatar || "kenji",
                },
                dueDate: formatDueDate(t.dueDate),
                comments,
                attachments,
                priority,
                progress,
              }
            })

          return {
            ...col,
            tasks: colTasks,
          }
        })
        setColumns(updatedColumns)
        setLoading(false)
        setError(null)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadTasks()
  }, [token])

  const openNewTaskDialog = (initialType?: string) => {
    setTitle("")
    setDescription("")
    setTaskType(initialType || "line_art")
    setSelectedSeriesId("")
    setSelectedChapterId("")
    setSelectedPageId("")
    setSelectedAssigneeId("")
    setDueDate("")
    setPaymentAmount("0")
    setFormError(null)

    // Pre-fetch lists
    fetchSeriesList()
    fetchAssistantsList()

    setIsDialogOpen(true)
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
    setSelectedSeriesId(seriesId)
    setSelectedChapterId("")
    setSelectedPageId("")
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
    setSelectedChapterId(chapterId)
    setSelectedPageId("")
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

    if (!title.trim()) {
      setFormError("Task title is required.")
      return
    }
    if (!selectedSeriesId) {
      setFormError("Please select a series.")
      return
    }
    if (!selectedChapterId) {
      setFormError("Please select a chapter.")
      return
    }
    if (!selectedPageId) {
      setFormError("Please select a page.")
      return
    }

    setFormLoading(true)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      type: taskType,
      regionId: null,
      assigneeId: selectedAssigneeId || null,
      dueDate: dueDate || null,
      paymentAmount: parseFloat(paymentAmount) || 0
    }

    fetch(`${API_BASE_URL}/api/pages/${selectedPageId}/tasks`, {
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
        setIsDialogOpen(false)
        loadTasks()
      })
      .catch((err) => {
        console.error("Error creating task:", err)
        setFormError(err.message || "Failed to create task. Please try again.")
      })
      .finally(() => {
        setFormLoading(false)
      })
  }

  if (loading) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center min-h-[200px] border border-border rounded-lg bg-card text-muted-foreground p-6">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
        <p className="text-sm">Loading Production Pipeline...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-8 p-4 border border-red-900 bg-red-950/20 text-red-400 rounded-lg text-sm">
        Error loading pipeline: {error}
      </div>
    )
  }

  const activeColumns = columns.filter((column) => column.tasks.length > 0)
  const activeTaskCount = activeColumns.reduce((total, column) => total + column.tasks.length, 0)

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Production Pipeline
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Active production tasks only. Completed and cancelled work is hidden.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {activeTaskCount} active
          </Badge>
          {isMangaka && (
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
              onClick={() => openNewTaskDialog()}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          )}
        </div>
      </div>

      {activeColumns.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center min-h-[160px] gap-2 text-center text-muted-foreground">
            <Activity className="h-8 w-8 text-primary/70" />
            <p className="text-sm font-medium text-zinc-300">No active production tasks</p>
            <p className="text-xs">New, submitted, revision, and in-progress tasks will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {activeColumns.map((column) => (
            <Card key={column.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <CardTitle className="text-base text-white font-semibold">{column.title}</CardTitle>
                    <Badge variant="secondary" className="ml-2 bg-secondary text-zinc-300 border-none">{column.tasks.length}</Badge>
                  </div>
                  {isMangaka && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-muted-foreground hover:bg-zinc-800/70 hover:text-white"
                      onClick={() => openNewTaskDialog(mapColumnIdToType(column.id))}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5 text-primary" />
                      Add
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {column.tasks.map((task) => {
                  const status = task.status.toLowerCase()

                  return (
                    <Card key={task.id} className="bg-secondary border-border hover:border-primary/30 transition-colors">
                      <CardContent className="p-3.5">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <Badge className={priorityColors[task.priority]}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline" className={`text-[11px] ${statusStyles[status] || "border-zinc-700 bg-zinc-900/70 text-zinc-300"}`}>
                            {statusLabels[status] || task.status}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm text-zinc-100 mb-1 leading-snug">{task.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{task.chapter}</p>
                        {task.progress !== undefined && (
                          <div className="mb-2.5">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-zinc-200 font-medium">{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1.5" />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.dueDate}
                            </span>
                            {task.comments > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {task.comments}
                              </span>
                            )}
                            {task.attachments > 0 && (
                              <span className="flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                {task.attachments}
                              </span>
                            )}
                          </div>
                          <Avatar className="w-6 h-6 border border-zinc-800">
                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.assignee.avatar}`} />
                            <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                          </Avatar>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Task Creation Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-600 text-sm focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-zinc-300">Description</Label>
              <Textarea
                id="description"
                placeholder="Task details and instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-600 text-sm focus-visible:ring-primary resize-none"
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
                <Select value={selectedSeriesId} onValueChange={handleSeriesChange}>
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
                  value={selectedChapterId} 
                  onValueChange={handleChapterChange}
                  disabled={!selectedSeriesId}
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
                  value={selectedPageId} 
                  onValueChange={setSelectedPageId}
                  disabled={!selectedChapterId}
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
              <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
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
                  <Calendar className="w-3.5 h-3.5" />
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
                  <DollarSign className="w-3.5 h-3.5" />
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
                onClick={() => setIsDialogOpen(false)}
                className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
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
