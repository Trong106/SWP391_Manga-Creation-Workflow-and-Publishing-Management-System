"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useSearchParams } from "next/navigation"
import { API_BASE_URL } from "@/lib/api-config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  FileUp, 
  Check, 
  Trash, 
  BookOpen, 
  Layers, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  UserCheck, 
  HelpCircle,
  FileCode,
  ImageIcon,
  Send,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

interface Task {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  dueDate: string | null
  payment: number
  pageId: string
  pageNumber: number
  chapterTitle: string
  seriesTitle: string
  assignerName: string
}

export default function SubmitWorkPage() {
  const { user, role, token } = useAuth()
  const searchParams = useSearchParams()
  const taskIdParam = searchParams.get("taskId")
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState<string>("")
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  
  // QC Checklist states
  const [checklist, setChecklist] = useState({
    dpi: false,
    layers: false,
    transparency: false,
    aliasing: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch tasks assigned to the current Assistant
  const fetchTasks = async (preferredTaskId?: string | null) => {
    if (!user?.id || !token) return
    try {
      setLoading(true)
      setError(null)
      
      // Fetch assistant's authenticated tasks
      const myTasksRes = await fetch(`${API_BASE_URL}/api/tasks/my-tasks`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!myTasksRes.ok) throw new Error("Failed to load my-tasks")
      const myTasksData = await myTasksRes.json()

      // Fetch all tasks for series title mapping
      const allTasksRes = await fetch(`${API_BASE_URL}/api/data/tasks`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      let allTasksData: any[] = []
      if (allTasksRes.ok) {
        allTasksData = await allTasksRes.json()
      }

      // Merge data and keep only tasks currently being worked on.
      const merged: Task[] = myTasksData.map((mt: any) => {
        const matchingTask = allTasksData.find((at: any) => at.id === mt.taskId)
        return {
          id: mt.taskId,
          title: mt.title,
          description: mt.description || mt.title,
          type: mt.type?.toLowerCase() || "line_art",
          status: mt.status?.toLowerCase() || "pending",
          dueDate: mt.dueDate,
          payment: mt.paymentAmount,
          pageId: mt.pageId,
          pageNumber: mt.pageNumber,
          chapterTitle: mt.chapterTitle || `Chapter ${matchingTask?.chapterNumber || ""}`,
          seriesTitle: matchingTask?.seriesTitle || "Neo-Tokyo Chronicles",
          assignerName: mt.assignerName || "Yuki Tanaka"
        }
      }).filter((task: Task) => task.status === "in_progress")

      setTasks(merged)
      
      setSelectedTaskId((currentId) => {
        const requestedTaskId = preferredTaskId || currentId
        if (requestedTaskId && merged.some((task) => task.id === requestedTaskId)) {
          return requestedTaskId
        }

        return merged[0]?.id || ""
      })
    } catch (err: any) {
      console.error(err)
      setError("Failed to load tasks from server.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(taskIdParam)
  }, [user?.id, token, taskIdParam])

  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  // Handlers for drag & drop file selection
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".psd", ".clip"]
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase()
    
    if (!allowedExtensions.includes(ext)) {
      toast.error("Only image or source files (.PNG, .JPG, .JPEG, .PSD, .CLIP) are accepted.")
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("Maximum file size is 50MB.")
      return
    }

    setFile(selectedFile)
    toast.success(`Selected file: ${selectedFile.name}`)
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Quality Control check handler
  const isQCComplete = checklist.dpi && checklist.layers && checklist.transparency && checklist.aliasing

  // Submit task implementation
  const handleSubmitTask = async () => {
    if (!selectedTask) return
    if (!file) {
      toast.error("Please upload your final work file before submitting.")
      return
    }
    if (!isQCComplete) {
      toast.error("You must complete all Studio Quality Control items.")
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("note", note)

      const response = await fetch(`${API_BASE_URL}/api/tasks/${selectedTask.id}/submit`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to submit work.")
      }

      toast.success("Work submitted successfully for review!")
      
      // Reset form states
      setFile(null)
      setNote("")
      setChecklist({
        dpi: false,
        layers: false,
        transparency: false,
        aliasing: false,
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Refresh tasks to update status
      fetchTasks()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Something went wrong during submission.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    toast.success("Draft work saved successfully! (Simulated)")
  }

  const handleRequestPreReview = () => {
    if (!selectedTask) return
    toast.info(`Pre-review request sent to ${selectedTask.assignerName}!`)
  }

  // Format task type for user display
  const formatTaskType = (type: string) => {
    return type
      .replace("_", " ")
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  }

  // Render access denied for non-assistants
  if (role !== "assistant") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center text-destructive">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
        <p className="text-zinc-400 text-sm">
          This portal is reserved strictly for studio assistants to submit their line arts, backgrounds, and finishes.
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

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 max-w-md mx-auto bg-card border border-border p-8 rounded-xl">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Active Assignments</h2>
        <p className="text-zinc-400 text-sm">
          You currently have no in-progress tasks ready for submission. Start a task from My Tasks before submitting work.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card border border-border rounded-xl">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400">Select Task Assignment</h2>
          <p className="text-xs text-zinc-500">Only in-progress tasks are available for submission</p>
        </div>
        <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
          <SelectTrigger className="w-full sm:w-80 bg-zinc-950/60 border-zinc-800 text-white font-medium text-sm">
            <SelectValue placeholder="Choose a task" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
            {tasks.map(t => (
              <SelectItem key={t.id} value={t.id} className="cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900 text-xs">
                {t.title} ({t.seriesTitle})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTask && (
        <>
          {/* Task Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                  selectedTask.status === "in_progress" 
                    ? "bg-purple-900/30 text-purple-400 border border-purple-800/30" 
                    : selectedTask.status === "approved"
                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/30"
                    : selectedTask.status === "submitted"
                    ? "bg-cyan-900/30 text-cyan-400 border border-cyan-800/30"
                    : selectedTask.status === "revision"
                    ? "bg-red-900/30 text-red-400 border border-red-800/30"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}>
                  {selectedTask.status.replace("_", " ")}
                </Badge>
                <span className="text-zinc-500 text-xs font-mono">Task ID: #{selectedTask.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Submit Work: {selectedTask.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-zinc-200">{selectedTask.seriesTitle}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden sm:block"></div>
                <div className="text-zinc-300">Chapter {selectedTask.chapterTitle.replace("Chapter", "").trim()}</div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden sm:block"></div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Page:</span>
                  <Badge variant="outline" className="bg-zinc-950/60 text-zinc-300 border-zinc-800 text-[11px] font-mono px-2">
                    P. {selectedTask.pageNumber}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleSaveDraft} 
                variant="outline" 
                className="bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                Save Draft
              </Button>
              <Button 
                onClick={handleSubmitTask} 
                disabled={submitting || !file || !isQCComplete}
                className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(0,223,192,0.15)] disabled:opacity-40 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Column: Upload & Checklist (8 cols) */}
            <div className="col-span-12 lg:col-span-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Specialized Upload Area */}
                <Card className="bg-card border-border relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5">
                  <FileUp className="w-24 h-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <FileUp className="w-5 h-5 text-primary" />
                    MangaPages Upload
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs">
                    Upload your finished artwork. The system will optimize the file and notify the assigned Mangaka directly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dashed Drag/Drop Box */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[240px] ${
                      isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-zinc-800 hover:border-primary/50 hover:bg-zinc-900/20"
                    }`}
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.psd,.clip"
                    />
                    <div className="w-14 h-14 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 mb-4 group-hover:scale-105 transition-transform">
                      <FileUp className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-zinc-200 text-lg mb-1">Drag & drop your file here</h3>
                    <p className="text-zinc-400 text-xs mb-1">or click to browse local files</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider mt-2">
                      Supports PSD, CLIP, PNG, JPG, JPEG (Max 50MB)
                    </p>
                  </div>

                  {/* Uploaded File Queue */}
                  {file && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Upload Queue</Label>
                      <div className="flex items-center justify-between p-3.5 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                            {file.name.endsWith(".psd") || file.name.endsWith(".clip") ? (
                              <FileCode className="w-5 h-5 text-primary" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-zinc-200 truncate">{file.name}</p>
                            <p className="text-zinc-500 text-xs">{(file.size / (1024 * 1024)).toFixed(1)} MB • Ready to submit</p>
                          </div>
                        </div>
                        <Button 
                          onClick={removeFile} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                </Card>

                {/* Quality Control Checklist & Submission Notes */}
                <Card className="bg-card border-border h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Check className="w-5 h-5 text-primary" />
                    Studio Quality Control
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs">
                    Please double-check all technical details to ensure compatibility with high-resolution printing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* QC Checklist Grid */}
                  <div className="grid grid-cols-1 gap-3">
                    <label 
                      className={`flex items-start gap-3 p-3 bg-zinc-950/40 border rounded-xl cursor-pointer transition-all ${
                        checklist.dpi ? "border-primary/40 bg-primary/5" : "border-zinc-850 hover:border-zinc-700"
                      }`}
                    >
                      <Checkbox 
                        checked={checklist.dpi} 
                        onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, dpi: !!checked }))}
                        className="mt-1 border-zinc-700 text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-zinc-200">Minimum 600 DPI</span>
                        <p className="text-zinc-500 text-[11px] leading-snug">Required for high-resolution print production.</p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-start gap-3 p-3 bg-zinc-950/40 border rounded-xl cursor-pointer transition-all ${
                        checklist.layers ? "border-primary/40 bg-primary/5" : "border-zinc-850 hover:border-zinc-700"
                      }`}
                    >
                      <Checkbox 
                        checked={checklist.layers} 
                        onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, layers: !!checked }))}
                        className="mt-1 border-zinc-700 text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-zinc-200">Layer Structure Preserved</span>
                        <p className="text-zinc-500 text-[11px] leading-snug">Lineart, Tones, and SFX on separate layers.</p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-start gap-3 p-3 bg-zinc-950/40 border rounded-xl cursor-pointer transition-all ${
                        checklist.transparency ? "border-primary/40 bg-primary/5" : "border-zinc-850 hover:border-zinc-700"
                      }`}
                    >
                      <Checkbox 
                        checked={checklist.transparency} 
                        onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, transparency: !!checked }))}
                        className="mt-1 border-zinc-700 text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-zinc-200">Transparency Check</span>
                        <p className="text-zinc-500 text-[11px] leading-snug">No stray pixels on alpha channel backgrounds.</p>
                      </div>
                    </label>

                    <label 
                      className={`flex items-start gap-3 p-3 bg-zinc-950/40 border rounded-xl cursor-pointer transition-all ${
                        checklist.aliasing ? "border-primary/40 bg-primary/5" : "border-zinc-850 hover:border-zinc-700"
                      }`}
                    >
                      <Checkbox 
                        checked={checklist.aliasing} 
                        onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, aliasing: !!checked }))}
                        className="mt-1 border-zinc-700 text-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus:ring-primary"
                      />
                      <div className="space-y-0.5">
                        <span className="font-bold text-sm text-zinc-200">Anti-Aliasing Off</span>
                        <p className="text-zinc-500 text-[11px] leading-snug">Binary (Aliased) lines for screentone compatibility.</p>
                      </div>
                    </label>
                  </div>

                  {/* Submission Notes */}
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="submit-notes" className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                      Submission Notes (Optional)
                    </Label>
                    <Textarea 
                      id="submit-notes"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add details about changes, notes on formatting, or issues that need Mangaka's review..."
                      className="bg-zinc-950/60 border-zinc-850 text-white placeholder-zinc-650 focus-visible:ring-primary min-h-[92px] resize-none"
                    />
                  </div>
                </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column: Summary & Metadata (4 cols) */}
            <div className="col-span-12 lg:col-span-4 space-y-6">

              {/* Task Summary Card */}
              <Card className="bg-card border-border overflow-hidden">
                <div className="h-1.5 bg-primary w-full"></div>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-white">Task Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <div className="flex justify-between items-center py-2 border-b border-zinc-850/50">
                    <span className="text-xs text-zinc-400 font-medium">Assignment Type</span>
                    <span className="text-xs font-semibold text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
                      {formatTaskType(selectedTask.type)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-zinc-850/50">
                    <span className="text-xs text-zinc-400 font-medium">Deadline</span>
                    <span className={`text-xs font-semibold flex items-center gap-1 ${
                      selectedTask.dueDate ? "text-destructive" : "text-zinc-500"
                    }`}>
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {selectedTask.dueDate ? selectedTask.dueDate : "No deadline"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Payout</span>
                    <span className="text-xl font-bold text-primary font-mono">
                      ¥{selectedTask.payment ? selectedTask.payment.toLocaleString() : "0"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Workflow State (Vertical Timeline) */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-white">Workflow State</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-6 space-y-6">
                    {/* Timeline Line */}
                    <div className="absolute left-[9px] top-1.5 bottom-1.5 w-0.5 bg-zinc-850"></div>

                    {/* Step 1 */}
                    <div className="relative flex gap-3">
                      <div className="absolute -left-6 w-5 h-5 rounded-full bg-primary/25 border border-primary/60 flex items-center justify-center z-10">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-200">Started Work</p>
                        <p className="text-[10px] text-zinc-500">Assignment accepted</p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex gap-3">
                      <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center z-10 border ${
                        selectedTask.status === "in_progress" || selectedTask.status === "pending" || selectedTask.status === "revision"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-primary/20 text-primary border-primary/50"
                      }`}>
                        <span className="text-[10px] font-bold">1</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${
                          selectedTask.status === "in_progress" || selectedTask.status === "pending" || selectedTask.status === "revision" 
                            ? "text-primary" 
                            : "text-zinc-400"
                        }`}>
                          In Progress
                        </p>
                        <p className="text-[10px] text-zinc-500">Drawing line arts & layouts</p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex gap-3">
                      <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center z-10 border ${
                        selectedTask.status === "submitted"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-zinc-950 text-zinc-500 border-zinc-800"
                      }`}>
                        <span className="text-[10px] font-bold">2</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${selectedTask.status === "submitted" ? "text-primary" : "text-zinc-400"}`}>
                          Submitted
                        </p>
                        <p className="text-[10px] text-zinc-500">Pending Mangaka review</p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="relative flex gap-3">
                      <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center z-10 border ${
                        selectedTask.status === "approved"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-zinc-950 text-zinc-500 border-zinc-800"
                      }`}>
                        <span className="text-[10px] font-bold">3</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${selectedTask.status === "approved" ? "text-primary" : "text-zinc-400"}`}>
                          Approved / Completed
                        </p>
                        <p className="text-[10px] text-zinc-500">Payroll record generated</p>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* Task Owner / Assigner Section */}
              <Card className="bg-card border-border">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-zinc-200">Task Reviewer</h3>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold py-0.5 px-2">
                      Reviewer Online
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3.5 p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl">
                    <Avatar className="w-10 h-10 border border-zinc-800 shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${selectedTask.assignerName}`} />
                      <AvatarFallback className="bg-zinc-900 text-zinc-200">{selectedTask.assignerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-zinc-200 truncate">{selectedTask.assignerName}</p>
                      <p className="text-xs text-zinc-500 truncate">Assigned Mangaka reviewer</p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleRequestPreReview}
                    variant="outline" 
                    className="w-full bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs py-2.5 font-medium transition-colors"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Request Pre-Review
                  </Button>
                </CardContent>
              </Card>

            </div>

          </div>
        </>
      )}
      <Toaster />
    </div>
  )
}
