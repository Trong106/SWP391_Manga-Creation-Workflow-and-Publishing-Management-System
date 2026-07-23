"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import {
  BookOpen,
  Plus,
  Eye,
  FileText,
  TrendingUp,
  Bookmark,
  AlertCircle,
  Folder,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { readJsonOrThrow } from "@/lib/http"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SeriesDetailModal } from "@/components/manga/series-detail-modal"

const SynopsisRichTextEditor = dynamic(
  () => import("@/components/manga/synopsis-rich-text-editor"),
  { ssr: false },
)

interface Series {
  id: string
  title: string
  titleJp: string
  genre: string
  genres: string[]
  status: string
  chapters: number
  readers: number
  rating: number
  ranking: number | null
  riskLevel: string
  riskReason: string | null
  cancellationReason: string | null
  coverImageUrl: string | null
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, string> = {
  active: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  proposal: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hiatus: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
}

const PRELIMINARY_PAGE_PATTERN = /\.(png|jpe?g|psd|clip)$/i
const MAX_PRELIMINARY_PAGE_SIZE = 50 * 1024 * 1024

const getFileSortName = (file: File) => {
  const fileWithPath = file as File & { webkitRelativePath?: string }
  return fileWithPath.webkitRelativePath || file.name
}

export default function SeriesPage() {
  const { user, token, role, logout } = useAuth()
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreatingSeries, setIsCreatingSeries] = useState(false)
  const createSeriesLockRef = useRef(false)
  
  // Creation form states
  const [newTitle, setNewTitle] = useState("")
  const [newTitleJp, setNewTitleJp] = useState("")
  const [newGenre, setNewGenre] = useState("")
  const [newSynopsis, setNewSynopsis] = useState("")
  const [newChapterTitle, setNewChapterTitle] = useState("Chapter 001")
  const [preliminaryPages, setPreliminaryPages] = useState<File[]>([])

  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchSeries = () => {
    if (user?.id && token) {
      setLoading(true)
      fetch(`${API_BASE_URL}/api/series`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then((res) => {
          if (res.status === 401) {
            logout()
            return null
          }
          if (!res.ok) {
            throw new Error("You do not have permission to view this page.")
          }
          return res.json()
        })
        .then((data) => {
          if (data && Array.isArray(data)) {
            const canViewProposal = role === "mangaka" || role === "editorial"
            const mapped = data
              .map((item: any) => ({
                id: item.seriesId || item.id,
                title: item.title,
                titleJp: item.titleJp || "",
                genre: item.genres?.join(" / ") || "General",
                genres: item.genres || [],
                status: item.status?.toLowerCase() || "proposal",
                chapters: item.chapterCount ?? item.chapters ?? 0,
                readers: item.readerCount ?? item.readers ?? 0,
                rating: item.rating ?? 0,
                ranking: item.ranking ?? null,
                riskLevel: item.riskLevel || "normal",
                riskReason: item.riskReason || null,
                cancellationReason: item.cancellationReason || null,
                coverImageUrl: item.coverImageUrl,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
              }))
              .filter((item) => canViewProposal || item.status !== "proposal")
            setSeries(mapped)
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error("Error fetching series list:", err)
          setSeries([])
          setLoading(false)
        })
    }
  }

  useEffect(() => {
    fetchSeries()
  }, [user?.id, token, role])

  const handleCreateSeries = async () => {
    if (createSeriesLockRef.current || isCreatingSeries || !newTitle.trim() || !token) return

    const orderedPreliminaryPages = [...preliminaryPages].sort((a, b) =>
      getFileSortName(a).localeCompare(getFileSortName(b), undefined, { numeric: true, sensitivity: "base" }),
    )
    const invalidFile = orderedPreliminaryPages.find((file) => !PRELIMINARY_PAGE_PATTERN.test(file.name))
    if (invalidFile) {
      alert(`Unsupported manuscript file: ${invalidFile.name}. Use PNG, JPG, JPEG, PSD, or CLIP files.`)
      return
    }
    const oversizedFile = orderedPreliminaryPages.find((file) => file.size > MAX_PRELIMINARY_PAGE_SIZE)
    if (oversizedFile) {
      alert(`Manuscript file is too large: ${oversizedFile.name}. Each file must be 50 MB or smaller.`)
      return
    }

    createSeriesLockRef.current = true
    setIsCreatingSeries(true)
    try {
      const formData = new FormData()
      formData.append("title", newTitle.trim())
      formData.append("titleJp", newTitleJp)
      formData.append("synopsis", newSynopsis)
      if (newGenre) formData.append("genres", newGenre)
      formData.append("chapterTitle", newChapterTitle || "Chapter 001")
      orderedPreliminaryPages.forEach((file) => formData.append("preliminaryPages", file))

      const res = await fetch(`${API_BASE_URL}/api/series/with-manuscript`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      await readJsonOrThrow(res, "Error creating series")
      setNewTitle("")
      setNewTitleJp("")
      setNewSynopsis("")
      setNewGenre("")
      setNewChapterTitle("Chapter 001")
      setPreliminaryPages([])
      setIsCreateOpen(false)
      fetchSeries()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Server connection error")
    } finally {
      createSeriesLockRef.current = false
      setIsCreatingSeries(false)
    }
  }

  const getFullCoverUrl = (coverPath?: string | null) => {
    if (!coverPath) return ""
    if (coverPath.startsWith("http")) return coverPath
    return `${API_BASE_URL}${coverPath}`
  }

  const handleCardClick = (id: string) => {
    setSelectedSeriesId(id)
    setIsModalOpen(true)
  }

  const totalReaders = series.reduce((acc, s) => acc + s.readers, 0)
  const activeSeries = series.filter((s) => s.status === "active" || s.status === "ongoing").length
  const riskSeries = series.filter((s) => s.riskLevel && s.riskLevel !== "normal")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <BookOpen className="w-6 h-6 text-primary" />
            Series Portfolio
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse manga series and open chapters across the studio workflow
          </p>
        </div>
        {role === "mangaka" && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Series
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-none sm:max-w-[1100px] bg-[#18181b] text-white border-zinc-800 max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Series</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Submit a new proposal. Preliminary manuscript pages are saved directly as Chapter 1.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-zinc-300">Title (English)</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter series title"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="titleJp" className="text-zinc-300">Title (Japanese)</Label>
                <Input
                  id="titleJp"
                  value={newTitleJp}
                  onChange={(e) => setNewTitleJp(e.target.value)}
                  placeholder="Japanese title"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="genre" className="text-zinc-300">Genre</Label>
                <Select value={newGenre} onValueChange={setNewGenre}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 text-white border-zinc-800">
                    <SelectItem value="Action">Action</SelectItem>
                    <SelectItem value="Romance">Romance</SelectItem>
                    <SelectItem value="Comedy">Comedy</SelectItem>
                    <SelectItem value="Fantasy">Fantasy</SelectItem>
                    <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                    <SelectItem value="Horror">Horror</SelectItem>
                    <SelectItem value="Slice of Life">Slice of Life</SelectItem>
                    <SelectItem value="Mystery">Mystery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div>
                  <Label htmlFor="synopsis" className="text-zinc-300">Synopsis</Label>
                  <p className="mt-1 text-xs text-zinc-500">
                    Long-form synopsis supported, including manuscripts over 2,000 words.
                  </p>
                </div>
                <SynopsisRichTextEditor value={newSynopsis} onChange={setNewSynopsis} />
              </div>
              <div className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
                <div>
                  <Label htmlFor="chapterTitle" className="text-zinc-300">Preliminary Manuscript - Chapter 1</Label>
                  <p className="mt-1 text-xs text-zinc-500">
                    These pages will be stored as Chapter 1 and reused after the proposal is approved.
                  </p>
                </div>
                <Input
                  id="chapterTitle"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Chapter 001"
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
                <input
                  id="preliminaryPages"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.psd,.clip"
                  className="hidden"
                  onChange={(event) => setPreliminaryPages(Array.from(event.target.files || []))}
                />
                <input
                  id="preliminaryPagesFolder"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.psd,.clip"
                  className="hidden"
                  {...{ webkitdirectory: "", directory: "" }}
                  onChange={(event) => setPreliminaryPages(Array.from(event.target.files || []))}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                    onClick={() => document.getElementById("preliminaryPages")?.click()}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    Browse Pages
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                    onClick={() => document.getElementById("preliminaryPagesFolder")?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Folder
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  Selected pages: <span className="text-zinc-300 font-semibold">{preliminaryPages.length}</span>. The system will normalize names to page_001, page_002...
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleCreateSeries}
                disabled={isCreatingSeries || !newTitle.trim()}
              >
                {isCreatingSeries ? "Creating Series..." : "Create Series"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{series.length}</p>
                <p className="text-xs text-muted-foreground">Total Series</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeSeries}</p>
                <p className="text-xs text-muted-foreground">Active Series</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{(totalReaders / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Total Readers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {series.reduce((acc, s) => acc + s.chapters, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Chapters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {riskSeries.length > 0 && (
        <div className="rounded-lg border border-warning/35 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="space-y-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Series requiring attention</h2>
                <p className="text-xs text-muted-foreground">
                  Editorial decisions are based on ranking and reader votes. Review these series before the next release cycle.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {riskSeries.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleCardClick(s.id)}
                    className="rounded-md border border-warning/35 bg-card/80 px-3 py-2 text-left text-xs text-foreground shadow-sm transition-colors hover:border-warning/60 hover:bg-warning/15"
                  >
                    <span className="block font-semibold">{s.title}</span>
                    <span className="block text-muted-foreground">
                      {s.cancellationReason || s.riskReason || "Needs editorial attention"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Series Grid in Manga Card Layout */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading series list from database...</div>
      ) : series.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">No series in the database.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {series.map((s) => {
            const coverUrl = getFullCoverUrl(s.coverImageUrl)
            const isCancelled = s.status === "cancelled"
            return (
              <div
                key={s.id}
                onClick={() => handleCardClick(s.id)}
                className={`group cursor-pointer space-y-2.5 transition-all duration-300 ${isCancelled ? "opacity-55 grayscale hover:grayscale-0 hover:opacity-80" : ""}`}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-zinc-800 bg-[#202023] flex items-center justify-center">
                  {s.coverImageUrl ? (
                    <img
                      src={coverUrl}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <BookOpen className="w-8 h-8 text-zinc-700 mx-auto mb-1" />
                      <span className="text-[10px] text-zinc-500">No cover</span>
                    </div>
                  )}

                  {/* Bookmark tag */}
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-[#000000]/60 text-white/90 hover:text-yellow-500 hover:bg-[#000000]/80 transition-colors">
                    <Bookmark className="w-3.5 h-3.5" />
                  </div>
                  {s.riskLevel !== "normal" && (
                    <div className="absolute left-2 top-2 rounded-full bg-amber-500/95 px-2 py-1 text-[10px] font-bold text-black">
                      {s.riskLevel === "cancelled" ? "Cancelled" : "At risk"}
                    </div>
                  )}
                </div>

                {/* Text Info */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm truncate text-zinc-100 group-hover:text-primary transition-colors leading-tight">
                    {s.title}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Chapter {s.chapters}</span>
                    <Badge variant="outline" className={`${statusColors[s.status] || "bg-secondary text-secondary-foreground border-none"} text-[10px] px-1 py-0`}>
                      {s.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reusable Series Detail Modal */}
      {selectedSeriesId && (
        <SeriesDetailModal
          seriesId={selectedSeriesId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSeriesId(null)
          }}
          onUpdate={fetchSeries}
        />
      )}
    </div>
  )
}
