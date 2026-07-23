"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Eye, 
  Search, 
  Download, 
  BarChart3, 
  Activity, 
  Users,
  AlertTriangle,
  RotateCcw,
  PauseCircle,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { SeriesDetailModal } from "@/components/manga/series-detail-modal"

interface SeriesRankingDto {
  seriesId: string
  title: string
  coverImageUrl: string | null
  authorName: string
  rank: number
  previousRank: number | null
  score: number
  readerVotes: number
  views: number
  growthRate: number
  status: string
  seriesStatus: string
  riskLevel: string
  riskReason: string | null
  cancellationReason: string | null
  genres: string[]
}

interface SeriesRankingContainerDto {
  totalSeriesRanked: number
  topTrendingTitle: string
  totalReaderVotes: number
  totalViews: number
  rankings: SeriesRankingDto[]
}


export default function SeriesRankingPage() {
  const { token, role, logout } = useAuth()
  const [rankingData, setRankingData] = useState<SeriesRankingContainerDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("All Genres")
  const [selectedSort, setSelectedSort] = useState("rank")
  const [selectedTimeframe, setSelectedTimeframe] = useState("weekly")
  const [decidingSeriesId, setDecidingSeriesId] = useState<string | null>(null)

  // Modal states for Editorial Board decisions
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false)
  const [decisionType, setDecisionType] = useState<"cancelled" | "hiatus" | "active" | null>(null)
  const [decisionReason, setDecisionReason] = useState("")
  const [targetSeries, setTargetSeries] = useState<SeriesRankingDto | null>(null)

  // Details modal states
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const fetchRanking = () => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE_URL}/api/series/ranking?genre=${selectedGenre}&sortBy=${selectedSort}&timeframe=${selectedTimeframe}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => {
        if (res.status === 401) {
          logout()
          return null
        }
        if (!res.ok) throw new Error("Failed to fetch ranking data")
        return res.json()
      })
      .then((data) => {
        if (data) {
          setRankingData(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching ranking data:", err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchRanking()
  }, [token, selectedGenre, selectedSort, selectedTimeframe])

  const handleEditorialDecision = (
    item: SeriesRankingDto,
    decision: "cancelled" | "hiatus" | "active"
  ) => {
    setTargetSeries(item)
    setDecisionType(decision)
    setDecisionReason(
      decision === "active"
        ? ""
        : item.riskReason || "Based on low ranking / weak reader votes."
    )
    setIsDecisionModalOpen(true)
  }

  const submitEditorialDecision = async () => {
    if (!token || !targetSeries || !decisionType) return

    if (decisionType !== "active" && !decisionReason.trim()) {
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
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ decision: decisionType, reason: decisionReason })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || "Failed to apply editorial decision")
      }

      toast.success(
        decisionType === "cancelled"
          ? `Series "${targetSeries.title}" cancelled successfully.`
          : decisionType === "hiatus"
          ? `Series "${targetSeries.title}" moved to hiatus.`
          : `Series "${targetSeries.title}" reactivated successfully.`
      )
      fetchRanking()
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

  const formatNumber = (num?: number | null) => {
    if (num === undefined || num === null) return "0"
    return new Intl.NumberFormat().format(num)
  }

  const getFullCoverUrl = (coverPath?: string | null) => {
    if (!coverPath) return ""
    if (coverPath.startsWith("http")) return coverPath
    return `${API_BASE_URL}${coverPath}`
  }

  const formatVotesMetric = (num?: number | null) => {
    if (num === undefined || num === null) return "0"
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  // Filter rankings based on search query in the client side as well
  const filteredRankings = rankingData?.rankings.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  }) || []

  // Collect all unique genres from ranking data for the filter dropdown
  const uniqueGenres = ["All Genres"]
  if (rankingData?.rankings) {
    const genresSet = new Set<string>()
    rankingData.rankings.forEach((item) => {
      item.genres.forEach((g) => genresSet.add(g))
    })
    genresSet.forEach((g) => uniqueGenres.push(g))
  }

  return (
    <div className="min-h-screen bg-[#0B0C0D] text-[#e2e2e5] font-sans antialiased">
      <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
        
        {/* Page Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1A1D1F] pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline text-white">Series Ranking</h1>
            <p className="text-zinc-400 mt-2 max-w-2xl text-sm">
              Performance tracking and global syndication rankings for all editorial series.
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-[#121416] p-1 rounded-lg border border-[#1A1D1F]">
            <Button 
              variant={selectedTimeframe === "weekly" ? "default" : "ghost"}
              className={selectedTimeframe === "weekly" ? "bg-[#00dfc0] text-black font-semibold text-xs py-1.5 h-8 hover:bg-[#00dfc0]/90" : "text-zinc-400 hover:text-white text-xs py-1.5 h-8"}
              onClick={() => setSelectedTimeframe("weekly")}
            >
              Weekly
            </Button>
            <Button 
              variant={selectedTimeframe === "monthly" ? "default" : "ghost"}
              className={selectedTimeframe === "monthly" ? "bg-[#00dfc0] text-black font-semibold text-xs py-1.5 h-8 hover:bg-[#00dfc0]/90" : "text-zinc-400 hover:text-white text-xs py-1.5 h-8"}
              onClick={() => setSelectedTimeframe("monthly")}
            >
              Monthly
            </Button>
            <Button 
              variant={selectedTimeframe === "yearly" ? "default" : "ghost"}
              className={selectedTimeframe === "yearly" ? "bg-[#00dfc0] text-black font-semibold text-xs py-1.5 h-8 hover:bg-[#00dfc0]/90" : "text-zinc-400 hover:text-white text-xs py-1.5 h-8"}
              onClick={() => setSelectedTimeframe("yearly")}
            >
              Yearly
            </Button>
          </div>
        </section>

        {/* Bento Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Total Ranked */}
          <div className="bg-[#121416] p-6 rounded-xl border border-[#1A1D1F] flex items-center gap-6">
            <div className="bg-[#00dfc0]/10 p-4 rounded-lg">
              <BarChart3 className="text-[#00dfc0] w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold font-headline">Total Series Ranked</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? "..." : rankingData?.totalSeriesRanked ?? 0}
              </p>
            </div>
          </div>

          {/* Card 2: Top Trending */}
          <div className="bg-[#121416] p-6 rounded-xl border border-[#1A1D1F] flex items-center gap-6">
            <div className="bg-violet-500/10 p-4 rounded-lg">
              <Activity className="text-violet-400 w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold font-headline">Top Trending</p>
              <p className="text-2xl font-bold text-white mt-1 truncate max-w-[200px]">
                {loading ? "..." : rankingData?.topTrendingTitle ?? "N/A"}
              </p>
            </div>
          </div>

          {/* Card 3: Total Views */}
          <div className="bg-[#121416] p-6 rounded-xl border border-[#1A1D1F] flex items-center gap-6 relative overflow-hidden">
            <div className="bg-[#00dfc0]/10 p-4 rounded-lg">
              <Users className="text-[#00dfc0] w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold font-headline">Total Views</p>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? "..." : rankingData ? formatVotesMetric(rankingData.totalViews) : "0"}
              </p>
            </div>
          </div>
        </section>

        {/* Filters & Search Toolbar */}
        <section className="bg-[#121416]/80 backdrop-blur-md p-4 rounded-xl border border-[#1A1D1F] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search series or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#0B0C0D] border-[#1A1D1F] text-white placeholder-zinc-500 text-sm h-10 focus-visible:ring-[#00dfc0]"
              />
            </div>

            {/* Genre Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase font-headline">Genre:</span>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-40 bg-[#0B0C0D] border-[#1A1D1F] text-white text-sm h-10">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-[#121416] border-[#1A1D1F] text-white">
                  {uniqueGenres.map((genre) => (
                    <SelectItem key={genre} value={genre} className="focus:bg-[#00dfc0] focus:text-black">
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase font-headline">Sort By:</span>
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger className="w-52 bg-[#0B0C0D] border-[#1A1D1F] text-white text-sm h-10">
                  <SelectValue placeholder="Rank (Highest First)" />
                </SelectTrigger>
                <SelectContent className="bg-[#121416] border-[#1A1D1F] text-white">
                  <SelectItem value="rank" className="focus:bg-[#00dfc0] focus:text-black">Rank (by Views)</SelectItem>
                  <SelectItem value="score" className="focus:bg-[#00dfc0] focus:text-black">Performance Score</SelectItem>
                  <SelectItem value="views" className="focus:bg-[#00dfc0] focus:text-black">Views</SelectItem>
                  <SelectItem value="growth" className="focus:bg-[#00dfc0] focus:text-black">Growth Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            className="bg-[#00dfc0] text-black font-semibold text-sm hover:bg-[#00dfc0]/90 h-10 px-4 rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </section>

        {/* Ranking List Table */}
        <section className="bg-[#121416] rounded-xl border border-[#1A1D1F] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1a1c1e]/60 border-b border-[#1A1D1F]">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-headline">Rank</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-headline">Series</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-headline">Score</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-headline">Views</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-headline">Growth</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-headline">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 font-headline text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1D1F]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-zinc-500 text-sm">
                      Loading series rankings...
                    </td>
                  </tr>
                ) : filteredRankings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-zinc-500 text-sm">
                      No series found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRankings.map((item, index) => {
                    const formattedRank = String(item.rank).padStart(2, "0")
                    
                    // Growth direction indicator
                    let DirectionIcon = Minus
                    let directionColor = "text-zinc-500"
                    
                    if (item.previousRank !== null) {
                      if (item.previousRank > item.rank) {
                        DirectionIcon = TrendingUp
                        directionColor = "text-[#00dfc0]"
                      } else if (item.previousRank < item.rank) {
                        DirectionIcon = TrendingDown
                        directionColor = "text-red-400"
                      }
                    }

                    // Status Badge Style
                    let statusBadgeStyle = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    if (item.status === "Trending") {
                      statusBadgeStyle = "bg-[#00dfc0]/15 text-[#00dfc0] border-[#00dfc0]/20"
                    } else if (item.status === "Declining") {
                      statusBadgeStyle = "bg-red-400/15 text-red-400 border-red-400/20"
                    } else if (item.status === "At Risk" || item.status === "Cancelled") {
                      statusBadgeStyle = "bg-red-500/15 text-red-300 border-red-500/25"
                    } else if (item.status === "Watch" || item.status === "Publication Review") {
                      statusBadgeStyle = "bg-amber-500/15 text-amber-300 border-amber-500/25"
                    }

                    return (
                      <tr 
                        key={item.seriesId} 
                        className="hover:bg-[#1a1d1f]/40 transition-colors group"
                      >
                        {/* Rank */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold font-headline ${item.rank === 1 ? "text-[#00dfc0]" : "text-white"}`}>
                              {formattedRank}
                            </span>
                            <DirectionIcon className={`w-4 h-4 ${directionColor}`} />
                          </div>
                        </td>

                        {/* Series Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {item.coverImageUrl ? (
                              <img 
                                src={getFullCoverUrl(item.coverImageUrl)} 
                                alt={item.title} 
                                className="w-12 h-16 rounded object-cover border border-[#1A1D1F]"
                              />
                            ) : (
                              <div className="w-12 h-16 rounded bg-zinc-800 border border-[#1A1D1F] flex items-center justify-center text-xs text-zinc-600">
                                Cover
                              </div>
                            )}
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-white group-hover:text-[#00dfc0] transition-colors text-sm">
                                  {item.title}
                                </p>
                                {item.riskLevel !== "normal" && (
                                  <span title={item.riskReason || item.cancellationReason || "Needs editorial attention"}>
                                    <AlertTriangle className={`w-4 h-4 ${item.riskLevel === "danger" || item.riskLevel === "cancelled" ? "text-red-400" : "text-amber-300"}`} />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {item.authorName}
                              </p>
                              {(item.riskReason || item.cancellationReason) && (
                                <p className="text-[11px] text-amber-200/90 mt-1 max-w-[320px] line-clamp-2">
                                  {item.cancellationReason || item.riskReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-24">
                              <Progress 
                                value={item.score * 10} 
                                className="h-1.5 bg-zinc-800 [&>div]:bg-[#00dfc0]"
                              />
                            </div>
                            <span className="font-bold text-sm text-[#00dfc0]">
                              {item.score.toFixed(1)}
                            </span>
                          </div>
                        </td>

                        {/* Views */}
                        <td className="px-6 py-4 font-semibold text-white text-sm">
                          {formatNumber(item.views)}
                        </td>

                        {/* Growth Rate */}
                        <td className="px-6 py-4">
                          <span className={`font-bold text-sm ${item.growthRate > 0 ? "text-[#00dfc0]" : item.growthRate < 0 ? "text-red-400" : "text-zinc-500"}`}>
                            {item.growthRate > 0 ? "+" : ""}{item.growthRate}%
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${statusBadgeStyle}`}>
                            {item.status}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => handleViewDetails(item.seriesId)}
                               className="w-8 h-8 text-zinc-400 hover:text-[#00dfc0] hover:bg-zinc-800/40 cursor-pointer"
                               title="View Details"
                             >
                               <Eye className="w-4 h-4" />
                             </Button>
                            {role === "editorial" && (
                              <>
                                {/* Show Reactivate (active) button if series is cancelled or hiatus */}
                                {(item.seriesStatus?.toLowerCase() === "cancelled" || item.seriesStatus?.toLowerCase() === "hiatus") && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-zinc-400 hover:text-[#00dfc0] hover:bg-zinc-800/40 cursor-pointer"
                                    title="Reactivate series"
                                    disabled={decidingSeriesId === item.seriesId}
                                    onClick={() => handleEditorialDecision(item, "active")}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                )}

                                {/* Show Pause (hiatus) button only if series is active */}
                                {item.seriesStatus?.toLowerCase() === "active" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800/40 cursor-pointer"
                                    title="Move to publication review / hiatus"
                                    disabled={decidingSeriesId === item.seriesId}
                                    onClick={() => handleEditorialDecision(item, "hiatus")}
                                  >
                                    <PauseCircle className="w-4 h-4" />
                                  </Button>
                                )}

                                {/* Show Cancel (cancelled) button if series is NOT already cancelled */}
                                {item.seriesStatus?.toLowerCase() !== "cancelled" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-zinc-400 hover:text-red-300 hover:bg-zinc-800/40 cursor-pointer"
                                    title="Cancel series"
                                    disabled={decidingSeriesId === item.seriesId}
                                    onClick={() => handleEditorialDecision(item, "cancelled")}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination (Visual Matching) */}
          <div className="p-4 flex items-center justify-between border-t border-[#1A1D1F] bg-[#1a1c1e]/30">
            <p className="text-xs text-zinc-500">
              {loading ? "Showing 0 series" : `Showing 1-${filteredRankings.length} of ${rankingData?.totalSeriesRanked ?? 0} series`}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="w-8 h-8 text-zinc-500 hover:text-white" disabled>
                &lt;
              </Button>
              <Button className="w-8 h-8 rounded bg-[#00dfc0] text-black text-xs font-bold py-0 px-0 hover:bg-[#00dfc0]/90">
                1
              </Button>
              <Button variant="ghost" size="icon" className="w-8 h-8 text-zinc-500 hover:text-white" disabled>
                &gt;
              </Button>
            </div>
          </div>
        </section>

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
                ? `Are you sure you want to cancel the publication of "${targetSeries?.title}"? This will lock all write operations for the author and assistants.` 
                : decisionType === "hiatus" 
                ? `Move "${targetSeries?.title}" to hiatus / publication review?` 
                : `Reactivate "${targetSeries?.title}" and resume normal publication?`}
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
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 resize-none h-24 text-xs focus-visible:ring-primary"
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
          onUpdate={fetchRanking}
        />
      )}

    </div>
  )
}
