"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Rocket,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { localTodayInputValue, parseApiDateTime, toUtcIsoFromLocal } from "@/lib/date-time"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type PublishSchedule = {
  scheduleId: string
  chapterId: string
  chapterNumber: number
  chapterTitle?: string | null
  seriesTitle: string
  scheduledDate: string
  status: string
  approvedByName?: string | null
  publishedAt?: string | null
  coverImageUrl?: string | null
  authorName?: string | null
  chapterStatus?: string | null
}

type Series = {
  seriesId: string
  title: string
  status: string
}

type Chapter = {
  chapterId: string
  chapterNumber: number
  title?: string | null
  status: string
  seriesId: string
  seriesTitle: string
}

type PublishingItem =
  | {
      kind: "ready"
      id: string
      chapterId: string
      chapterNumber: number
      chapterTitle?: string | null
      seriesTitle: string
      approvalStatus: string
      publishStatus: "not_scheduled"
      scheduledDate?: null
      authorName?: null
    }
  | {
      kind: "schedule"
      id: string
      scheduleId: string
      chapterId: string
      chapterNumber: number
      chapterTitle?: string | null
      seriesTitle: string
      approvalStatus: string
      publishStatus: string
      scheduledDate: string
      authorName?: string | null
    }

const statusStyles: Record<string, string> = {
  editorial_ready: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  not_scheduled: "border-zinc-700 bg-zinc-900 text-zinc-300",
  scheduled: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  published: "border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
}

function normalizeStatus(value?: string | null) {
  return (value || "").toLowerCase()
}

function formatDateTime(value?: string | null) {
  const date = parseApiDateTime(value)
  if (!date) return "-"
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function EditorialPublishing() {
  const { token, role } = useAuth()
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])
  const [schedules, setSchedules] = useState<PublishSchedule[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null)
  const [scheduledDate, setScheduledDate] = useState(localTodayInputValue())
  const [scheduledTime, setScheduledTime] = useState("10:00")
  const [submitting, setSubmitting] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  const loadSchedules = useCallback(async () => {
    if (!token) return
    const res = await fetch(`${API_BASE_URL}/api/publish-schedules`, { headers: authHeader })
    if (!res.ok) throw new Error("Failed to load publish schedules.")
    const data = await res.json()
    setSchedules(Array.isArray(data) ? data : [])
  }, [authHeader, token])

  const loadReadyChapters = useCallback(async () => {
    if (!token) return
    setLoadingChapters(true)
    try {
      const seriesRes = await fetch(`${API_BASE_URL}/api/data/series`, { headers: authHeader })
      if (!seriesRes.ok) throw new Error("Failed to load series.")
      const seriesData = await seriesRes.json()
      const list: Series[] = Array.isArray(seriesData)
        ? seriesData.map((item: any) => ({
            seriesId: item.seriesId || item.id,
            title: item.title,
            status: item.status,
          }))
        : []
      setSeries(list)

      const chapterResults = await Promise.all(
        list.map(async (item) => {
          const res = await fetch(`${API_BASE_URL}/api/series/${item.seriesId}/chapters`, { headers: authHeader })
          if (!res.ok) return []
          const data = await res.json()
          return Array.isArray(data)
            ? data.map((chapter: any) => ({
                chapterId: chapter.chapterId,
                chapterNumber: chapter.chapterNumber,
                title: chapter.title,
                status: chapter.status,
                seriesId: item.seriesId,
                seriesTitle: item.title,
              }))
            : []
        })
      )
      setChapters(chapterResults.flat())
    } finally {
      setLoadingChapters(false)
    }
  }, [authHeader, token])

  const loadAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      await Promise.all([loadSchedules(), loadReadyChapters()])
    } catch (err: any) {
      toast.error(err.message || "Failed to load publishing data.")
    } finally {
      setLoading(false)
    }
  }, [loadReadyChapters, loadSchedules, token])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const scheduledChapterIds = useMemo(
    () => new Set(schedules.filter((s) => normalizeStatus(s.status) !== "cancelled").map((s) => s.chapterId)),
    [schedules]
  )

  const readyChapters = useMemo(
    () =>
      chapters.filter(
        (chapter) =>
          normalizeStatus(chapter.status) === "editorial_ready" &&
          !scheduledChapterIds.has(chapter.chapterId)
      ),
    [chapters, scheduledChapterIds]
  )

  const visibleSchedules = useMemo(
    () =>
      schedules.filter((schedule) => {
        const scheduleStatus = normalizeStatus(schedule.status)
        const chapterStatus = normalizeStatus(schedule.chapterStatus)
        return scheduleStatus === "published" || !chapterStatus || chapterStatus === "editorial_ready"
      }),
    [schedules]
  )

  const items: PublishingItem[] = useMemo(() => {
    const readyItems: PublishingItem[] = readyChapters.map((chapter) => ({
      kind: "ready",
      id: `ready-${chapter.chapterId}`,
      chapterId: chapter.chapterId,
      chapterNumber: chapter.chapterNumber,
      chapterTitle: chapter.title,
      seriesTitle: chapter.seriesTitle,
      approvalStatus: "editorial_ready",
      publishStatus: "not_scheduled",
      scheduledDate: null,
      authorName: null,
    }))

    const scheduleItems: PublishingItem[] = visibleSchedules.map((schedule) => {
      const chapterStatus = normalizeStatus(schedule.chapterStatus)
      const scheduleStatus = normalizeStatus(schedule.status)
      return {
        kind: "schedule",
        id: `schedule-${schedule.scheduleId}`,
        scheduleId: schedule.scheduleId,
        chapterId: schedule.chapterId,
        chapterNumber: schedule.chapterNumber,
        chapterTitle: schedule.chapterTitle,
        seriesTitle: schedule.seriesTitle,
        approvalStatus: chapterStatus || "editorial_ready",
        publishStatus: scheduleStatus,
        scheduledDate: schedule.scheduledDate,
        authorName: schedule.authorName,
      }
    })

    return [...readyItems, ...scheduleItems].sort((a, b) => {
      if (a.publishStatus === "not_scheduled" && b.publishStatus !== "not_scheduled") return -1
      if (a.publishStatus !== "not_scheduled" && b.publishStatus === "not_scheduled") return 1
      return (a.scheduledDate || "").localeCompare(b.scheduledDate || "")
    })
  }, [readyChapters, visibleSchedules])

  const filteredItems = items.filter((item) => {
    const searchText = `${item.seriesTitle} ${item.chapterTitle || ""} ${item.authorName || ""}`.toLowerCase()
    const matchesSearch = searchText.includes(query.toLowerCase())
    const matchesFilter = filter === "all" || item.publishStatus === filter || item.approvalStatus === filter
    return matchesSearch && matchesFilter
  })

  const stats = {
    reviewApproved: chapters.filter((chapter) => normalizeStatus(chapter.status) === "editorial_ready").length,
    ready: readyChapters.length,
    scheduled: visibleSchedules.filter((schedule) => normalizeStatus(schedule.status) === "scheduled").length,
    published: visibleSchedules.filter((schedule) => normalizeStatus(schedule.status) === "published").length,
  }

  const openScheduleDialog = (chapter: Chapter) => {
    setSelectedChapter(chapter)
    setScheduledDate(localTodayInputValue())
    setScheduledTime("10:00")
    setDialogOpen(true)
  }

  const createSchedule = async () => {
    if (!token || !selectedChapter) return
    if (!scheduledDate) {
      toast.error("Please choose a publish date.")
      return
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`)
    if (scheduledAt.getTime() <= Date.now()) {
      toast.error("Publish date must be in the future.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/chapters/${selectedChapter.chapterId}/schedule`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: toUtcIsoFromLocal(scheduledDate, scheduledTime) }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message || "Failed to schedule chapter.")
      }
      toast.success("Chapter scheduled.")
      setDialogOpen(false)
      await loadAll()
      window.dispatchEvent(new Event("mangaflow:badges-refresh"))
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule chapter.")
    } finally {
      setSubmitting(false)
    }
  }

  const publishNow = async (scheduleId: string) => {
    if (!token) return
    setPublishingId(scheduleId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/publish-schedules/${scheduleId}/approve`, {
        method: "PUT",
        headers: authHeader,
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message || "Failed to publish chapter.")
      }
      toast.success("Chapter published.")
      await loadAll()
      window.dispatchEvent(new Event("mangaflow:badges-refresh"))
    } catch (err: any) {
      toast.error(err.message || "Failed to publish chapter.")
    } finally {
      setPublishingId(null)
    }
  }

  if (role !== "editorial") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        Publishing Management is available to Editorial roles only.
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#050807] p-6 text-white">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#00dfc0]">Publishing Management</p>
          <h1 className="text-4xl font-bold">Schedule approved chapters for release</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Editorial schedules chapters that passed Tantou approval. Scheduled releases publish automatically on their publish date.
          </p>
        </div>
        <Button onClick={loadAll} variant="outline" className="border-zinc-800 bg-zinc-950 text-zinc-200">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-950">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Ready To Schedule</p>
            <p className="mt-2 text-2xl font-bold text-white">{stats.reviewApproved}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Need Schedule</p>
            <p className="mt-2 text-2xl font-bold text-amber-300">{stats.ready}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Scheduled</p>
            <p className="mt-2 text-2xl font-bold text-[#00dfc0]">{stats.scheduled}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-950">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500">Published</p>
            <p className="mt-2 text-2xl font-bold text-cyan-300">{stats.published}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 border-b border-zinc-900 pb-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search series, chapter, author..."
            className="border-zinc-800 bg-zinc-950 pl-9 text-white"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full border-zinc-800 bg-zinc-950 text-white lg:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-950 text-white">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="editorial_ready">Approved</SelectItem>
            <SelectItem value="not_scheduled">Need Schedule</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading || loadingChapters ? (
        <div className="flex min-h-[360px] items-center justify-center text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#00dfc0]" />
          Loading publishing workflow...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded border border-dashed border-zinc-800 text-zinc-500">
          <BookOpen className="mb-3 h-10 w-10" />
          No chapters match this view.
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-zinc-800">
          <div className="grid grid-cols-[minmax(280px,1.4fr)_160px_170px_180px_160px] border-b border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
            <span>Chapter</span>
            <span>Approval</span>
            <span>Publish Status</span>
            <span>Publish Date</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-zinc-900">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(280px,1.4fr)_160px_170px_180px_160px] items-center gap-3 px-4 py-4 text-sm hover:bg-zinc-950/70"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{item.seriesTitle}</p>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    Chapter {item.chapterNumber}
                    {item.chapterTitle ? ` - ${item.chapterTitle}` : ""}
                  </p>
                </div>
                <Badge className={`${statusStyles[item.approvalStatus] || statusStyles.not_scheduled} w-fit border`}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {statusLabel(item.approvalStatus)}
                </Badge>
                <Badge className={`${statusStyles[item.publishStatus] || statusStyles.not_scheduled} w-fit border`}>
                  {item.publishStatus === "published" ? <Rocket className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                  {statusLabel(item.publishStatus)}
                </Badge>
                <span className="text-zinc-400">{item.scheduledDate ? formatDateTime(item.scheduledDate) : "-"}</span>
                <div className="flex justify-end">
                  {item.kind === "ready" ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        openScheduleDialog({
                          chapterId: item.chapterId,
                          chapterNumber: item.chapterNumber,
                          title: item.chapterTitle,
                          status: item.approvalStatus,
                          seriesId: "",
                          seriesTitle: item.seriesTitle,
                        })
                      }
                      className="bg-[#00dfc0] text-black hover:bg-[#00c8ad]"
                    >
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                  ) : item.publishStatus === "scheduled" ? (
                    <Button
                      size="sm"
                      onClick={() => publishNow(item.scheduleId)}
                      disabled={publishingId === item.scheduleId}
                      className="bg-fuchsia-500 text-white hover:bg-fuchsia-400"
                    >
                      {publishingId === item.scheduleId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                      Publish Now
                    </Button>
                  ) : (
                    <span className="text-xs text-zinc-600">Done</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-zinc-800 bg-[#101214] text-white">
          <DialogHeader>
            <DialogTitle>Schedule Chapter Publication</DialogTitle>
            <DialogDescription className="text-zinc-500">
              {selectedChapter
                ? `${selectedChapter.seriesTitle} - Chapter ${selectedChapter.chapterNumber}`
                : "Choose a release date for this approved chapter."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="publish-date">Publish Date</Label>
              <Input
                id="publish-date"
                type="date"
                min={localTodayInputValue()}
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="border-zinc-800 bg-zinc-950 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publish-time">Publish Time</Label>
              <Input
                id="publish-time"
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
                className="border-zinc-800 bg-zinc-950 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-zinc-800 bg-zinc-950 text-zinc-300">
              Cancel
            </Button>
            <Button onClick={createSchedule} disabled={submitting} className="bg-[#00dfc0] text-black hover:bg-[#00c8ad]">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarClock className="mr-2 h-4 w-4" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PublishingPage() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#00dfc0]" />
        Loading publishing workspace...
      </div>
    )
  }

  return <EditorialPublishing />
}
