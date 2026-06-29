"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Search,
  ArrowLeft,
  ArrowRight,
  Star,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Calendar,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Send,
  Check,
  FileText,
  SlidersHorizontal,
  BadgeCheck,
  Info
} from "lucide-react"
import { toast } from "sonner"

interface Series {
  id: string
  title: string
  titleJp: string | null
  author: string
  createdAt: string
  genre: string
  genres: string[]
  chapters: number
  status: string
  rating: number | null
  readerCount: number
  coverImageUrl: string | null
  synopsis: string | null
}

interface Chapter {
  chapterId: string
  seriesId: string
  seriesTitle: string
  chapterNumber: number
  title: string
  status: string
  dueDate: string | null
  submittedForPublishingAt: string | null
  pageCount: number
}

interface Page {
  pageId: string
  chapterId: string
  pageNumber: number
  currentImageUrl: string | null
  status: string
  uploadedById: string | null
  uploadedByName: string | null
  uploadedAt: string | null
  annotationCount: number
  taskCount: number
}

interface Task {
  id: string
  title: string
  status: string
  chapterNumber: number
  seriesTitle: string | null
  assigneeName: string | null
  assigneeAvatar: string | null
}

export default function SubmitToPublishPage() {
  const { role, token } = useAuth()

  const isPendingEditorialApproval = (chapter?: Chapter | null) =>
    chapter?.status?.toLowerCase() === "review" && Boolean(chapter.submittedForPublishingAt)

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A"
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  // Navigation and Selection state
  const [activeView, setActiveView] = useState<"select_series" | "submit_publish">("select_series")
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null)
  
  // Chapter & Page state
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  
  // Loading states
  const [loadingSeries, setLoadingSeries] = useState(true)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingPages, setLoadingPages] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [publishing, setPublishing] = useState(false)
  
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState<string>("All")

  // Fetch Series list
  const fetchSeries = async () => {
    if (!token) return
    try {
      setLoadingSeries(true)
      const res = await fetch(`${API_BASE_URL}/api/data/series`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Failed to load series")
      const data = await res.json()
      // Filter out proposals, only show active or completed series for publication
      const activeSeries = data.filter((s: any) => s.status === "active" || s.status === "completed")
      setSeriesList(activeSeries)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load series list.")
    } finally {
      setLoadingSeries(false)
    }
  }

  // Fetch chapters for the selected series
  const fetchChapters = async (seriesId: string) => {
    if (!token) return
    try {
      setLoadingChapters(true)
      const res = await fetch(`${API_BASE_URL}/api/series/${seriesId}/chapters`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Failed to load chapters")
      const data = await res.json()
      setChapters(data)
      
      // Auto-select the latest chapter that needs publishing, or the most recent one
      if (data.length > 0) {
        const pendingPublish = data.find((c: Chapter) => isPendingEditorialApproval(c))
        if (pendingPublish) {
          setSelectedChapterId(pendingPublish.chapterId)
        } else {
          // Sort by chapter number descending and pick the top one
          const sorted = [...data].sort((a: any, b: any) => b.chapterNumber - a.chapterNumber)
          setSelectedChapterId(sorted[0].chapterId)
        }
      } else {
        setSelectedChapterId(null)
        setPages([])
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load chapters for this series.")
    } finally {
      setLoadingChapters(false)
    }
  }

  // Fetch pages for selected chapter
  const fetchPages = async (chapterId: string) => {
    if (!token) return
    try {
      setLoadingPages(true)
      const res = await fetch(`${API_BASE_URL}/api/chapters/${chapterId}/pages`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Failed to load pages")
      const data = await res.json()
      setPages(data)
    } catch (err: any) {
      console.error(err)
      toast.error("Failed to load manuscript pages.")
    } finally {
      setLoadingPages(false)
    }
  }

  // Fetch tasks to extract collaborator profiles
  const fetchTasksAndCollaborators = async () => {
    if (!token) return
    try {
      setLoadingTasks(true)
      const res = await fetch(`${API_BASE_URL}/api/data/tasks`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchSeries()
    }
  }, [token])

  useEffect(() => {
    if (token && selectedSeriesId) {
      fetchChapters(selectedSeriesId)
      fetchTasksAndCollaborators()
    }
  }, [selectedSeriesId, token])

  useEffect(() => {
    if (token && selectedChapterId) {
      fetchPages(selectedChapterId)
      const found = chapters.find(c => c.chapterId === selectedChapterId)
      if (found) {
        setSelectedChapter(found)
      }
    } else {
      setSelectedChapter(null)
      setPages([])
    }
  }, [selectedChapterId, chapters, token])

  // Guard Clause for Authorization
  if (role !== "tantou") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center text-destructive">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-destructive">Access Denied</h2>
        <p className="text-zinc-400 text-sm">
          This portal is reserved strictly for Tantou Editors to review and submit completed manuscripts for publication.
        </p>
      </div>
    )
  }

  const handleSelectSeries = (series: Series) => {
    setSelectedSeriesId(series.id)
    setSelectedSeries(series)
    setActiveView("submit_publish")
  }

  const handleBackToSeries = () => {
    setActiveView("select_series")
    setSelectedSeriesId(null)
    setSelectedSeries(null)
    setSelectedChapterId(null)
    setSelectedChapter(null)
    setChapters([])
    setPages([])
  }

  const handlePublish = async () => {
    if (!selectedChapterId || !token) return
    try {
      setPublishing(true)

      // Submit chapter for publishing review — Editorial Board will approve & schedule separately
      const res = await fetch(`${API_BASE_URL}/api/chapters/${selectedChapterId}/submit`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as any).message || "Failed to submit chapter")
      }

      toast.success("Chapter submitted for review! Awaiting Editorial Board approval.")
      if (selectedSeriesId) {
        await fetchChapters(selectedSeriesId)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "An error occurred while submitting.")
    } finally {
      setPublishing(false)
    }
  }

  // Formatting helpers
  const formatReaderCount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`
    return val.toString()
  }

  const getFullCoverUrl = (path?: string | null) => {
    if (!path) return ""
    if (path.startsWith("http")) return path
    return `${API_BASE_URL}${path}`
  }

  // Get unique genres list across all series
  const genresSet = new Set<string>()
  seriesList.forEach(s => s.genres.forEach(g => genresSet.add(g)))
  const availableGenres = ["All", ...Array.from(genresSet)]

  // Filter series
  const filteredSeries = seriesList.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.titleJp && s.titleJp.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesGenre = selectedGenre === "All" || s.genres.includes(selectedGenre)
    return matchesSearch && matchesGenre
  })

  // Calculations for selected chapter
  const totalPageCount = pages.length
  const approvedPageCount = pages.filter(p => p.status.toLowerCase() === "approved").length
  const validationPassPct = totalPageCount > 0 ? Math.round((approvedPageCount / totalPageCount) * 100) : 0
  const isQCVerified = totalPageCount > 0 && approvedPageCount === totalPageCount

  // Collaborators mapping from actual tasks
  const chapterTasks = tasks.filter(t => 
    selectedSeries && 
    t.seriesTitle === selectedSeries.title && 
    selectedChapter && 
    t.chapterNumber === selectedChapter.chapterNumber
  )
  const collaborators = Array.from(
    new Map(
      chapterTasks
        .filter(t => t.assigneeName)
        .map(t => [t.assigneeName, t])
    ).values()
  )

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto text-zinc-100">
      
      {/* ─── VIEW 1: SELECT SERIES ─── */}
      {activeView === "select_series" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <span>Series</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-zinc-200">Select Series</span>
              </nav>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Publishing: <span className="text-primary">Select Series</span>
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Choose an active series to review proofs and schedule final publication.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filter by series name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all text-white placeholder-zinc-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Genre:</span>
              <div className="flex flex-wrap gap-1.5">
                {availableGenres.slice(0, 6).map((genre) => (
                  <Button
                    key={genre}
                    variant={selectedGenre === genre ? "default" : "outline"}
                    onClick={() => setSelectedGenre(genre)}
                    className={`text-xs font-semibold px-3.5 py-1.5 h-auto rounded-full ${
                      selectedGenre === genre 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Series Grid */}
          {loadingSeries ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-zinc-400 text-sm">Loading series...</p>
            </div>
          ) : filteredSeries.length === 0 ? (
            <Card className="bg-card border-border p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-white">No Series Found</h2>
              <p className="text-zinc-400 text-sm max-w-sm">
                No active or completed series match your current search constraints.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSeries.map((series) => (
                <div 
                  key={series.id} 
                  className="group bg-zinc-950/40 border border-zinc-850 hover:border-primary/40 rounded-xl overflow-hidden shadow-md transition-all duration-300 flex flex-col hover:shadow-[0_0_20px_rgba(1,223,192,0.05)]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900 flex items-center justify-center">
                    {series.coverImageUrl ? (
                      <img 
                        src={getFullCoverUrl(series.coverImageUrl)} 
                        alt={series.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-zinc-750" />
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary/25 text-primary border border-primary/30 uppercase text-[9px] tracking-wider font-extrabold px-2 py-0.5 capitalize">
                        {series.status}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-65"></div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col gap-4">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-base text-zinc-100 group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {series.title}
                      </h3>
                      {series.titleJp && (
                        <p className="text-xs text-zinc-500 italic truncate font-sans">{series.titleJp}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-zinc-900 text-center text-xs">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Chapters</span>
                        <span className="font-bold text-primary font-mono mt-0.5">{series.chapters}</span>
                      </div>
                      <div className="flex flex-col border-x border-zinc-900/60">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Readers</span>
                        <span className="font-bold text-zinc-300 font-mono mt-0.5">{formatReaderCount(series.readerCount)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Rating</span>
                        <div className="flex items-center justify-center gap-0.5 font-bold text-zinc-300 font-mono mt-0.5">
                          {series.rating ? series.rating.toFixed(1) : "—"}
                          {series.rating && <Star className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />}
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleSelectSeries(series)}
                      className="w-full mt-auto bg-primary hover:bg-primary-container text-background font-bold text-xs h-9.5 flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(1,223,192,0.15)] transition-all rounded-lg"
                    >
                      Select Series
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── VIEW 2: SUBMIT TO PUBLISH DETAIL ─── */}
      {activeView === "submit_publish" && selectedSeries && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                <span className="cursor-pointer hover:text-primary" onClick={handleBackToSeries}>Series</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="cursor-pointer hover:text-primary" onClick={handleBackToSeries}>{selectedSeries.title}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-zinc-200">
                  {selectedChapter ? `Chapter ${selectedChapter.chapterNumber} Release` : "Review Publication"}
                </span>
              </nav>
              <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBackToSeries}
                  className="mr-1 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                Submit to Publish
              </h2>
              <p className="text-zinc-400 text-sm mt-1 ml-12">
                Final manuscript verification for production deployment on MangaFlow.
              </p>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-850 px-4 py-2.5 rounded-xl flex items-center gap-3 self-start md:self-end">
              <div className="text-right">
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">Publication Status</p>
                <p className={`font-bold text-xs tracking-wider uppercase ${
                  selectedChapter?.status.toLowerCase() === "published"
                    ? "text-primary"
                    : isPendingEditorialApproval(selectedChapter)
                    ? "text-amber-400"
                    : isQCVerified
                    ? "text-primary-fixed"
                    : "text-amber-400"
                }`}>
                  {selectedChapter?.status.toLowerCase() === "published"
                    ? "PUBLISHED & LIVE"
                    : isPendingEditorialApproval(selectedChapter)
                    ? "PENDING EDITORIAL APPROVAL"
                    : isQCVerified
                    ? "READY FOR PUBLICATION"
                    : "IN PROGRESS / REVIEW"}
                </p>
              </div>
              <BadgeCheck className={`w-8 h-8 fill-zinc-950 ${
                selectedChapter?.status.toLowerCase() === "published" || isQCVerified
                  ? "text-primary animate-pulse"
                  : isPendingEditorialApproval(selectedChapter)
                  ? "text-amber-400 animate-pulse"
                  : "text-amber-500"
              }`} />
            </div>
          </div>

          {/* Chapter Selector Dropdown */}
          <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 flex items-center gap-4">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider shrink-0">Select Chapter:</span>
            {loadingChapters ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : chapters.length === 0 ? (
              <span className="text-sm text-zinc-500 italic">No chapters available for this series.</span>
            ) : (
              <Select 
                value={selectedChapterId || ""} 
                onValueChange={(val) => setSelectedChapterId(val)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white text-xs h-9 w-64">
                  <SelectValue placeholder="Choose a chapter" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {chapters.map((c) => (
                    <SelectItem 
                      key={c.chapterId} 
                      value={c.chapterId}
                      className="text-xs hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                    >
                      Vol. {c.chapterNumber} - {c.title || "Untitled"} ({c.status.replace("_", " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedChapter ? (
            <div className="space-y-6">
              {/* Bento Grid layout */}
              <div className="grid grid-cols-12 gap-6">
                
                {/* Bento Card 1: Chapter Details */}
                <div className="col-span-12 lg:col-span-8 bg-zinc-950/40 border border-zinc-850 rounded-xl p-5 relative overflow-hidden flex flex-col md:flex-row gap-5">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] pointer-events-none text-primary">
                    <BookOpen className="w-full h-full" />
                  </div>
                  
                  <div className="w-full md:w-44 aspect-[3/4] bg-zinc-900 rounded-lg border border-zinc-800 shadow-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {selectedSeries.coverImageUrl ? (
                      <img 
                        src={getFullCoverUrl(selectedSeries.coverImageUrl)} 
                        alt={selectedSeries.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="w-12 h-12 text-zinc-700" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border border-primary/20 text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5">
                          {selectedSeries.genres[0] || "Weekly Serialization"}
                        </Badge>
                        <span className="text-[10px] text-zinc-500 font-mono">Chapter ID: {selectedChapter.chapterId.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <h3 className="font-extrabold text-2xl text-white tracking-tight leading-tight">
                        {selectedSeries.title}
                      </h3>
                      {selectedSeries.titleJp && (
                        <p className="text-xs text-zinc-500 italic font-sans">{selectedSeries.titleJp}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-zinc-900/60 pt-4">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Chapter Number</span>
                        <p className="font-bold text-base text-zinc-100 font-mono mt-0.5">Vol. {selectedChapter.chapterNumber}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Chapter Title</span>
                        <p className="font-bold text-base text-zinc-100 mt-0.5 truncate max-w-[200px]" title={selectedChapter.title}>
                          {selectedChapter.title || "Untitled"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Current Status</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            selectedChapter.status === "published" 
                              ? "bg-primary shadow-[0_0_8px_rgba(1,223,192,0.6)]" 
                              : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          }`} />
                          <span className={`text-xs font-bold capitalize ${
                            selectedChapter.status === "published" ? "text-primary" : "text-amber-400"
                          }`}>
                            {selectedChapter.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Release Deadline</span>
                        <p className="font-bold text-base text-destructive font-mono mt-0.5">
                          {formatDueDate(selectedChapter.dueDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bento Card 2: Publication Summary */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-zinc-950/40 border border-zinc-850 rounded-xl p-5 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-zinc-200 uppercase tracking-wider border-l-2 border-primary pl-2.5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Publication Summary
                    </h4>

                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-zinc-400">Total Page Count</span>
                        <span className="font-bold text-zinc-200 font-mono text-sm">{totalPageCount}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-zinc-400">Validation Pass</span>
                        <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border ${
                          validationPassPct === 100 
                            ? "bg-primary/10 text-primary border-primary/20" 
                            : "bg-amber-950/40 text-amber-400 border-amber-800/30"
                        }`}>
                          {validationPassPct}% SUCCESS
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                        <span className="text-zinc-400">Quality Check</span>
                        <span className={`font-bold ${isQCVerified ? "text-primary" : "text-amber-400"}`}>
                          {isQCVerified ? "Verified (All OK)" : "Pending Approvals"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-zinc-400">Published At</span>
                        <span className="text-zinc-400 italic">
                          {selectedChapter.submittedForPublishingAt 
                            ? new Date(selectedChapter.submittedForPublishingAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) 
                            : "Not yet submitted"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-dashed border-zinc-800 flex items-start gap-2 text-[10px] text-zinc-400 leading-normal">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      {isPendingEditorialApproval(selectedChapter)
                        ? "This chapter has been submitted and is awaiting approval by the Editorial Board. They will review and set the final publish date."
                        : selectedChapter?.status.toLowerCase() === "published"
                        ? "This chapter is live and visible to all readers."
                        : `Submitting will send this chapter to the Editorial Board for approval. Final publishing will notify ${formatReaderCount(selectedSeries.readerCount)} subscribers.`}
                    </span>
                  </div>
                </div>

                {/* Bento Card 3: Collaborators */}
                <div className="col-span-12 md:col-span-6 lg:col-span-12 bg-zinc-950/40 border border-zinc-850 rounded-xl p-5 space-y-4">
                  <h4 className="font-bold text-sm text-zinc-200 uppercase tracking-wider border-l-2 border-primary pl-2.5 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Chapter Collaborators ({collaborators.length})
                  </h4>
                  
                  {loadingTasks ? (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-xs text-zinc-500 animate-pulse">Loading collaborators...</span>
                    </div>
                  ) : collaborators.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic py-2">No team tasks recorded for this chapter yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-4 py-2">
                      {collaborators.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                          <Avatar className="w-6 h-6 border border-primary/40">
                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.assigneeAvatar}`} />
                            <AvatarFallback>{c.assigneeName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="text-xs font-bold text-zinc-200">{c.assigneeName}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manuscript Pages Proof Grid */}
                <div className="col-span-12 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <h4 className="font-bold text-sm text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-primary" />
                      Manuscript Proof ({totalPageCount} Pages)
                    </h4>
                  </div>

                  {loadingPages ? (
                    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <p className="text-zinc-500 text-xs">Loading manuscript pages...</p>
                    </div>
                  ) : pages.length === 0 ? (
                    <Card className="bg-card border-border p-12 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-white">No Manuscript Pages Available</h3>
                      <p className="text-zinc-500 text-xs max-w-xs">
                        No pages have been uploaded to this chapter yet. Ask the Mangaka to upload the manuscript.
                      </p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {pages.map((page) => {
                        const isApproved = page.status.toLowerCase() === "approved"
                        return (
                          <div 
                            key={page.pageId} 
                            className="group relative aspect-[3/4] bg-zinc-900 border border-zinc-800 hover:border-primary/60 rounded overflow-hidden cursor-pointer shadow-sm transition-all"
                          >
                            {page.currentImageUrl ? (
                              <img 
                                src={getFullCoverUrl(page.currentImageUrl)} 
                                alt={`Page ${page.pageNumber}`} 
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-650 bg-zinc-950">
                                <FileText className="w-8 h-8" />
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                              <span className="text-[9px] font-bold text-white uppercase tracking-wider">QC Details</span>
                            </div>
                            
                            <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-zinc-300 text-[9px] font-mono px-2 py-0.5 rounded border border-zinc-800">
                              P. {page.pageNumber}
                            </div>

                            <div className="absolute top-2 right-2 shadow-md">
                              <Badge className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                isApproved
                                  ? "bg-primary text-background"
                                  : page.status.toLowerCase() === "review"
                                  ? "bg-amber-500 text-background animate-pulse"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}>
                                {isApproved ? "OK" : page.status}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Fixed Bottom Action Bar */}
              <div className="fixed bottom-0 right-0 w-full lg:w-[calc(100%-16rem)] bg-zinc-950/90 border-t border-zinc-850 py-4 px-6 flex items-center justify-between backdrop-blur-md z-40 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {collaborators.slice(0, 3).map((c, i) => (
                      <Avatar key={i} className="w-8 h-8 border-2 border-zinc-950 shadow-md">
                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${c.assigneeAvatar}`} />
                        <AvatarFallback>{c.assigneeName?.[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                    {collaborators.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        +{collaborators.length - 3}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-medium hidden sm:block">
                    {collaborators.length > 0 
                      ? `${collaborators.length} team members contributed to this manuscript.`
                      : "Awaiting manuscript reviews and completion."
                    }
                  </p>
                </div>

              <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={handleBackToSeries}
                    className="px-5 py-2 text-xs font-bold text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800 rounded-lg transition-all"
                  >
                    Return to Series
                  </Button>

                  {/* Only show submit controls if chapter not yet submitted/published */}
                  {selectedChapter.status.toLowerCase() !== "published" &&
                   !isPendingEditorialApproval(selectedChapter) && (
                    <Button
                      onClick={handlePublish}
                      disabled={!isQCVerified || publishing}
                      className={`font-bold text-xs px-6 py-2.5 h-auto rounded-lg flex items-center gap-2 transition-all ${
                        !isQCVerified
                          ? "bg-zinc-800 text-zinc-500 border border-zinc-800 shadow-none hover:shadow-none hover:bg-zinc-800"
                          : "bg-primary hover:bg-primary-container text-background font-extrabold shadow-[0_0_20px_rgba(1,223,192,0.15)] hover:shadow-[0_0_30px_rgba(1,223,192,0.3)]"
                      }`}
                      id="submit-to-publish-btn"
                    >
                      {publishing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 shrink-0" />
                          Submit to Publish
                        </>
                      )}
                    </Button>
                  )}

                  {/* Pending approval state */}
                  {isPendingEditorialApproval(selectedChapter) && (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-amber-400">Awaiting Editorial Approval</p>
                        <p className="text-[10px] text-zinc-500">Editorial Board will review &amp; approve</p>
                      </div>
                    </div>
                  )}

                  {/* Published state */}
                  {selectedChapter.status.toLowerCase() === "published" && (
                    <div className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/30 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-bold text-primary">Published Successfully</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            !loadingChapters && (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-zinc-500">
                <FileText className="w-12 h-12 text-zinc-700" />
                <p className="text-sm">Please select a chapter above to inspect manuscript proofs.</p>
              </div>
            )
          )}

        </div>
      )}

    </div>
  )
}
