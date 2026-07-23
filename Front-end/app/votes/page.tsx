"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BarChart3,
  Download,
  Eye,
  FileDown,
  History,
  PauseCircle,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Upload,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SeriesDetailModal } from "@/components/manga/series-detail-modal"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

interface VoteEntry {
  id?: string
  seriesId: string
  series: string
  authorName: string
  coverImageUrl: string | null
  seriesStatus: string
  votes: number
  previousVotes: number
  change: number
  rank: number
  previousRank: number
  warningThreshold?: number
  isBelowThreshold: boolean
}

interface VoteHistoryWeek {
  year: number
  week: number
  periodLabel?: string
  importedAt?: string | null
  sourceFileName?: string
  rowCount?: number
  totalVotes: number
  topSeries: string
  belowThresholdCount: number
  threshold: number
  entries: VoteEntry[]
}

interface VoteHistoryResponse {
  year: number
  threshold: number
  weeks: VoteHistoryWeek[]
}

const csvEscape = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const downloadTextFile = (filename: string, content: string, mimeType = "text/csv;charset=utf-8") => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const currentYear = new Date().getFullYear()
const currentWeek = (() => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const dayOffset = Math.floor((now.getTime() - start.getTime()) / 86400000)
  return Math.min(53, Math.max(1, Math.ceil((dayOffset + start.getDay() + 1) / 7)))
})()

const formatNumber = (num?: number | null) => new Intl.NumberFormat().format(num ?? 0)

const formatDateTime = (value?: string | null) => {
  if (!value) return "Imported survey"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Imported survey"
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getFullCoverUrl = (coverPath?: string | null) => {
  if (!coverPath) return ""
  if (coverPath.startsWith("http")) return coverPath
  return `${API_BASE_URL}${coverPath}`
}

export default function VotesPage() {
  const router = useRouter()
  const { token, role, logout } = useAuth()
  const [selectedWeek, setSelectedWeek] = useState(String(currentWeek))
  const [voteEntries, setVoteEntries] = useState<VoteEntry[]>([])
  const [historyData, setHistoryData] = useState<VoteHistoryResponse | null>(null)
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [importingVotes, setImportingVotes] = useState(false)
  const [decidingSeriesId, setDecidingSeriesId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Editorial decision dialog states
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false)
  const [targetSeries, setTargetSeries] = useState<VoteEntry | null>(null)
  const [decisionType, setDecisionType] = useState<"cancelled" | "hiatus" | "active" | null>(null)
  const [decisionReason, setDecisionReason] = useState("")

  // Series detail modal states
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const threshold = historyData?.threshold ?? voteEntries[0]?.warningThreshold ?? 22000
  const selectedHistoryWeek = historyData?.weeks.find((week) => String(week.week) === selectedWeek)
  const periodLabel = selectedHistoryWeek?.periodLabel ?? `Week ${selectedWeek}, ${currentYear}`

  useEffect(() => {
    if (!token) return

    fetch(`${API_BASE_URL}/api/data/reader-votes/history?year=${currentYear}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          logout()
          return null
        }
        return res.ok ? res.json() : null
      })
      .then((data: VoteHistoryResponse | null) => {
        if (!data) return
        setHistoryData(data)

        const weeks = data.weeks.map((week) => String(week.week))
        setAvailableWeeks(weeks.length > 0 ? weeks : [String(currentWeek)])
        if (weeks.length > 0 && !weeks.includes(selectedWeek)) {
          setSelectedWeek(weeks[0])
        }
      })
      .catch((err) => console.error("Error fetching reader vote history:", err))
  }, [token, refreshKey])

  useEffect(() => {
    if (!token) return

    setLoading(true)
    fetch(`${API_BASE_URL}/api/data/reader-votes?week=${selectedWeek}&year=${currentYear}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          logout()
          return null
        }
        return res.ok ? res.json() : []
      })
      .then((data) => {
        setVoteEntries(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching reader votes:", err)
        setLoading(false)
      })
  }, [selectedWeek, token, refreshKey])

  const totalVotes = voteEntries.reduce((sum, entry) => sum + entry.votes, 0)
  const topSeries = voteEntries[0] ?? null
  const belowThresholdCount = voteEntries.filter((entry) => entry.votes < threshold).length
  const totalVoteChange = voteEntries.reduce((sum, entry) => sum + entry.change, 0)
  const sortedHistory = useMemo(() => historyData?.weeks ?? [], [historyData])

  const riskRows = useMemo(() => {
    const bySeries = new Map<string, { seriesId: string; series: string; latestVotes: number; previousVotes: number; changes: number[]; lowWeeks: number; isBelowThreshold: boolean }>()

    for (const week of [...sortedHistory].reverse()) {
      for (const entry of week.entries) {
        const existing = bySeries.get(entry.seriesId)
        if (!existing) {
          bySeries.set(entry.seriesId, {
            seriesId: entry.seriesId,
            series: entry.series,
            latestVotes: entry.votes,
            previousVotes: entry.previousVotes,
            changes: [entry.change],
            lowWeeks: entry.votes < threshold ? 1 : 0,
            isBelowThreshold: entry.votes < threshold,
          })
        } else {
          existing.latestVotes = entry.votes
          existing.previousVotes = entry.previousVotes
          existing.changes.push(entry.change)
          existing.lowWeeks += entry.votes < threshold ? 1 : 0
          existing.isBelowThreshold = entry.votes < threshold
        }
      }
    }

    return Array.from(bySeries.values())
      .map((row) => ({
        ...row,
        averageChange: Math.round(row.changes.reduce((sum, value) => sum + value, 0) / Math.max(1, row.changes.length)),
      }))
      .sort((a, b) => Number(b.isBelowThreshold) - Number(a.isBelowThreshold) || a.latestVotes - b.latestVotes)
  }, [sortedHistory, threshold])

  const handleImportVotes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file || !token) return

    const formData = new FormData()
    formData.append("file", file)

    setImportingVotes(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/data/reader-votes/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to import votes")
      }

      const data = await response.json()
      alert(`Imported ${data.rows} vote row(s) as ${data.weeks} independent survey period(s).`)

      const importedWeeks = Array.isArray(data.importedWeeks)
        ? data.importedWeeks
            .filter((item: any) => Number(item.year) === currentYear)
            .map((item: any) => String(item.week))
        : []

      if (importedWeeks.length > 0) {
        setSelectedWeek(importedWeeks[0])
      }

      setRefreshKey((value) => value + 1)
    } catch (err) {
      console.error("Error importing votes:", err)
      alert(err instanceof Error ? err.message : "Failed to import votes.")
    } finally {
      setImportingVotes(false)
    }
  }

  const handleExportVotes = () => {
    if (voteEntries.length === 0) {
      alert("No reader votes available to export for this survey.")
      return
    }

    const headers = [
      "period",
      "year",
      "week",
      "rank",
      "series",
      "readerVotes",
      "previousSurveyVotes",
      "voteChange",
      "previousRank",
      "rankChange",
      "threshold",
      "status",
    ]

    const rows = voteEntries.map((entry) => {
      const rankChange = entry.previousRank - entry.rank
      return [
        periodLabel,
        currentYear,
        selectedWeek,
        entry.rank,
        entry.series,
        entry.votes,
        entry.previousVotes,
        entry.change,
        entry.previousRank,
        rankChange,
        threshold,
        entry.votes < threshold ? "Below Threshold" : "Safe",
      ]
    })

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n")
    downloadTextFile(`reader-votes-${periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`, csv)
  }

  const handleExportReport = () => {
    if (!historyData || sortedHistory.length === 0) {
      alert("No reader vote history available to export.")
      return
    }

    const summaryRows = [
      ["Report", "Reader Vote Survey Report"],
      ["Year", historyData.year],
      ["Warning Threshold", historyData.threshold],
      ["Survey Periods", sortedHistory.length],
      [],
      ["period", "importedAt", "sourceFile", "rows", "topSeries", "totalVotes", "belowThresholdCount", "threshold"],
      ...sortedHistory.map((week) => [
        week.periodLabel ?? `Week ${week.week}, ${week.year}`,
        formatDateTime(week.importedAt),
        week.sourceFileName ?? "CSV import",
        week.rowCount ?? week.entries.length,
        week.topSeries,
        week.totalVotes,
        week.belowThresholdCount,
        week.threshold,
      ]),
      [],
      ["period", "rank", "series", "readerVotes", "previousSurveyVotes", "voteChange", "status"],
    ]

    const detailRows = sortedHistory.flatMap((week) =>
      week.entries.map((entry) => [
        week.periodLabel ?? `Week ${week.week}, ${week.year}`,
        entry.rank,
        entry.series,
        entry.votes,
        entry.previousVotes,
        entry.change,
        entry.votes < historyData.threshold ? "Below Threshold" : "Safe",
      ])
    )

    const csv = [...summaryRows, ...detailRows].map((row) => row.map(csvEscape).join(",")).join("\n")
    downloadTextFile(`reader-vote-survey-report-${historyData.year}.csv`, csv)
  }

  const handleEditorialDecision = (
    entry: VoteEntry,
    decision: "cancelled" | "hiatus" | "active"
  ) => {
    setTargetSeries(entry)
    setDecisionType(decision)
    const defaultReason =
      entry.votes < threshold
        ? `${periodLabel} reader vote count ${entry.votes} is below threshold ${threshold}.`
        : "Editorial review from Reader Votes survey."
    setDecisionReason(decision === "active" ? "" : defaultReason)
    setIsDecisionModalOpen(true)
  }

  const submitEditorialDecision = async () => {
    if (!token || !targetSeries || !decisionType) return

    const reason = decisionReason.trim()
    if (decisionType !== "active" && !reason) {
      toast.error("Please enter a reason for this decision.")
      return
    }

    setDecidingSeriesId(targetSeries.seriesId)
    setIsDecisionModalOpen(false)

    try {
      const res = await fetch(`${API_BASE_URL}/api/series/${targetSeries.seriesId}/editorial-decision`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision: decisionType, reason }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Failed to apply editorial decision")
      }

      toast.success(
        decisionType === "cancelled"
          ? "Series cancelled successfully."
          : decisionType === "hiatus"
          ? "Series moved to hiatus."
          : "Series reactivated successfully."
      )
      setRefreshKey((value) => value + 1)
    } catch (err: any) {
      toast.error(err.message || "Server connection error")
    } finally {
      setDecidingSeriesId(null)
      setTargetSeries(null)
      setDecisionType(null)
      setDecisionReason("")
    }
  }

  const handleViewDetails = (seriesId: string) => {
    setSelectedSeriesId(seriesId)
    setIsDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Reader Votes
          </h1>
          <p className="text-muted-foreground mt-1">
            Import independent reader surveys after each publication period and compare them with the previous survey.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(availableWeeks.length > 0 ? availableWeeks : [String(currentWeek)]).map((week) => (
                <SelectItem key={week} value={week}>Week {week}, {currentYear}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleImportVotes}
          />
          <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importingVotes}>
            <Upload className="w-4 h-4 mr-2" />
            {importingVotes ? "Importing..." : "Import CSV"}
          </Button>
          <Button variant="outline" onClick={handleExportReport} disabled={!historyData || sortedHistory.length === 0}>
            <FileDown className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Current Survey</p>
            <p className="text-2xl font-bold mt-1">{periodLabel}</p>
            <p className="text-sm text-muted-foreground mt-1">{formatDateTime(selectedHistoryWeek?.importedAt)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Survey Votes</p>
            <p className="text-3xl font-bold mt-1">{formatNumber(totalVotes)}</p>
            <p className={totalVoteChange >= 0 ? "text-sm text-success" : "text-sm text-destructive"}>
              {totalVoteChange >= 0 ? "+" : ""}{formatNumber(totalVoteChange)} vs previous survey
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Top Series</p>
            <p className="text-xl font-bold mt-1 truncate">{topSeries ? topSeries.series : "N/A"}</p>
            <p className="text-sm text-success">{topSeries ? `${formatNumber(topSeries.votes)} reader votes` : ""}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Vote Alerts</p>
            <p className="text-xl font-bold mt-1">{belowThresholdCount} Series</p>
            <p className="text-sm text-destructive">Below {formatNumber(threshold)} reader votes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{periodLabel} Survey Ranking</CardTitle>
            <CardDescription>Ranking is generated from this import only. It is not cumulative.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportVotes} disabled={voteEntries.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Series</TableHead>
                <TableHead className="text-right">Reader Votes</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Rank Change</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-zinc-400">Loading reader votes...</TableCell>
                </TableRow>
              ) : voteEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-zinc-400">No reader vote survey found.</TableCell>
                </TableRow>
              ) : (
                voteEntries.map((entry) => {
                  const rankChange = entry.previousRank - entry.rank
                  const isBelowThreshold = entry.votes < threshold
                  const isCancelled = entry.seriesStatus?.toLowerCase() === "cancelled"

                  return (
                    <TableRow key={entry.id ?? `${entry.seriesId}-${entry.rank}`} className={isBelowThreshold ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <span className={`font-bold text-lg ${entry.rank === 1 ? "text-primary" : ""}`}>
                          #{entry.rank}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {entry.coverImageUrl ? (
                            <img
                              src={getFullCoverUrl(entry.coverImageUrl)}
                              alt={entry.series}
                              className="w-10 h-14 rounded object-cover border border-border"
                            />
                          ) : (
                            <div className="w-10 h-14 rounded bg-secondary border border-border" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{entry.series}</span>
                              {isBelowThreshold && <AlertTriangle className="w-4 h-4 text-amber-300" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{entry.authorName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatNumber(entry.votes)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {entry.change > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-success" />
                              <span className="text-success">+{formatNumber(entry.change)}</span>
                            </>
                          ) : entry.change < 0 ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-destructive" />
                              <span className="text-destructive">{formatNumber(entry.change)}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {rankChange > 0 ? (
                          <Badge className="bg-success/20 text-success">+{rankChange}</Badge>
                        ) : rankChange < 0 ? (
                          <Badge className="bg-destructive/20 text-destructive">{rankChange}</Badge>
                        ) : (
                          <Badge variant="secondary">-</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isBelowThreshold ? (
                          <Badge className="bg-destructive/20 text-destructive">Below Threshold</Badge>
                        ) : (
                          <Badge className="bg-success/20 text-success">Safe</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-zinc-400 hover:text-[#00dfc0] hover:bg-zinc-800/40 cursor-pointer"
                            title="View Details"
                            onClick={() => handleViewDetails(entry.seriesId)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {role === "editorial" && (
                            <>
                              {/* Show Reactivate (active) button if series is cancelled or hiatus */}
                              {(entry.seriesStatus?.toLowerCase() === "cancelled" || entry.seriesStatus?.toLowerCase() === "hiatus") && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-zinc-400 hover:text-[#00dfc0] hover:bg-zinc-800/40 cursor-pointer"
                                  title="Reactivate series"
                                  disabled={decidingSeriesId === entry.seriesId}
                                  onClick={() => handleEditorialDecision(entry, "active")}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}

                              {/* Show Pause (hiatus) button only if series is active */}
                              {entry.seriesStatus?.toLowerCase() === "active" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/40 cursor-pointer"
                                  title="Move to publication review / hiatus"
                                  disabled={decidingSeriesId === entry.seriesId}
                                  onClick={() => handleEditorialDecision(entry, "hiatus")}
                                >
                                  <PauseCircle className="w-4 h-4" />
                                </Button>
                              )}

                              {/* Show Cancel (cancelled) button if series is NOT already cancelled */}
                              {entry.seriesStatus?.toLowerCase() !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 text-zinc-400 hover:text-red-300 hover:bg-zinc-800/40 cursor-pointer"
                                  title="Cancel series"
                                  disabled={decidingSeriesId === entry.seriesId}
                                  onClick={() => handleEditorialDecision(entry, "cancelled")}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.15fr] gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Import History
            </CardTitle>
            <CardDescription>Each row is one independent post-publication reader survey.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Survey Period</TableHead>
                  <TableHead>Top Series</TableHead>
                  <TableHead className="text-right">Votes</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-zinc-400">No imported surveys found.</TableCell>
                  </TableRow>
                ) : (
                  sortedHistory.map((week) => {
                    const isSelected = String(week.week) === selectedWeek
                    return (
                      <TableRow key={`${week.year}-${week.week}`} className={isSelected ? "bg-primary/5" : ""}>
                        <TableCell>
                          <div className="font-medium">{week.periodLabel ?? `Week ${week.week}, ${week.year}`}</div>
                          <div className="text-xs text-muted-foreground">{formatDateTime(week.importedAt)}</div>
                        </TableCell>
                        <TableCell>{week.topSeries}</TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(week.totalVotes)}</TableCell>
                        <TableCell className="text-right">{week.rowCount ?? week.entries.length}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setSelectedWeek(String(week.week))}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
              Vote Trend & Risk
            </CardTitle>
            <CardDescription>Warnings use reader votes per survey, not ranking position.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Series</TableHead>
                  <TableHead className="text-right">Latest</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">Avg Change</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-zinc-400">No trend data found.</TableCell>
                  </TableRow>
                ) : (
                  riskRows.map((row) => (
                    <TableRow key={row.seriesId} className={row.isBelowThreshold ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium">{row.series}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.latestVotes)}</TableCell>
                      <TableCell className="text-right">{formatNumber(row.previousVotes)}</TableCell>
                      <TableCell className={row.averageChange >= 0 ? "text-right text-success" : "text-right text-destructive"}>
                        {row.averageChange >= 0 ? "+" : ""}{formatNumber(row.averageChange)}
                      </TableCell>
                      <TableCell>
                        {row.isBelowThreshold ? (
                          <Badge className="bg-destructive/20 text-destructive">Needs Action</Badge>
                        ) : row.lowWeeks > 0 ? (
                          <Badge className="bg-amber-500/20 text-amber-300">Watch</Badge>
                        ) : (
                          <Badge className="bg-success/20 text-success">Safe</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Editorial Decision Modal */}
      <Dialog open={isDecisionModalOpen} onOpenChange={setIsDecisionModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <AlertTriangle className={`w-5 h-5 ${decisionType === "cancelled" ? "text-red-400" : decisionType === "hiatus" ? "text-amber-400" : "text-[#00dfc0]"}`} />
              {decisionType === "cancelled" ? "Cancel Series" : decisionType === "hiatus" ? "Move Series to Hiatus" : "Reactivate Series"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
              {decisionType === "cancelled" 
                ? `Are you sure you want to cancel the publication of "${targetSeries?.series}"? This will lock all write operations for the author and assistants.` 
                : decisionType === "hiatus" 
                ? `Move "${targetSeries?.series}" to hiatus / publication review?` 
                : `Reactivate "${targetSeries?.series}" and resume normal publication?`}
            </DialogDescription>
          </DialogHeader>

          {decisionType !== "active" && (
            <div className="space-y-2 py-2">
              <Label htmlFor="decision-reason" className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                Reason for Decision
              </Label>
              <Textarea
                id="decision-reason"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder="Enter editorial reason..."
                className="bg-zinc-900 border-zinc-700 text-white placeholder-zinc-650 resize-none h-24 text-xs focus-visible:ring-primary"
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDecisionModalOpen(false)
                setTargetSeries(null)
                setDecisionType(null)
                setDecisionReason("")
              }} 
              className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-xs px-4"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitEditorialDecision}
              className={`font-semibold text-xs px-4 ${
                decisionType === "cancelled" 
                  ? "bg-red-600 hover:bg-red-500 text-white" 
                  : decisionType === "hiatus" 
                  ? "bg-amber-500 hover:bg-amber-400 text-black" 
                  : "bg-[#00dfc0] hover:bg-[#00dfc0]/90 text-black"
              }`}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Series Detail Modal */}
      {selectedSeriesId && (
        <SeriesDetailModal
          seriesId={selectedSeriesId}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false)
            setSelectedSeriesId(null)
          }}
          onUpdate={() => setRefreshKey((value) => value + 1)}
        />
      )}

    </div>
  )
}
