"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  BookOpen,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { toast } from "sonner"
import { localTodayInputValue, parseApiDateTime, toUtcIsoFromLocal } from "@/lib/date-time"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublishSchedule {
  scheduleId: string
  chapterId: string
  chapterNumber: number
  chapterTitle?: string
  seriesTitle: string
  scheduledDate: string   // ISO datetime string
  status: string          // "scheduled" | "published" | "approved" | "cancelled"
  approvedById?: string
  approvedByName?: string
  publishedAt?: string
  createdAt: string
  coverImageUrl?: string
  authorName?: string
  chapterStatus?: string
}

interface Series {
  seriesId: string
  title: string
  status: string
}

interface Chapter {
  chapterId: string
  chapterNumber: number
  title?: string
  status: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/20 text-primary border-primary/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  published: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
}

const statusLabel: Record<string, string> = {
  scheduled: "Scheduled",
  approved: "Approved",
  published: "Published",
  cancelled: "Cancelled",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const { token, role } = useAuth()
  const authHeader = { Authorization: `Bearer ${token}` }

  const [now, setNow] = useState(() => new Date())
  const today = now
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth())
  )

  // Data
  const [schedules, setSchedules] = useState<PublishSchedule[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])

  // Loading / submitting
  const [loading, setLoading] = useState(true)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSeriesId, setSelectedSeriesId] = useState("none")
  const [selectedChapterId, setSelectedChapterId] = useState("none")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("10:00")

  const isEditorial = role === "editorial"
  const canViewSchedule = role === "editorial" || role === "tantou"

  // Click on a calendar day → pre-fill date & open dialog
  const handleDayClick = (day: number) => {
    if (!isEditorial) return
    const y = currentMonth.getFullYear()
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    setScheduledDate(`${y}-${m}-${d}`)
    setIsDialogOpen(true)
  }

  // ── Load Schedules ──────────────────────────────────────────────────────────
  const loadSchedules = useCallback(async () => {
    if (!token || !canViewSchedule) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/publish-schedules`, {
        headers: authHeader,
      })
      if (!res.ok) throw new Error("Failed to load schedules")
      const data: PublishSchedule[] = await res.json()
      setSchedules(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Failed to load publish schedules.")
    } finally {
      setLoading(false)
    }
  }, [token, canViewSchedule])

  // ── Load Series ─────────────────────────────────────────────────────────────
  const loadSeries = useCallback(async () => {
    if (!token || !isEditorial) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/data/series`, {
        headers: authHeader,
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSeries(Array.isArray(data) ? data.map((s: any) => ({
        seriesId: s.seriesId || s.id,
        title: s.title,
        status: s.status
      })) : [])
    } catch {
      // Non-critical
    }
  }, [token, isEditorial])

  // ── Load Chapters for selected series ──────────────────────────────────────
  const loadChapters = useCallback(async (seriesId: string) => {
    if (!token || !seriesId || seriesId === "none") {
      setChapters([])
      return
    }
    try {
      setLoadingChapters(true)
      const res = await fetch(`${API_BASE_URL}/api/series/${seriesId}/chapters`, {
        headers: authHeader,
      })
      if (!res.ok) throw new Error()
      const data: Chapter[] = await res.json()
      setChapters(Array.isArray(data) ? data.filter((chapter: Chapter) =>
        chapter.status?.toLowerCase() === "editorial_ready"
      ) : [])
    } catch {
      toast.error("Failed to load chapters.")
    } finally {
      setLoadingChapters(false)
    }
  }, [token])

  useEffect(() => {
    loadSchedules()
    loadSeries()
  }, [loadSchedules, loadSeries])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (selectedSeriesId && selectedSeriesId !== "none") {
      loadChapters(selectedSeriesId)
      setSelectedChapterId("none")
    } else {
      setChapters([])
    }
  }, [selectedSeriesId, loadChapters])

  // ── Create Schedule ─────────────────────────────────────────────────────────
  const handleCreateSchedule = async () => {
    if (!selectedChapterId || selectedChapterId === "none") {
      toast.error("Please select a chapter.")
      return
    }
    if (!scheduledDate) {
      toast.error("Please select a date.")
      return
    }
    try {
      setSubmitting(true)
      // Combine date + time into ISO datetime
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`)
      if (scheduledAt.getTime() <= Date.now()) {
        toast.error("Publication time must be in the future.")
        return
      }
      const body = { scheduledDate: toUtcIsoFromLocal(scheduledDate, scheduledTime) }
      const res = await fetch(
        `${API_BASE_URL}/api/chapters/${selectedChapterId}/schedule`,
        {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).message || "Failed to create schedule")
      }
      toast.success("Chapter scheduled successfully!")
      setIsDialogOpen(false)
      resetForm()
      loadSchedules()
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule chapter.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Approve Schedule (tantou only) ──────────────────────────────────────────
  const handleApprove = async (scheduleId: string) => {
    try {
      setApprovingId(scheduleId)
      const res = await fetch(
        `${API_BASE_URL}/api/publish-schedules/${scheduleId}/approve`,
        {
          method: "PUT",
          headers: authHeader,
        }
      )
      if (!res.ok) throw new Error("Failed to approve")
      toast.success("Schedule approved!")
      loadSchedules()
    } catch {
      toast.error("Failed to approve schedule.")
    } finally {
      setApprovingId(null)
    }
  }

  const resetForm = () => {
    setSelectedSeriesId("none")
    setSelectedChapterId("none")
    setScheduledDate("")
    setScheduledTime("10:00")
    setChapters([])
  }

  // Format scheduledDate ("YYYY-MM-DD") → readable label for dialog
  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return null
    const d = new Date(`${dateStr}T00:00:00`)
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  // ── Calendar helpers ────────────────────────────────────────────────────────
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)

  // Build a map of day → schedules for the displayed month
  const schedulesByDay: Record<number, PublishSchedule[]> = {}
  schedules.forEach((s) => {
    const d = parseApiDateTime(s.scheduledDate)!
    if (
      d.getFullYear() === currentMonth.getFullYear() &&
      d.getMonth() === currentMonth.getMonth()
    ) {
      const day = d.getDate()
      if (!schedulesByDay[day]) schedulesByDay[day] = []
      schedulesByDay[day].push(s)
    }
  })

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth.getMonth() === today.getMonth() &&
    currentMonth.getFullYear() === today.getFullYear()

  const formatTime = (iso: string) =>
    parseApiDateTime(iso)!.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

  const formatDate = (iso: string) =>
    parseApiDateTime(iso)!.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const formatMonth = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  // Upcoming = scheduled/approved, sorted by scheduledDate asc, next 8
  const upcoming = schedules
    .filter((s) =>
      (s.status === "scheduled" || s.status === "approved") &&
      parseApiDateTime(s.scheduledDate)!.getTime() >= now.getTime()
    )
    .sort(
      (a, b) =>
        parseApiDateTime(a.scheduledDate)!.getTime() -
        parseApiDateTime(b.scheduledDate)!.getTime()
    )
    .slice(0, 8)

  if (!canViewSchedule) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-destructive">Access Denied</h1>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            Publish Schedule is available to Editorial and Tantou Editor roles only.
          </p>
        </div>
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white"
            id="schedule-heading"
          >
            <Calendar className="w-8 h-8 text-primary" />
            Publish Schedule
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isEditorial
              ? "Schedule chapters that have passed Tantou content review"
              : "View approved and published release dates"}
          </p>
        </div>

        {/* Only mangaka can schedule chapters */}
        {isEditorial && (
          <>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              id="schedule-chapter-btn"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Chapter
            </Button>

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
              }}
            >
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Chapter Publication</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  {scheduledDate
                    ? <>Publishing on <span className="text-white font-semibold">{formatSelectedDate(scheduledDate)}</span> at <span className="text-white font-semibold">{scheduledTime}</span></>
                    : "Only chapters marked editorial ready can be scheduled"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Series */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-zinc-300">
                    Series <span className="text-red-400">*</span>
                  </Label>
                  {series.length === 0 ? (
                    <p className="text-zinc-500 text-xs py-2">
                      No series found.
                    </p>
                  ) : (
                    <Select
                      value={selectedSeriesId}
                      onValueChange={setSelectedSeriesId}
                    >
                      <SelectTrigger
                        className="bg-zinc-900 border-zinc-700 text-white"
                        id="schedule-series-select"
                      >
                        <SelectValue placeholder="Select series" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {series.map((s) => (
                          <SelectItem
                            key={s.seriesId}
                            value={s.seriesId}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                          >
                            {s.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Chapter */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-zinc-300">
                    Chapter <span className="text-red-400">*</span>
                  </Label>
                  {loadingChapters ? (
                    <div className="flex items-center gap-2 text-zinc-400 text-xs h-10">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Loading chapters...
                    </div>
                  ) : (
                    <Select
                      value={selectedChapterId}
                      onValueChange={setSelectedChapterId}
                      disabled={selectedSeriesId === "none" || chapters.length === 0}
                    >
                      <SelectTrigger
                        className="bg-zinc-900 border-zinc-700 text-white"
                        id="schedule-chapter-select"
                      >
                        <SelectValue
                          placeholder={
                            selectedSeriesId === "none"
                              ? "Select series first"
                              : chapters.length === 0
                              ? "No editorial-ready chapters available"
                              : "Select editorial-ready chapter"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white max-h-60">
                        {chapters.map((c) => (
                          <SelectItem
                            key={c.chapterId}
                            value={c.chapterId}
                            className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                          >
                            Ch. {c.chapterNumber}
                            {c.title ? ` — ${c.title}` : ""}
                            <span className="ml-2 text-zinc-500 text-xs">
                              ({c.status})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedSeriesId !== "none" && !loadingChapters && chapters.length === 0 && (
                    <p className="text-[11px] text-amber-300">
                      Submit a chapter from My Series, then Tantou must approve it before Editorial can schedule it.
                    </p>
                  )}
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-zinc-300">
                      Date <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                      id="schedule-date-input"
                      min={localTodayInputValue(now)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-zinc-300">Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                      id="schedule-time-input"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-900"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  onClick={handleCreateSchedule}
                  disabled={
                    submitting ||
                    selectedChapterId === "none" ||
                    !scheduledDate
                  }
                  id="confirm-schedule-btn"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Schedule
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {/* Calendar */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-white">
              {formatMonth(currentMonth)}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1
                    )
                  )
                }
                className="border-zinc-700 hover:bg-zinc-800"
                id="prev-month-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1
                    )
                  )
                }
                className="border-zinc-700 hover:bg-zinc-800"
                id="next-month-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-zinc-500 py-2 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-28 bg-zinc-950/40 rounded-lg"
              />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const items = schedulesByDay[day] || []
              const todayCell = isToday(day)

              // Is this the day currently selected in the dialog?
              const isSelected =
                scheduledDate ===
                `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

              // Is this day in the past (before today)?
              const cellDate = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              )
              const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())

              return (
                <div
                  key={day}
                  onClick={() => !isPast && handleDayClick(day)}
                  className={[
                    "h-28 p-1.5 rounded-lg border transition-all group relative",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : todayCell
                      ? "border-primary bg-primary/5"
                      : isPast
                      ? "border-zinc-900/40 bg-zinc-950/20 opacity-50"
                    : isEditorial
                      ? "border-zinc-800/50 bg-zinc-950/40 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                      : "border-zinc-800/50 bg-zinc-950/40",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "text-primary"
                          : todayCell
                          ? "text-primary"
                          : isPast
                          ? "text-zinc-600"
                          : "text-zinc-400"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <Badge className="bg-primary text-primary-foreground text-[9px] px-1 py-0">
                          Selected
                        </Badge>
                      )}
                      {todayCell && !isSelected && (
                        <Badge className="bg-primary/20 text-primary text-[9px] px-1 py-0">
                          Today
                        </Badge>
                      )}
                      {/* Plus icon on hover — only for mangaka on future days */}
                      {isEditorial && !isPast && !isSelected && (
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3 h-3 text-primary/60" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5 overflow-y-auto max-h-[60px]">
                    {loading ? (
                      i === 0 ? (
                        <Loader2 className="w-3 h-3 animate-spin text-zinc-500 mx-auto mt-2" />
                      ) : null
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.scheduleId}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-[10px] px-1.5 py-1 rounded border truncate cursor-default ${
                            statusColors[item.status] ?? "bg-zinc-800 text-zinc-300"
                          }`}
                          title={`${item.seriesTitle} Ch.${item.chapterNumber} — ${formatTime(item.scheduledDate)}`}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span className="shrink-0">{formatTime(item.scheduledDate)}</span>
                          </div>
                          <div className="truncate font-semibold">
                            {item.seriesTitle} Ch.{item.chapterNumber}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {/* Hover overlay hint (mangaka, future, empty) */}
                  {isEditorial && !isPast && items.length === 0 && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg">
                      <span className="text-[10px] text-primary/50 font-medium">
                        + Schedule
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
            {Object.entries(statusLabel).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    key === "scheduled"
                      ? "bg-primary"
                      : key === "approved"
                      ? "bg-emerald-400"
                      : key === "published"
                      ? "bg-cyan-400"
                      : "bg-destructive"
                  }`}
                />
                <span className="text-[11px] text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Releases */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="h-1 bg-primary w-full" />
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-5 h-5 text-primary" />
            Upcoming Releases
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadSchedules}
            disabled={loading}
            className="text-zinc-400 hover:text-white w-7 h-7"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-zinc-400 py-10">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading schedule...</span>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary/50" />
              </div>
              <p className="text-zinc-400 text-sm font-medium">
                No upcoming releases scheduled.
              </p>
            {isEditorial && (
                <p className="text-zinc-600 text-xs">
                  Click "Schedule Chapter" to add one.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((item) => (
                <div
                  key={item.scheduleId}
                  className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-900/60 hover:border-zinc-700/40 transition-colors group"
                >
                  {/* Left: cover + info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.coverImageUrl ? (
                        <img
                          src={item.coverImageUrl}
                          alt={item.seriesTitle}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="w-5 h-5 text-primary/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white truncate group-hover:text-primary transition-colors">
                        {item.seriesTitle}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Chapter {item.chapterNumber}
                        {item.chapterTitle ? ` — ${item.chapterTitle}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Right: date + status + actions */}
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-white">
                        {formatDate(item.scheduledDate)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatTime(item.scheduledDate)}
                      </p>
                    </div>
                    <Badge
                      className={`text-[10px] uppercase font-bold border ${
                        statusColors[item.status] ?? "bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {statusLabel[item.status] ?? item.status}
                    </Badge>

                    {/* Approve button for tantou */}
                    {isEditorial && item.status === "scheduled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-emerald-700/40 text-emerald-400 hover:bg-emerald-900/20 hover:border-emerald-600 text-xs h-7 px-2"
                        onClick={() => handleApprove(item.scheduleId)}
                        disabled={approvingId === item.scheduleId}
                        id={`approve-schedule-btn-${item.scheduleId}`}
                      >
                        {approvingId === item.scheduleId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        Approve
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-zinc-500 hover:text-white w-7 h-7"
                          id={`schedule-menu-${item.scheduleId}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-zinc-950 border-zinc-800 text-white"
                      >
                        <DropdownMenuItem className="text-xs cursor-default text-zinc-400">
                          <AlertCircle className="w-3.5 h-3.5 mr-2" />
                          ID: {item.scheduleId.slice(0, 8)}...
                        </DropdownMenuItem>
                        {isEditorial && item.status === "scheduled" && (
                          <DropdownMenuItem
                            className="text-emerald-400 focus:text-emerald-300 focus:bg-emerald-900/20 cursor-pointer"
                            onClick={() => handleApprove(item.scheduleId)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                            Approve
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Schedules list (full history) */}
      {!loading && schedules.length > upcoming.length && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              All Schedules
              <Badge className="bg-zinc-800 text-zinc-300 text-xs ml-1">
                {schedules.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedules
                .sort(
                  (a, b) =>
                    new Date(b.scheduledDate).getTime() -
                    new Date(a.scheduledDate).getTime()
                )
                .map((item) => (
                  <div
                    key={item.scheduleId}
                    className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-lg border border-zinc-900/40 hover:border-zinc-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-white truncate">
                          {item.seriesTitle} — Ch. {item.chapterNumber}
                          {item.chapterTitle ? ` (${item.chapterTitle})` : ""}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(item.scheduledDate)} at{" "}
                          {formatTime(item.scheduledDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Badge
                        className={`text-[10px] uppercase font-bold border ${
                          statusColors[item.status] ?? "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {statusLabel[item.status] ?? item.status}
                      </Badge>
                      {item.status === "published" && item.publishedAt && (
                        <span className="text-[10px] text-zinc-500">
                          Published {formatDate(item.publishedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
