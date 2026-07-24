"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  ListChecks,
  Loader2,
  RefreshCw,
  Rocket,
  Search,
  XCircle,
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
  coverImageUrl?: string | null
}

type Chapter = {
  chapterId: string
  chapterNumber: number
  title?: string | null
  status: string
  seriesId: string
  seriesTitle: string
  coverImageUrl?: string | null
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
      coverImageUrl?: string | null
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
      coverImageUrl?: string | null
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

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildMonthDays(anchorDate: Date) {
  const monthFirstDay = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const firstDay = new Date(monthFirstDay)
  firstDay.setHours(0, 0, 0, 0)
  firstDay.setDate(firstDay.getDate() - firstDay.getDay())

  const days: Date[] = []
  for (let index = 0; index < 28; index++) {
    const day = new Date(firstDay)
    day.setDate(firstDay.getDate() + index)
    days.push(day)
  }
  const lastDay = days[days.length - 1]

  return { days, firstDay, lastDay, monthFirstDay }
}

function formatCalendarRange(start: Date, end: Date) {
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
  }

  if (sameYear) {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  }

  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
}

function canCancelScheduleItem(item: PublishingItem) {
  if (item.kind !== "schedule") return false
  const status = normalizeStatus(item.publishStatus)
  if (status === "cancelled") return false
  const scheduledDate = parseApiDateTime(item.scheduledDate)
  return Boolean(scheduledDate && scheduledDate.getTime() > Date.now())
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
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [view, setView] = useState<"calendar" | "queue">("calendar")
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [dayDialogOpen, setDayDialogOpen] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(localTodayInputValue())

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
            coverImageUrl: item.coverImageUrl || item.coverUrl || item.coverImage || null,
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
                coverImageUrl: item.coverImageUrl || null,
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
        return scheduleStatus !== "cancelled" && (
          scheduleStatus === "scheduled" ||
          scheduleStatus === "published" ||
          !chapterStatus ||
          chapterStatus === "editorial_ready" ||
          chapterStatus === "scheduled"
        )
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
      coverImageUrl: chapter.coverImageUrl,
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
        coverImageUrl: schedule.coverImageUrl,
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

  const openDayDialog = (date: Date) => {
    const key = localDateKey(date)
    setSelectedCalendarDate(key)
    setScheduledDate(key)
    setScheduledTime("10:00")
    setDayDialogOpen(true)
  }

  const scheduleChapter = async (chapter: Chapter, date: string, time: string, closeAfterSave: () => void) => {
    if (!token) return
    if (!date) {
      toast.error("Please choose a publish date.")
      return
    }

    const scheduledAt = new Date(`${date}T${time}:00`)
    if (scheduledAt.getTime() <= Date.now()) {
      toast.error("Publish date must be in the future.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/chapters/${chapter.chapterId}/schedule`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate: toUtcIsoFromLocal(date, time) }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message || "Failed to schedule chapter.")
      }
      toast.success("Chapter scheduled.")
      closeAfterSave()
      await loadAll()
      window.dispatchEvent(new Event("mangaflow:badges-refresh"))
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule chapter.")
    } finally {
      setSubmitting(false)
    }
  }

  const createSchedule = async () => {
    if (!selectedChapter) return
    await scheduleChapter(selectedChapter, scheduledDate, scheduledTime, () => setDialogOpen(false))
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

  const cancelSchedule = async (scheduleId: string) => {
    if (!token) return
    setCancellingId(scheduleId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/publish-schedules/${scheduleId}/cancel`, {
        method: "PUT",
        headers: authHeader,
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message || "Failed to cancel publish schedule.")
      }
      toast.success("Publish schedule cancelled.")
      await loadAll()
      window.dispatchEvent(new Event("mangaflow:badges-refresh"))
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel publish schedule.")
    } finally {
      setCancellingId(null)
    }
  }

  const calendar = useMemo(() => buildMonthDays(calendarMonth), [calendarMonth])
  const schedulesByDay = useMemo(() => {
    const groups: Record<string, PublishingItem[]> = {}
    items
      .filter((item) => item.kind === "schedule" && item.scheduledDate)
      .forEach((item) => {
        const date = parseApiDateTime(item.scheduledDate)
        if (!date) return
        const key = localDateKey(date)
        groups[key] = [...(groups[key] || []), item]
      })
    return groups
  }, [items])

  const selectedDaySchedules = schedulesByDay[selectedCalendarDate] || []

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

      <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950/80 p-1">
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${
            view === "calendar"
              ? "bg-[#64f2dc] text-black"
              : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Release Calendar
        </button>
        <button
          type="button"
          onClick={() => setView("queue")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-colors ${
            view === "queue"
              ? "bg-[#64f2dc] text-black"
              : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
          }`}
        >
          <ListChecks className="h-4 w-4" />
          Publishing Queue
        </button>
      </div>

      {view === "calendar" ? (
        <>
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

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
              <div className="flex flex-col gap-3 border-b border-zinc-800/80 bg-zinc-900/25 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-extrabold text-white">
                    <CalendarDays className="h-5 w-5 text-[#00dfc0]" />
                    {calendar.monthFirstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h2>
                  <p className="text-xs text-zinc-500">First four weeks of the month. Click a day to schedule an approved chapter.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
                    }}
                    className="border-zinc-800 bg-zinc-950 text-zinc-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCalendarMonth(new Date())}
                    className="border-zinc-800 bg-zinc-950 text-zinc-200"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))
                    }}
                    className="border-zinc-800 bg-zinc-950 text-zinc-200"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {loading || loadingChapters ? (
                <div className="flex min-h-[520px] items-center justify-center text-zinc-400">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#00dfc0]" />
                  Loading release calendar...
                </div>
              ) : (
                <div className="p-3">
                  <div className="grid grid-cols-7 gap-2 pb-2 text-center text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="px-2 py-3">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {calendar.days.map((day) => {
                      const key = localDateKey(day)
                      const dayItems = schedulesByDay[key] || []
                      const inMonth = day.getMonth() === calendarMonth.getMonth()
                      const isToday = key === localTodayInputValue()
                      const isSelected = key === selectedCalendarDate
                      const hasRelease = dayItems.length > 0

                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => openDayDialog(day)}
                          className={`min-h-[132px] rounded-xl border p-2 text-left transition-all hover:-translate-y-0.5 hover:border-[#00dfc0]/45 hover:bg-zinc-900/75 hover:shadow-[0_10px_28px_rgba(0,223,192,0.08)] ${
                            isSelected
                              ? "border-[#00dfc0]/60 bg-[#00dfc0]/10"
                              : hasRelease
                                ? "border-zinc-700/80 bg-zinc-900/45"
                                : inMonth
                                  ? "border-zinc-900/80 bg-zinc-950/45"
                                  : "border-zinc-950 bg-zinc-950/20 text-zinc-700"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                              isToday
                                ? "bg-[#64f2dc] text-black shadow-[0_0_18px_rgba(100,242,220,0.35)]"
                                : isSelected
                                  ? "bg-[#00dfc0]/20 text-[#78ffe8]"
                                  : inMonth
                                    ? "text-zinc-300"
                                    : "text-zinc-700"
                            }`}>
                              {day.getDate()}
                            </span>
                            {dayItems.length > 2 && (
                              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300">+{dayItems.length - 2} more</span>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            {dayItems.slice(0, 2).map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                              >
                                <div className="h-10 w-8 shrink-0 overflow-hidden rounded-md bg-zinc-800 ring-1 ring-zinc-700/70">
                                  {item.coverImageUrl ? (
                                    <img
                                      src={item.coverImageUrl.startsWith("http") ? item.coverImageUrl : `${API_BASE_URL}${item.coverImageUrl}`}
                                      alt={item.seriesTitle}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <BookOpen className="m-1.5 h-4 w-4 text-zinc-600" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-[11px] font-bold text-white">{item.seriesTitle}</p>
                                  <p className="text-[10px] font-semibold text-[#00dfc0]">Ch. {item.chapterNumber}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card className="border-zinc-800 bg-zinc-950">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white">Ready To Publish</h3>
                      <p className="text-xs text-zinc-500">Approved chapters waiting for a release date.</p>
                    </div>
                    <Badge className="border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                      {readyChapters.length}
                    </Badge>
                  </div>
                  <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {readyChapters.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                        No chapters are ready for scheduling.
                      </div>
                    ) : (
                      readyChapters.map((chapter) => (
                        <div key={chapter.chapterId} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                          <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-zinc-900">
                            {chapter.coverImageUrl ? (
                              <img
                                src={chapter.coverImageUrl.startsWith("http") ? chapter.coverImageUrl : `${API_BASE_URL}${chapter.coverImageUrl}`}
                                alt={chapter.seriesTitle}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <BookOpen className="m-2 h-5 w-5 text-zinc-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white">{chapter.seriesTitle}</p>
                            <p className="text-xs text-zinc-500">Chapter {chapter.chapterNumber}{chapter.title ? ` - ${chapter.title}` : ""}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openScheduleDialog(chapter)}
                            className="bg-[#00dfc0] text-black hover:bg-[#00c8ad]"
                          >
                            Schedule
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-950">
                <CardContent className="p-4">
                  <h3 className="mb-3 font-bold text-white">Scheduled Releases</h3>
                  <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                    {visibleSchedules.filter((schedule) => normalizeStatus(schedule.status) === "scheduled").length === 0 ? (
                      <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                        No upcoming releases.
                      </div>
                    ) : (
                      visibleSchedules
                        .filter((schedule) => normalizeStatus(schedule.status) === "scheduled")
                        .map((schedule) => (
                          <div key={schedule.scheduleId} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
                            <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-zinc-900">
                              {schedule.coverImageUrl ? (
                                <img
                                  src={schedule.coverImageUrl.startsWith("http") ? schedule.coverImageUrl : `${API_BASE_URL}${schedule.coverImageUrl}`}
                                  alt={schedule.seriesTitle}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <BookOpen className="m-2 h-5 w-5 text-zinc-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-white">{schedule.seriesTitle}</p>
                              <p className="text-xs text-zinc-500">Ch. {schedule.chapterNumber} · {formatDateTime(schedule.scheduledDate)}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelSchedule(schedule.scheduleId)}
                              disabled={cancellingId === schedule.scheduleId}
                              className="border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-950/40"
                            >
                              {cancellingId === schedule.scheduleId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <>

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
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelSchedule(item.scheduleId)}
                        disabled={cancellingId === item.scheduleId}
                        className="border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-950/40"
                      >
                        {cancellingId === item.scheduleId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => publishNow(item.scheduleId)}
                        disabled={publishingId === item.scheduleId}
                        className="bg-fuchsia-500 text-white hover:bg-fuchsia-400"
                      >
                        {publishingId === item.scheduleId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                        Publish Now
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600">Done</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="max-w-2xl border-zinc-800 bg-[#101214] text-white">
          <DialogHeader>
            <DialogTitle>
              Release Date: {parseApiDateTime(`${selectedCalendarDate}T00:00:00`)?.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Select an approved chapter to publish on this date.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {selectedDaySchedules.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Already Scheduled</p>
                  <Badge className="border border-[#00dfc0]/25 bg-[#00dfc0]/10 text-[#73ffe8]">
                    {selectedDaySchedules.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {selectedDaySchedules.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:flex-row sm:items-center">
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-zinc-800">
                        {item.coverImageUrl ? (
                          <img
                            src={item.coverImageUrl.startsWith("http") ? item.coverImageUrl : `${API_BASE_URL}${item.coverImageUrl}`}
                            alt={item.seriesTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen className="m-2 h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{item.seriesTitle}</p>
                        <p className="text-xs text-[#00dfc0]">Chapter {item.chapterNumber}{item.chapterTitle ? ` - ${item.chapterTitle}` : ""}</p>
                        <p className="mt-1 text-xs text-zinc-500">{formatDateTime(item.scheduledDate)}</p>
                      </div>
                      {canCancelScheduleItem(item) && (
                        <Button
                          size="sm"
                          variant="outline"
                          title="Cancel schedule"
                          aria-label={`Cancel schedule for ${item.seriesTitle} chapter ${item.chapterNumber}`}
                          onClick={() => cancelSchedule(item.scheduleId)}
                          disabled={cancellingId === item.scheduleId}
                          className="h-9 w-9 shrink-0 rounded-full border-red-900/60 bg-red-950/20 p-0 text-red-300 hover:bg-red-950/40 hover:text-red-200"
                        >
                          {cancellingId === item.scheduleId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <div className="space-y-2">
                <Label htmlFor="calendar-publish-date">Publish Date</Label>
                <Input
                  id="calendar-publish-date"
                  type="date"
                  value={selectedCalendarDate}
                  readOnly
                  disabled
                  aria-readonly="true"
                  className="cursor-not-allowed border-zinc-800 bg-zinc-950 text-white opacity-100 disabled:opacity-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-publish-time">Publish Time</Label>
                <Input
                  id="calendar-publish-time"
                  type="time"
                  value={scheduledTime}
                  readOnly
                  disabled
                  aria-readonly="true"
                  className="cursor-not-allowed border-zinc-800 bg-zinc-950 text-white opacity-100 disabled:opacity-100"
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Ready Chapters</p>
              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {readyChapters.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                    No approved chapters are waiting for a release date.
                  </div>
                ) : (
                  readyChapters.map((chapter) => (
                    <div key={chapter.chapterId} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-2">
                      <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-zinc-900">
                        {chapter.coverImageUrl ? (
                          <img
                            src={chapter.coverImageUrl.startsWith("http") ? chapter.coverImageUrl : `${API_BASE_URL}${chapter.coverImageUrl}`}
                            alt={chapter.seriesTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <BookOpen className="m-2 h-5 w-5 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{chapter.seriesTitle}</p>
                        <p className="text-xs text-zinc-500">Chapter {chapter.chapterNumber}{chapter.title ? ` - ${chapter.title}` : ""}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => scheduleChapter(chapter, selectedCalendarDate, scheduledTime, () => setDayDialogOpen(false))}
                        disabled={submitting}
                        className="bg-[#00dfc0] text-black hover:bg-[#00c8ad]"
                      >
                        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarClock className="mr-2 h-4 w-4" />}
                        Schedule
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDayDialogOpen(false)} className="border-zinc-800 bg-zinc-950 text-zinc-300">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
