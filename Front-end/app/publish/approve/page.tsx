"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import {
  CheckCircle,
  Clock,
  Eye,
  Rocket,
  Search,
  Check,
  X,
  Loader2,
  BookOpen,
  Filter,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface PublishSchedule {
  scheduleId: string
  chapterId: string
  chapterNumber: number
  chapterTitle: string | null
  seriesTitle: string
  scheduledDate: string
  status: string
  approvedById: string | null
  approvedByName: string | null
  publishedAt: string | null
  createdAt: string
  coverImageUrl: string | null
  authorName: string | null
  rating: number | null
  readerCount: number
  chapterStatus: string | null
}

const statusColors: Record<string, string> = {
  scheduled: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  published: "bg-[#00dfc0]/20 text-[#00dfc0] border-[#00dfc0]/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
}

const statusLabels: Record<string, string> = {
  scheduled: "Scheduled",
  published: "Published",
  cancelled: "Cancelled",
}

export default function ApprovePublishingPage() {
  const { token, logout } = useAuth()
  const [schedules, setSchedules] = useState<PublishSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters and Selection
  const [searchQuery, setSearchQuery] = useState("")
  const [tabFilter, setTabFilter] = useState("all") // all, scheduled, published, cancelled
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [actionInProgress, setActionInProgress] = useState(false)

  const fetchSchedules = () => {
    if (!token) return
    setLoading(true)
    setError(null)

    fetch(`${API_BASE_URL}/api/publish-schedules`, {
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
          throw new Error("Failed to load publish schedules from database")
        }
        return res.json()
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          setSchedules(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching publish schedules:", err)
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchSchedules()
  }, [token])

  const handleApproveSingle = async (scheduleId: string) => {
    if (!token || actionInProgress) return
    setActionInProgress(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/publish-schedules/${scheduleId}/approve`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (res.ok) {
        fetchSchedules()
        setSelectedIds((prev) => prev.filter((id) => id !== scheduleId))
      } else {
        const errData = await res.json()
        alert(errData.message || "Failed to approve publication")
      }
    } catch (err) {
      console.error(err)
      alert("Server connection error")
    } finally {
      setActionInProgress(false)
    }
  }

  const handleApproveBulk = async () => {
    if (!token || selectedIds.length === 0 || actionInProgress) return
    setActionInProgress(true)

    const pendingToApprove = schedules
      .filter((s) => selectedIds.includes(s.scheduleId) && s.status.toLowerCase() === "scheduled")

    if (pendingToApprove.length === 0) {
      alert("None of the selected items are in 'Scheduled' status.")
      setActionInProgress(false)
      return
    }

    try {
      const promises = pendingToApprove.map((s) =>
        fetch(`${API_BASE_URL}/api/publish-schedules/${s.scheduleId}/approve`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })
      )

      const results = await Promise.all(promises)
      const failedCount = results.filter((res) => !res.ok).length

      if (failedCount > 0) {
        alert(`Successfully approved most releases. ${failedCount} items failed to approve.`)
      }

      fetchSchedules()
      setSelectedIds([])
    } catch (err) {
      console.error(err)
      alert("Connection error occurred during bulk publishing")
    } finally {
      setActionInProgress(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const eligibleIds = filteredSchedules.map((s) => s.scheduleId)
      setSelectedIds(eligibleIds)
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectIndividual = (scheduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, scheduleId])
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== scheduleId))
    }
  }

  const getFullCoverUrl = (path?: string | null) => {
    if (!path) return ""
    if (path.startsWith("http")) return path
    return `${API_BASE_URL}${path}`
  }

  // Filtered schedules computation
  const filteredSchedules = schedules.filter((s) => {
    const matchesSearch = s.seriesTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.chapterTitle && s.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (s.authorName && s.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTab = tabFilter === "all" || 
                       (tabFilter === "scheduled" && s.status.toLowerCase() === "scheduled") ||
                       (tabFilter === "published" && s.status.toLowerCase() === "published") ||
                       (tabFilter === "cancelled" && s.status.toLowerCase() === "cancelled")

    return matchesSearch && matchesTab
  })

  // Summary counts computed dynamically from the DB response
  const totalCount = schedules.length
  const pendingCount = schedules.filter((s) => s.status.toLowerCase() === "scheduled").length
  const approvedTodayCount = schedules.filter((s) => s.status.toLowerCase() === "published").length

  return (
    <div className="space-y-6 pb-24 relative min-h-[calc(100vh-140px)]">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <CheckCircle className="w-8 h-8 text-[#00dfc0]" />
          Approve Publishing
        </h1>
        <p className="text-muted-foreground mt-1 font-body-lg">
          Final gatekeeping for global syndication release.
        </p>
      </div>

      {/* Stats Bento Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1e2022] border-zinc-800 flex flex-col gap-1 p-6 hover:border-[#00dfc0]/30 transition-colors">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Pending Reviews</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-white">{pendingCount}</span>
            <span className="text-[10px] text-zinc-500">awaiting approval</span>
          </div>
        </Card>
        <Card className="bg-[#1e2022] border-zinc-800 flex flex-col gap-1 p-6 hover:border-[#00dfc0]/30 transition-colors">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Approved Today</span>
            <CheckCircle className="w-4 h-4 text-[#00dfc0]" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-white">{approvedTodayCount}</span>
            <span className="text-[10px] text-[#00dfc0]/70">live on site</span>
          </div>
        </Card>
        <Card className="bg-[#1e2022] border-zinc-800 flex flex-col gap-1 p-6 hover:border-[#00dfc0]/30 transition-colors">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Total Schedules</span>
            <Calendar className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold text-white">{totalCount}</span>
            <span className="text-[10px] text-zinc-500">total in log</span>
          </div>
        </Card>
      </div>

      {/* Filter and Tab Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Switch Tabs */}
        <div className="flex bg-[#0c0e10] p-1 rounded-lg border border-zinc-800 shrink-0">
          <button
            onClick={() => setTabFilter("all")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              tabFilter === "all" ? "bg-[#00dfc0]/15 text-[#00dfc0] border border-[#00dfc0]/20" : "text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTabFilter("scheduled")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              tabFilter === "scheduled" ? "bg-[#00dfc0]/15 text-[#00dfc0] border border-[#00dfc0]/20" : "text-zinc-400 hover:text-white"
            }`}
          >
            Ready to Ship
          </button>
          <button
            onClick={() => setTabFilter("published")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              tabFilter === "published" ? "bg-[#00dfc0]/15 text-[#00dfc0] border border-[#00dfc0]/20" : "text-zinc-400 hover:text-white"
            }`}
          >
            Published
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by series, chapter, or author..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#00dfc0]"
          />
        </div>
      </div>

      {/* Grid view list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-lg bg-[#1e2022]">
          <Loader2 className="w-10 h-10 animate-spin text-[#00dfc0] mb-3" />
          <p className="text-zinc-400 text-sm">Loading schedules from database...</p>
        </div>
      ) : error ? (
        <div className="p-6 border border-red-950 bg-red-950/20 text-red-400 rounded-lg text-center">
          <p className="font-semibold mb-1">Error Loading Schedules</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg text-zinc-500 bg-[#1e2022]">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm">No scheduled releases found matching criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSchedules.map((schedule) => {
            const coverUrl = getFullCoverUrl(schedule.coverImageUrl)
            const dateStr = new Date(schedule.scheduledDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
            const isChecked = selectedIds.includes(schedule.scheduleId)
            
            // Algorithmically processed rating parameters
            const ratingValue = schedule.rating !== null ? schedule.rating : 0
            const qualityScore = (ratingValue * 2).toFixed(1) // scale 5.0 -> 10.0
            const positivePct = Math.round(ratingValue * 20) // scale 5.0 -> 100%

            return (
              <Card
                key={schedule.scheduleId}
                className={`group bg-[#1e2022] border-zinc-800 rounded-xl overflow-hidden relative transition-all duration-300 hover:border-[#00dfc0]/40 hover:-translate-y-1 ${
                  isChecked ? "border-[#00dfc0]/50 shadow-[0_10px_20px_-10px_rgba(0,223,192,0.15)]" : ""
                }`}
              >
                {/* Select checkbox on card */}
                <div className="absolute top-3 left-3 z-10">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => handleSelectIndividual(schedule.scheduleId, !!checked)}
                    className="border-zinc-700 bg-[#0c0e10]/80 data-[state=checked]:bg-[#00dfc0] data-[state=checked]:text-black"
                  />
                </div>

                {/* Cover Image & Quick Action Overlay */}
                <div className="aspect-[3/4] w-full overflow-hidden relative bg-zinc-900 border-b border-zinc-800/40">
                  {schedule.coverImageUrl ? (
                    <img
                      src={coverUrl}
                      alt={schedule.seriesTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-600 bg-zinc-900">
                      <BookOpen className="w-12 h-12 mb-2 text-zinc-800" />
                      <span className="text-xs">No cover image</span>
                    </div>
                  )}

                  {/* Absolute Badge bottom-left */}
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${statusColors[schedule.status.toLowerCase()] || "bg-zinc-700"}`}>
                      {statusLabels[schedule.status.toLowerCase()] || schedule.status}
                    </Badge>
                  </div>

                  {/* Absolute Action Buttons hover overlay */}
                  {schedule.status.toLowerCase() === "scheduled" && (
                    <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleApproveSingle(schedule.scheduleId)}
                        disabled={actionInProgress}
                        className="p-1.5 bg-[#00dfc0] text-black rounded-full hover:scale-105 transition-all shadow-md"
                        title="Quick Publish Approve"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Title Details */}
                <div className="p-4 flex flex-col gap-1">
                  <h3 className="font-bold text-white text-sm leading-snug truncate" title={schedule.seriesTitle}>
                    {schedule.seriesTitle}
                  </h3>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#00dfc0]">
                    Ch. {schedule.chapterNumber} {schedule.chapterTitle ? `: ${schedule.chapterTitle}` : ""}
                  </p>
                </div>

                {/* Card Metrics (Quality & Positivity) */}
                <div className="px-4 pb-4 pt-3 border-t border-zinc-800/40 mt-auto flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center font-bold text-xs text-[#00dfc0]">
                        {schedule.rating !== null ? qualityScore : "N/A"}
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Quality</span>
                    </div>
                    {schedule.rating !== null && (
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-0.5 text-xs font-bold text-zinc-300">
                          {positivePct >= 80 ? (
                            <TrendingUp className="w-3.5 h-3.5 text-[#00dfc0] mr-0.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-red-400 mr-0.5" />
                          )}
                          {positivePct}%
                        </div>
                        <span className="text-[10px] text-zinc-500">Positive</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Meta (Author & Release Date) */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/10">
                    <span className="truncate max-w-[100px]">{schedule.authorName || "Yuki Tanaka"}</span>
                    <span className="text-zinc-400 font-semibold">{dateStr}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sticky Bottom bulk action footer */}
      <footer className="fixed bottom-0 left-0 lg:left-64 right-0 bg-[#121416]/90 backdrop-blur-md border-t border-zinc-800 p-4 px-6 flex justify-between items-center z-40 transition-all duration-300">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-footer"
              checked={filteredSchedules.length > 0 && selectedIds.length === filteredSchedules.length}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
              className="border-zinc-700 bg-zinc-900 data-[state=checked]:bg-[#00dfc0] data-[state=checked]:text-black"
            />
            <label htmlFor="select-all-footer" className="text-xs font-semibold text-zinc-400 uppercase cursor-pointer hover:text-white transition-colors">
              Select All ({filteredSchedules.length})
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {selectedIds.length > 0 && (
            <span className="text-xs text-zinc-400 hidden sm:inline">
              <strong className="text-white">{selectedIds.length}</strong> items selected for deployment
            </span>
          )}
          <Button
            onClick={handleApproveBulk}
            disabled={selectedIds.length === 0 || actionInProgress}
            className="bg-[#00dfc0] text-black font-bold hover:bg-[#00dfc0]/90 px-6 py-2 transition-all"
          >
            {actionInProgress ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                PUBLISH ALL APPROVED ({selectedIds.length})
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
