"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { toast } from "sonner"
import { Clock, Download, Upload, Eye, CheckCircle, MoreHorizontal, Loader2, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface TaskResource {
  taskId: string
  pageId: string
  pageNumber: number
  imageUrl: string
  seriesTitle?: string
  chapterNumber?: number
  regionId?: string | null
  regionType?: string | null
  regionX?: number | null
  regionY?: number | null
  regionWidth?: number | null
  regionHeight?: number | null
}

const mockTasks = [
  {
    id: "1",
    title: "Chapter 45 - Background Art",
    series: "Dragon Hunters",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    type: "background",
    pages: "Pages 5-12",
    dueDate: "May 22",
    payment: 180,
    status: "in_progress",
    progress: 60,
  },
  {
    id: "2",
    title: "Chapter 45 - Speed Lines",
    series: "Dragon Hunters",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    type: "effects",
    pages: "Pages 1-8",
    dueDate: "May 23",
    payment: 120,
    status: "pending",
    progress: 0,
  },
  {
    id: "3",
    title: "Chapter 12 - Coloring",
    series: "Night Bloom",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    type: "coloring",
    pages: "Pages 1-20",
    dueDate: "May 25",
    payment: 350,
    status: "pending",
    progress: 0,
  },
]

const completedTasks = [
  {
    id: "4",
    title: "Chapter 44 - Background Art",
    series: "Dragon Hunters",
    payment: 180,
    completedAt: "May 18",
    status: "approved",
  },
  {
    id: "5",
    title: "Chapter 11 - Coloring",
    series: "Night Bloom",
    payment: 320,
    completedAt: "May 15",
    status: "approved",
  },
]

const typeColors = {
  background: "bg-blue-500/20 text-blue-400",
  effects: "bg-yellow-500/20 text-yellow-400",
  coloring: "bg-purple-500/20 text-purple-400",
  line_art: "bg-green-500/20 text-green-400",
  lettering: "bg-cyan-500/20 text-cyan-400",
}

const statusColors = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning",
  submitted: "bg-primary/20 text-primary",
  revision: "bg-destructive/20 text-destructive",
  approved: "bg-success/20 text-success",
}

export function AssistantTasks() {
  const { token } = useAuth()
  
  // State for Resource Modal
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false)
  const [selectedTaskResource, setSelectedTaskResource] = useState<TaskResource | null>(null)
  const [loadingResource, setLoadingResource] = useState(false)
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null)

  const handleOpenResources = async (taskId: string) => {
    const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(taskId)

    if (!isGuid) {
      const task = mockTasks.find(t => t.id === taskId) || completedTasks.find(t => t.id === taskId)
      setSelectedTaskResource({
        taskId,
        pageId: "mock-page-id",
        pageNumber: 5,
        imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60",
        seriesTitle: task?.series || "Dragon Hunters",
        chapterNumber: 45
      })
      setIsResourceModalOpen(true)
      return
    }

    try {
      setLoadingResource(true)
      setLoadingTaskId(taskId)
      
      const headers: HeadersInit = {}
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/resources`, {
        headers
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

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active ({mockTasks.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {mockTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{task.title}</h4>
                        <Badge className={typeColors[task.type as keyof typeof typeColors]}>
                          {task.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.series} - {task.pages}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenResources(task.id)}>Download Resources</DropdownMenuItem>
                        <DropdownMenuItem>Message Mangaka</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.mangaka.avatar}`} />
                        <AvatarFallback>{task.mangaka.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{task.mangaka.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Due: {task.dueDate}</span>
                    <span className="text-sm font-medium text-success">${task.payment}</span>
                  </div>

                  {task.status === "in_progress" && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-1.5" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                      {task.status.replace("_", " ")}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenResources(task.id)}
                        disabled={loadingResource && loadingTaskId === task.id}
                        className="cursor-pointer"
                      >
                        {loadingResource && loadingTaskId === task.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Resources
                      </Button>
                      {task.status === "in_progress" && (
                        <Button size="sm" className="bg-primary text-primary-foreground">
                          <Upload className="w-4 h-4 mr-2" />
                          Submit
                        </Button>
                      )}
                      {task.status === "pending" && (
                        <Button size="sm" className="bg-primary text-primary-foreground">
                          Start Task
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 bg-secondary/50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-semibold">{task.title}</h4>
                    <p className="text-sm text-muted-foreground">{task.series}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{task.completedAt}</span>
                    <span className="text-sm font-medium text-success">${task.payment}</span>
                    <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {task.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                      {selectedTaskResource.regionX != null &&
                        selectedTaskResource.regionY != null &&
                        selectedTaskResource.regionWidth != null &&
                        selectedTaskResource.regionHeight != null && (
                          <div
                            className="pointer-events-none absolute z-30 rounded-md border-2 border-primary bg-primary/15 shadow-[0_0_22px_rgba(20,184,166,0.6)]"
                            style={{
                              left: `${selectedTaskResource.regionX}%`,
                              top: `${selectedTaskResource.regionY}%`,
                              width: `${selectedTaskResource.regionWidth}%`,
                              height: `${selectedTaskResource.regionHeight}%`,
                            }}
                          />
                        )}
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
    </>
  )
}
