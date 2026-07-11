"use client"

import { useState, useEffect, useCallback } from "react"
import { Upload, ImageIcon, Folder, ChevronRight, Check, Plus, GripVertical } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { readJsonOrThrow } from "@/lib/http"
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

interface UploadHistoryItem {
  pageVersionId: string
  pageId: string
  pageNumber: number
  versionNumber: number
  fileUrl: string
  fileName: string
  uploadedByName?: string
  createdAt: string
  isCurrent: boolean
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
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([])
  const [isLoadingPages, setIsLoadingPages] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string[]>([])
  const [overwriteWarning, setOverwriteWarning] = useState<string[]>([])
  const [pendingOverwriteFiles, setPendingOverwriteFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Lấy danh sách bộ truyện thật từ database (gửi kèm JWT Token để xác thực)
  useEffect(() => {
    if (user?.id && token) {
      fetch(`${API_BASE_URL}/api/mangaka/series?mangakaId=${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then((res) => readJsonOrThrow(res, "Failed to fetch series"))
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
          return readJsonOrThrow(res, "Failed to fetch chapters")
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

  const loadChapterUploadHistory = useCallback(async (chapterId: string) => {
    if (!chapterId || !token) {
      setUploadHistory([])
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chapters/${chapterId}/versions`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      const data = await readJsonOrThrow(response, "Failed to fetch chapter upload history")
      const history = (data.pages || [])
        .flatMap((page: any) => (page.versions || []).map((version: any) => ({
          pageVersionId: version.pageVersionId,
          pageId: version.pageId,
          pageNumber: page.pageNumber,
          versionNumber: version.versionNumber,
          fileUrl: version.fileUrl,
          fileName: version.fileName,
          uploadedByName: version.uploadedByName,
          createdAt: version.createdAt,
          isCurrent: version.isCurrent,
        })))
        .sort((a: UploadHistoryItem, b: UploadHistoryItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setUploadHistory(history)
    } catch (error) {
      console.error("Failed to load chapter upload history:", error)
      setUploadHistory([])
    }
  }, [token])

  const loadChapterPages = useCallback(async (chapterId: string) => {
    if (!chapterId || !token) {
      setChapterPages([])
      setUploadHistory([])
      return
    }

    setIsLoadingPages(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/chapters/${chapterId}/pages`, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      const pages = await readJsonOrThrow(response, "Failed to fetch chapter pages")
      setChapterPages([...pages].sort((a, b) => a.pageNumber - b.pageNumber))
      await loadChapterUploadHistory(chapterId)
    } catch (error) {
      console.error("Failed to load chapter pages:", error)
      setChapterPages([])
      setUploadHistory([])
      toast.error("Could not load the pages in this chapter.")
    } finally {
      setIsLoadingPages(false)
    }
  }, [token, loadChapterUploadHistory])

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

      const createdChapter = await readJsonOrThrow(response, "Failed to create the chapter.")
      toast.success(`Chapter ${createdChapter.chapterNumber} was created successfully.`)
      
      // Refresh list of chapters and auto select the new one
      const updatedRes = await fetch(`${API_BASE_URL}/api/series/${selectedSeries}/chapters`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      
      if (updatedRes.ok) {
        const data = await readJsonOrThrow(updatedRes, "Failed to refresh chapters")
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
  const handleFiles = async (files: File[], allowOverwrite = false) => {
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
    const existingPageNumbers = new Set(chapterPages.map((page) => page.pageNumber))
    const seenPageNumbers = new Set<number>()
    const duplicateNames = orderedFiles.flatMap(({ file, pageNumber }) => {
      if (seenPageNumbers.has(pageNumber)) return [file.name]
      seenPageNumbers.add(pageNumber)
      return []
    })
    if (duplicateNames.length > 0) {
      setDuplicateWarning([...new Set(duplicateNames)])
      return
    }

    const overwriteNames = orderedFiles
      .filter(({ pageNumber }) => existingPageNumbers.has(pageNumber))
      .map(({ file, pageNumber }) => `${file.name} -> Page ${pageNumber}`)
    if (overwriteNames.length > 0 && !allowOverwrite) {
      setPendingOverwriteFiles(files)
      setOverwriteWarning(overwriteNames)
      return
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

      const result = await readJsonOrThrow(response, "Upload failed")
      const resultByName = new Map(result.pages.map((page: any) => [page.originalFileName.toLowerCase(), page]))
      setUploadedFiles((current) => current.map((item) => {
        const uploadedPage: any = resultByName.get(item.name.toLowerCase())
        return { ...item, status: "complete", progress: 100, preview: uploadedPage?.imageUrl || item.preview }
      }))
      await loadChapterPages(selectedChapterId)
      setPendingOverwriteFiles([])
      setOverwriteWarning([])
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

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving the dropzone itself, not a child element
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      void handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const getFullImageUrl = (path?: string | null) => {
    if (!path) return ""
    if (path.startsWith("http")) return path
    return `${API_BASE_URL}${path}`
  }

  const formatUploadTime = (value?: string | null) => {
    if (!value) return ""
    return new Date(value).toLocaleString()
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
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  isDragging
                    ? "dropzone-active"
                    : "border-border hover:border-primary/50 hover:bg-primary/3"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 transition-all duration-300 ${
                  isDragging ? "text-primary scale-125 animate-bounce" : "text-muted-foreground"
                }`} />
                <p className={`text-lg font-medium mb-2 transition-colors duration-200 ${
                  isDragging ? "text-primary" : ""
                }`}>
                  {isDragging ? "Release to upload!" : "Drop your pages here"}
                </p>
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
                <Button
                  variant="outline"
                  className="btn-magnetic"
                  onClick={() => document.getElementById("file-browse")?.click()}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded history */}
          {selectedChapterId && (
            <Card className="bg-card border-border flex-none">
              <CardHeader>
                <CardTitle>Uploaded Pages ({uploadHistory.length})</CardTitle>
                <CardDescription>Upload history for the selected chapter</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadHistory.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                    No upload history for this chapter yet.
                  </div>
                ) : (
                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {uploadHistory.map((item, idx) => (
                    <div
                      key={item.pageVersionId}
                      className="file-item-enter flex items-center gap-4 p-3 bg-secondary/50 rounded-lg border border-border/40 hover:border-primary/20 transition-all duration-200 group"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-[10px] font-semibold">P{item.pageNumber}</span>
                      </div>
                      <div className="w-16 h-20 bg-muted rounded flex items-center justify-center overflow-hidden border border-border">
                        {item.fileUrl ? (
                          <img src={getFullImageUrl(item.fileUrl)} alt={item.fileName} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.fileName}</p>
                        <p className="text-sm text-muted-foreground">Version {item.versionNumber}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatUploadTime(item.createdAt)}
                          {item.uploadedByName ? ` by ${item.uploadedByName}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isCurrent ? (
                          <Badge className="bg-success/20 text-success">
                            <Check className="w-3 h-3 mr-1" />
                            Current
                          </Badge>
                        ) : (
                          <Badge variant="outline">History</Badge>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
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
                          src={getFullImageUrl(page.currentImageUrl)}
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
                <Button className="w-full bg-primary text-primary-foreground" disabled={!selectedSeries || !selectedChapterId || chapterPages.length === 0}>
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
            <DialogTitle>Duplicate page in selected files</DialogTitle>
            <DialogDescription>
              The upload was stopped because the selected batch contains the same page slot more than once.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/10 p-3">
            {duplicateWarning.map((name) => <p key={name} className="text-sm font-medium text-destructive">{name}</p>)}
          </div>
          <Button onClick={() => setDuplicateWarning([])}>Choose different files</Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={overwriteWarning.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setOverwriteWarning([])
            setPendingOverwriteFiles([])
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overwrite existing pages?</DialogTitle>
            <DialogDescription>
              These uploads match pages already in this chapter. If you continue, each matched page will keep its history and receive a new current version.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-warning/30 bg-warning/10 p-3">
            {overwriteWarning.map((name) => <p key={name} className="text-sm font-medium text-warning">{name}</p>)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setOverwriteWarning([])
                setPendingOverwriteFiles([])
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground"
              onClick={() => {
                const filesToUpload = pendingOverwriteFiles
                setOverwriteWarning([])
                setPendingOverwriteFiles([])
                void handleFiles(filesToUpload, true)
              }}
            >
              Overwrite and keep history
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
