"use client"

import { useState, useEffect } from "react"
import { Upload, X, ImageIcon, Folder, ChevronRight, Check, Plus } from "lucide-react"
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
        .catch((err) => console.error("Lỗi lấy danh sách bộ truyện:", err))
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
          console.error("Lỗi lấy danh sách chương:", err)
          setChapters([])
          setSelectedChapterId("")
        })
    } else {
      setChapters([])
      setSelectedChapterId("")
    }
  }, [selectedSeries, token])

  // Hàm tạo chương mới qua API
  const handleCreateChapter = async () => {
    if (!selectedSeries) {
      toast.error("Vui lòng chọn bộ truyện trước.")
      return
    }
    if (!newChapterNumber) {
      toast.error("Vui lòng nhập số chương.")
      return
    }
    const num = parseInt(newChapterNumber)
    if (isNaN(num) || num < 1 || num > 9999) {
      toast.error("Số chương phải là số nguyên từ 1 đến 9999.")
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
        throw new Error(errData.message || "Tạo chương mới thất bại.")
      }

      const createdChapter = await response.json()
      toast.success(`Đã tạo thành công chương ${createdChapter.chapterNumber}`)
      
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
      console.error("Lỗi tạo chương:", err)
      toast.error(err.message || "Đã xảy ra lỗi khi tạo chương.")
    } finally {
      setIsCreatingChapter(false)
    }
  }

  // Hàm thực hiện gọi API Upload File lên Backend
  const uploadFile = async (file: File, fileId: string) => {
    if (!selectedChapterId) {
      toast.error("Vui lòng chọn hoặc tạo chương truyện trước khi tải lên.")
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "error", progress: 0 } : f
        )
      )
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`${API_BASE_URL}/api/mangaka/chapters/${selectedChapterId}/upload-pages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const fileUrl = await response.text()

      // Tải lên thành công, cập nhật trạng thái trên UI
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "complete", progress: 100, preview: `${API_BASE_URL}${fileUrl}` }
            : f
        )
      )
    } catch (err) {
      console.error("Error uploading image to API:", err)
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: "error", progress: 0 } : f
        )
      )
    }
  }

  // Hàm xử lý khi kéo thả hoặc chọn file từ máy tính
  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, index) => {
      const fileId = `new-${Date.now()}-${index}`
      
      // Gọi API tải lên ngầm
      uploadFile(file, fileId)

      return {
        id: fileId,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        preview: "",
        status: "uploading",
        progress: 50, // Thanh hiển thị ban đầu đang upload
      }
    })
    setUploadedFiles((prev) => [...prev, ...newFiles])
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
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Pages</h1>
        <p className="text-muted-foreground mt-1">Upload manga pages for your series chapters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Series Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Select Series & Chapter</CardTitle>
              <CardDescription>Choose the series and chapter you want to upload pages to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Series</Label>
                  <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                    <SelectTrigger>
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
                    <SelectTrigger>
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
          <Card className="bg-card border-border">
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
                  Support: PNG, JPG, PSD, TIFF (max 50MB per file)
                </p>
                <input
                  type="file"
                  id="file-browse"
                  multiple
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFiles(Array.from(e.target.files))
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Uploaded Pages ({uploadedFiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{file.size}</p>
                        {file.status === "uploading" && (
                          <div className="mt-2">
                            <Progress value={file.progress} className="h-1.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
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

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
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
                <span className="font-medium">{uploadedFiles.length}</span>
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

          <Card className="bg-card border-border">
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
    </div>
  )
}
