"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import {
  BookOpen,
  Plus,
  Eye,
  FileText,
  TrendingUp,
  Bookmark,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SeriesDetailModal } from "@/components/manga/series-detail-modal"

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

export default function SeriesPage() {
  const { user, token, role, logout } = useAuth()
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Creation form states
  const [newTitle, setNewTitle] = useState("")
  const [newTitleJp, setNewTitleJp] = useState("")
  const [newGenre, setNewGenre] = useState("")
  const [newSynopsis, setNewSynopsis] = useState("")

  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchSeries = () => {
    if (role !== "mangaka") {
      setSeries([])
      setLoading(false)
      return
    }

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
            const mapped = data.map((item: any) => ({
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
    if (!newTitle.trim() || !token) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/series`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          titleJp: newTitleJp,
          synopsis: newSynopsis,
          genres: newGenre ? [newGenre] : []
        })
      })

      if (res.ok) {
        // Clear form
        setNewTitle("")
        setNewTitleJp("")
        setNewSynopsis("")
        setNewGenre("")
        setIsCreateOpen(false)
        fetchSeries()
      } else {
        const errorData = await res.json()
        alert(errorData.message || "Error creating series")
      }
    } catch (err) {
      console.error(err)
      alert("Server connection error")
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

  if (role !== "mangaka") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-destructive">Access Denied</h1>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            My Series is reserved for Mangaka accounts. Use your role-specific sidebar to continue the workflow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <BookOpen className="w-6 h-6 text-primary" />
            My Series
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all your manga series and chapters
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Series
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#18181b] text-white border-zinc-800">
            <DialogHeader>
              <DialogTitle>Create New Series</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Start a new manga series. You can add chapters and pages later.
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
                  placeholder="日本語タイトル"
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
                <Label htmlFor="synopsis" className="text-zinc-300">Synopsis</Label>
                <Textarea
                  id="synopsis"
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  placeholder="Brief description of your manga..."
                  rows={3}
                  className="bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:bg-zinc-900" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCreateSeries}>Create Series</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="space-y-2">
              <div>
                <h2 className="text-sm font-semibold text-amber-100">Series requiring attention</h2>
                <p className="text-xs text-amber-100/75">
                  Editorial decisions are based on ranking and reader votes. Review these series before the next release cycle.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {riskSeries.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleCardClick(s.id)}
                    className="rounded-md border border-amber-400/30 bg-black/20 px-3 py-2 text-left text-xs text-amber-50 hover:bg-amber-500/15"
                  >
                    <span className="block font-semibold">{s.title}</span>
                    <span className="block text-amber-100/70">
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
            return (
              <div
                key={s.id}
                onClick={() => handleCardClick(s.id)}
                className="group cursor-pointer space-y-2.5"
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
