"use client"

import { useState, useEffect, useCallback } from "react"
import { Upload, X, ImageIcon, Folder, ChevronRight, Check, Plus, ArrowUp, ArrowDown, GripVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { toast } from "sonner"
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
} from "@/components/ui/dialog"

interface UploadedFile {
  id: string
  name: string
  size: string
  preview: string
  status: "uploading" | "complete" | "error"
  progress: number
}

interface ChapterPage {
  pageId: string
  pageNumber: number
  currentImageUrl?: string
  originalFileName?: string
  status: string
}

const PAGE_FILE_PATTERN = /^page_(\d{3,})\.(png|jpe?g|psd|clip)$/i

export default function UploadPage() {
  const { user, token } = useAuth()
  const [selectedSeries, setSelectedSeries] = useState("")
  const [seriesList, setSeriesList] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newChapterNumber, setNewChapterNumber] = useState("")
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [isCreatingChapter, setIsCreatingChapter] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [chapterPages, setChapterPages] = useState<ChapterPage[]>([])
  const [isLoadingPages, setIsLoadingPages] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Lấy danh sách bộ truyện thật từ database (gửi kèm JWT Token để xác thực)
  useEffect(() => {
    if (user?.id && token) {
      fetch(`${API_BASE_URL}/api/mangaka/series?mangakaId=${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          const mapped = data.map((item: any) => ({
            id: item.id,
            title: item.title
          }))
          setSeriesList(mapped)
          if (mapped.length > 0) {
            // Mặc định chọn bộ truyện đầu tiên
            setSelectedSeries(mapped[0].id)
          }
        })
        .catch((err) => console.error("Failed to load series:", err))
    }
  }, [user?.id, token])

  // Lấy danh sách chương của bộ truyện được chọn
  useEffect(() => {
    if (selectedSeries && token) {
      fetch(`${API_BASE_URL}/api/series/${selectedSeries}/chapters`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch chapters")
          return res.json()
        })
        .then((data) => {
          setChapters(data)
          if (data.length > 0) {
            // Keep selection if it's still in the new list, otherwise pick the first one
            const exists = data.some((c: any) => c.chapterId === selectedChapterId)
            if (!exists) {
              setSelectedChapterId(data[0].chapterId)
            }
          } else {
            setSelectedChapterId("")
          }
        })
        .catch((err) => {
          console.error("Failed to load chapters:", err)
          setChapters([])
          setSelectedChapterId("")
        })
    } else {
      setChapters([])
      setSelectedChapterId("")
    }
  }, [selectedSeries, token])

  const loadChapterPages = useCallback(async (chapterId: string) => {
    if (!chapterId || !token) {
      setChapterPages([])
      return
    }

    setIsLoadingPages(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/chapters/${chapterId}/pages`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Failed to fetch chapter pages")
      const pages = await response.json()
      setChapterPages([...pages].sort((a, b) => a.pageNumber - b.pageNumber))
    } catch (error) {
      console.error("Failed to load chapter pages:", error)
      setChapterPages([])
      toast.error("Could not load the pages in this chapter.")
    } finally {
      setIsLoadingPages(false)
    }
  }, [token])

  useEffect(() => {
    void loadChapterPages(selectedChapterId)
  }, [selectedChapterId, loadChapterPages])

  // Hàm tạo chương mới qua API
  const handleCreateChapter = async () => {
    if (!selectedSeries) {
      toast.error("Please select a series first.")
      return
    }
    if (!newChapterNumber) {
      toast.error("Please enter a chapter number.")
      return
    }
    const num = parseInt(newChapterNumber)
    if (isNaN(num) || num < 1 || num > 9999) {
      toast.error("Chapter number must be an integer between 1 and 9999.")
      return
    }

    setIsCreatingChapter(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/series/${selectedSeries}/chapters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          chapterNumber: num,
          title: newChapterTitle.trim() || undefined
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to create the chapter.")
      }

      const createdChapter = await response.json()
      toast.success(`Chapter ${createdChapter.chapterNumber} was created successfully.`)
      
      // Refresh list of chapters and auto select the new one
      const updatedRes = await fetch(`${API_BASE_URL}/api/series/${selectedSeries}/chapters`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (updatedRes.ok) {
        const data = await updatedRes.json()
        setChapters(data)
        const found = data.find((c: any) => c.chapterNumber === num)
        if (found) {
          setSelectedChapterId(found.chapterId)
        } else {
          setSelectedChapterId(createdChapter.chapterId)
        }
      } else {
        setChapters(prev => [...prev, createdChapter])
        setSelectedChapterId(createdChapter.chapterId)
      }

      setNewChapterNumber("")
      setNewChapterTitle("")
      setIsDialogOpen(false)
    } catch (err: any) {
      console.error("Failed to create chapter:", err)
      toast.error(err.message || "An error occurred while creating the chapter.")
    } finally {
      setIsCreatingChapter(false)
    }
  }

  // Validate and upload the complete ordered batch in one request.
  const handleFiles = async (files: File[]) => {
    if (!selectedChapterId) {
      toast.error("Please select or create a chapter before uploading pages.")
      return
    }

    const parsedFiles = files.map((file) => ({ file, match: file.name.match(PAGE_FILE_PATTERN) }))
    const invalidFiles = parsedFiles.filter(({ match }) => !match).map(({ file }) => file.name)
    if (invalidFiles.length > 0) {
      toast.error(`Invalid page name: ${invalidFiles.join(", ")}. Use page_001, page_002...`)
      return
    }

    const orderedFiles = parsedFiles
      .map(({ file, match }) => ({ file, pageNumber: Number(match![1]) }))
      .sort((a, b) => a.pageNumber - b.pageNumber)
    const existingNames = new Set(chapterPages.map((page) => page.originalFileName?.toLowerCase()).filter(Boolean))
    const seenNames = new Set<string>()
    const duplicateNames = orderedFiles.flatMap(({ file }) => {
      const normalizedName = file.name.toLowerCase()
      if (existingNames.has(normalizedName) || seenNames.has(normalizedName)) return [file.name]
      seenNames.add(normalizedName)
      return []
    })
    if (duplicateNames.length > 0) {
      setDuplicateWarning([...new Set(duplicateNames)])
      return
    }

    for (let index = 1; index < orderedFiles.length; index++) {
      if (orderedFiles[index].pageNumber !== orderedFiles[index - 1].pageNumber + 1) {
        toast.error("Page names must use consecutive numbers (page_001, page_002, page_003...).")
        return
      }
    }

    const queuedFiles: UploadedFile[] = orderedFiles.map(({ file }, index) => ({
      id: `new-${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      status: "uploading",
      progress: 50,
    }))
    setUploadedFiles(queuedFiles)

    const formData = new FormData()
    orderedFiles.forEach(({ file }) => formData.append("files", file))

    try {
      const response = await fetch(`${API_BASE_URL}/api/chapters/${selectedChapterId}/upload-pages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 409) {
          setUploadedFiles((current) => current.map((item) => ({ ...item, status: "error", progress: 0 })))
          setDuplicateWarning([errorData.message || "One or more page names already exist in this chapter."])
          return
        }
        throw new Error(errorData.message || "Upload failed")
      }

      const result = await response.json()
      const resultByName = new Map(result.pages.map((page: any) => [page.originalFileName.toLowerCase(), page]))
      setUploadedFiles((current) => current.map((item) => {
        const uploadedPage: any = resultByName.get(item.name.toLowerCase())
        return { ...item, status: "complete", progress: 100, preview: uploadedPage?.imageUrl || item.preview }
      }))
      await loadChapterPages(selectedChapterId)
      toast.success(`${result.totalUploaded} pages uploaded successfully.`)
    } catch (err: any) {
      console.error("Error uploading image to API:", err)
      setUploadedFiles((current) => current.map((item) => ({ ...item, status: "error", progress: 0 })))
      toast.error(err.message || "Could not upload the selected pages.")
    }
  }

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
    if (e.dataTransfer.files) {
      void handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id))
  }

  const moveFile = (index: number, direction: -1 | 1) => {
    setUploadedFiles((current) => {
      const next = [...current]
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= next.length) return current
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
  }

  return (
    <div className="flex flex-col lg:h-[calc(100vh-7.5rem)] space-y-4 overflow-hidden">
      <div className="flex-none">
        <h1 className="text-3xl font-bold tracking-tight">Upload Pages</h1>
        <p className="text-muted-foreground mt-1">Upload manga pages for your series chapters</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Column 1: Selection & Upload zone */}
        <div className="flex flex-col gap-4 min-h-0 lg:overflow-y-auto lg:pr-1">
          {/* Series Selection */}
          <Card className="bg-card border-border flex-none">
            <CardHeader>
              <CardTitle>Select Series & Chapter</CardTitle>
              <CardDescription>Choose the series and chapter you want to upload pages to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Series</Label>
                  <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Select series" />
                    </SelectTrigger>
                    <SelectContent>
                      {seriesList.length === 0 ? (
                        <SelectItem value="loading" disabled>Loading series...</SelectItem>
                      ) : (
                        seriesList.map((series) => (
                          <SelectItem key={series.id} value={series.id}>
                            {series.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.length === 0 ? (
                        <SelectItem value="none" disabled>No chapters available</SelectItem>
                      ) : (
                        chapters.map((ch) => (
                          <SelectItem key={ch.chapterId} value={ch.chapterId}>
                            Ch. {ch.chapterNumber} {ch.title ? `- ${ch.title}` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Chapter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Chapter</DialogTitle>
                    <DialogDescription>Add a new chapter to your selected series</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Chapter Title</Label>
                      <Input
                        placeholder="e.g., The Final Battle"
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Chapter Number</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 46"
                        value={newChapterNumber}
                        onChange={(e) => setNewChapterNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    onClick={handleCreateChapter}
                    disabled={isCreatingChapter}
                  >
                    {isCreatingChapter ? "Creating..." : "Create Chapter"}
                  </Button>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Upload Zone */}
          <Card className="bg-card border-border flex-none">
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>Drag and drop manga pages or click to browse</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Drop your pages here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Support: PNG, JPG, PSD, CLIP (max 50MB per file)
                </p>
                <input
                  type="file"
                  id="file-browse"
                  multiple
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.psd,.clip,image/png,image/jpeg"
                  onChange={(e) => {
                    if (e.target.files) {
                      void handleFiles(Array.from(e.target.files))
                      e.target.value = ""
                    }
                  }}
                />
                <Button variant="outline" onClick={() => document.getElementById("file-browse")?.click()}>
                  <Folder className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Card className="bg-card border-border flex-none">
              <CardHeader>
                <CardTitle>Uploaded Pages ({uploadedFiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-[10px] font-semibold">#{index + 1}</span>
                      </div>
                      <div className="w-16 h-20 bg-muted rounded flex items-center justify-center overflow-hidden border border-border">
                        {file.preview ? (
                          <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{file.size}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Preview order: page slot {index + 1}</p>
                        {file.status === "uploading" && (
                          <div className="mt-2">
                            <Progress value={file.progress} className="h-1.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveFile(index, -1)}
                            disabled={index === 0}
                            title="Move earlier"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveFile(index, 1)}
                            disabled={index === uploadedFiles.length - 1}
                            title="Move later"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                        {file.status === "complete" && (
                          <Badge className="bg-success/20 text-success">
                            <Check className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                        )}
                        {file.status === "uploading" && (
                          <Badge className="bg-primary/20 text-primary">{file.progress}%</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Column 2: Review (middle column, page image previews) */}
        <div className="flex flex-col min-h-0 lg:overflow-hidden">
          <Card className="bg-card border-border flex flex-col h-full min-h-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-none">
              <div>
                <CardTitle>Review</CardTitle>
                <CardDescription>
                  {selectedChapterId
                    ? `${chapterPages.length} current page${chapterPages.length === 1 ? "" : "s"}, ordered from top to bottom`
                    : "Select a chapter to preview its pages"}
                </CardDescription>
              </div>
              <Badge variant="outline">{chapterPages.length} pages</Badge>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col p-6 pt-0">
              {isLoadingPages ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading chapter pages...</div>
              ) : chapterPages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center p-4">
                  <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No pages to review</p>
                  <p className="mt-1 text-sm text-muted-foreground">Uploaded pages will appear here in reading order.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-5 rounded-lg bg-zinc-950/70 p-4">
                  {chapterPages.map((page) => (
                    <figure key={page.pageId} className="mx-auto max-w-3xl overflow-hidden rounded-md border border-border bg-black shadow-xl">
                      <figcaption className="flex items-center justify-between border-b border-border bg-card px-4 py-2 text-sm">
                        <span className="font-medium">{page.originalFileName || `page_${String(page.pageNumber).padStart(3, "0")}`}</span>
                        <Badge variant="secondary">Page {page.pageNumber}</Badge>
                      </figcaption>
                      {page.currentImageUrl ? (
                        <img
                          src={page.currentImageUrl}
                          alt={`Page ${page.pageNumber}`}
                          className="block h-auto w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex aspect-[3/4] items-center justify-center text-muted-foreground">Preview unavailable</div>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Sidebar (Upload Summary & Tips) */}
        <div className="flex flex-col gap-4 min-h-0 lg:overflow-y-auto lg:pr-1">
          <Card className="bg-card border-border flex-none">
            <CardHeader>
              <CardTitle>Upload Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Series</span>
                <span className="font-medium">
                  {selectedSeries
                    ? seriesList.find((s) => s.id === selectedSeries)?.title
                    : "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chapter</span>
                <span className="font-medium">
                  {selectedChapterId
                    ? `Ch. ${chapters.find((c) => c.chapterId === selectedChapterId)?.chapterNumber || ""}`
                    : "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pages</span>
                <span className="font-medium">{chapterPages.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-warning/20 text-warning">Draft</Badge>
              </div>
              <div className="pt-4 border-t border-border">
                <Button className="w-full bg-primary text-primary-foreground" disabled={!selectedSeries || !selectedChapterId || uploadedFiles.length === 0}>
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Continue to Region Selection
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border flex-none">
            <CardHeader>
              <CardTitle>Upload Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>- Name files sequentially (page_001, page_002...)</p>
              <p>- Use high resolution (300 DPI minimum)</p>
              <p>- Keep consistent page dimensions</p>
              <p>- Upload all pages before assigning tasks</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={duplicateWarning.length > 0} onOpenChange={(open) => !open && setDuplicateWarning([])}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate page name</DialogTitle>
            <DialogDescription>
              The upload was stopped because these page names already exist in the chapter or were selected more than once.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/10 p-3">
            {duplicateWarning.map((name) => <p key={name} className="text-sm font-medium text-destructive">{name}</p>)}
          </div>
          <Button onClick={() => setDuplicateWarning([])}>Choose different files</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
