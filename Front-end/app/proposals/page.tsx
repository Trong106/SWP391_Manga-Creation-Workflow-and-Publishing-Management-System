"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Star,
  Users,
  Search,
  Check,
  X,
  Loader2,
  BookOpen,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Proposal {
  proposalId: string
  seriesId: string
  seriesTitle: string
  seriesSynopsis: string | null
  seriesGenres: string[]
  submittedById: string
  submittedByName: string
  reviewedById: string | null
  reviewedByName: string | null
  status: string
  feedback: string | null
  submittedAt: string
  reviewedAt: string | null
  coverImageUrl: string | null
  ranking: number | null
  readerCount: number
  rating: number | null
}

interface UserOption {
  userId: string
  fullName: string
  email: string
  role: string
}

const statusColors: Record<string, string> = {
  submitted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-[#00dfc0]/20 text-[#00dfc0] border-[#00dfc0]/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  draft: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
}

const statusLabels: Record<string, string> = {
  submitted: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
}

export default function ProposalsPage() {
  const { token, logout } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter and Sort states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [genreFilter, setGenreFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date_desc")

  // Review Dialog states
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved")
  const [reviewFeedback, setReviewFeedback] = useState("")
  const [tantouUsers, setTantouUsers] = useState<UserOption[]>([])
  const [selectedTantouId, setSelectedTantouId] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchProposals = () => {
    if (!token) return
    setLoading(true)
    setError(null)
    
    fetch(`${API_BASE_URL}/api/proposals`, {
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
          throw new Error("Failed to load proposals list from database")
        }
        return res.json()
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          setProposals(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching proposals:", err)
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchProposals()
  }, [token])

  useEffect(() => {
    if (!token) return

    fetch(`${API_BASE_URL}/api/users/by-role/tantou`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data)) {
          setTantouUsers(data)
          setSelectedTantouId(data[0]?.userId || "")
        }
      })
      .catch(() => setTantouUsers([]))
  }, [token])

  const handleOpenReview = (proposal: Proposal) => {
    setSelectedProposal(proposal)
    setReviewDecision("approved")
    setReviewFeedback("")
    setSelectedTantouId(tantouUsers[0]?.userId || "")
    setIsReviewOpen(true)
  }

  const handleCloseReview = () => {
    setIsReviewOpen(false)
    setSelectedProposal(null)
  }

  const handlePostReview = async () => {
    if (!selectedProposal || !token) return
    if (reviewDecision === "approved" && !selectedTantouId) {
      alert("Please select a Tantou Editor before approving this proposal.")
      return
    }
    setSubmittingReview(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/proposals/${selectedProposal.proposalId}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          decision: reviewDecision,
          feedback: reviewFeedback,
          tantouId: reviewDecision === "approved" ? selectedTantouId : null
        })
      })

      if (res.ok) {
        handleCloseReview()
        fetchProposals()
      } else {
        const errData = await res.json()
        alert(errData.message || "Failed to submit review")
      }
    } catch (err) {
      console.error("Error submitting review:", err)
      alert("Server connection error")
    } finally {
      setSubmittingReview(false)
    }
  }

  const getFullCoverUrl = (path?: string | null) => {
    if (!path) return ""
    if (path.startsWith("http")) return path
    return `${API_BASE_URL}${path}`
  }

  // Get list of unique genres from actual database records
  const uniqueGenres = Array.from(
    new Set(proposals.flatMap((p) => p.seriesGenres))
  ).filter(Boolean)

  // Filter and sort computation
  const filteredProposals = proposals.filter((p) => {
    const matchesSearch = p.seriesTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.submittedByName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesGenre = genreFilter === "all" || p.seriesGenres.includes(genreFilter)

    return matchesSearch && matchesStatus && matchesGenre
  }).sort((a, b) => {
    if (sortBy === "date_desc") {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    }
    if (sortBy === "date_asc") {
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    }
    if (sortBy === "rating_desc") {
      return (b.rating || 0) - (a.rating || 0)
    }
    if (sortBy === "readers_desc") {
      return b.readerCount - a.readerCount
    }
    if (sortBy === "ranking_asc") {
      return (a.ranking || 9999) - (b.ranking || 9999)
    }
    return 0
  })

  // Summary Metrics
  const pendingCount = proposals.filter((p) => p.status.toLowerCase() === "submitted").length
  const approvedCount = proposals.filter((p) => p.status.toLowerCase() === "approved").length
  const rejectedCount = proposals.filter((p) => p.status.toLowerCase() === "rejected").length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-[#00dfc0]" />
            Series Proposals
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage manga series proposals submitted by Mangakas
          </p>
        </div>
      </div>

      {/* Database Metrics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1e2022] border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-800">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{proposals.length}</p>
              <p className="text-xs text-muted-foreground">Total Proposals</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e2022] border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e2022] border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00dfc0]/10">
              <CheckCircle className="w-5 h-5 text-[#00dfc0]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e2022] border-zinc-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Sort controls */}
      <div className="bg-[#1e2022] border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by series title or author name..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#00dfc0]"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          {/* Status Select */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="submitted">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Genre Select */}
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Genre: All" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="all">Genre: All</SelectItem>
              {uniqueGenres.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
              <SelectItem value="date_desc">Newest Submission</SelectItem>
              <SelectItem value="date_asc">Oldest Submission</SelectItem>
              <SelectItem value="rating_desc">Highest Rating</SelectItem>
              <SelectItem value="readers_desc">Reader Count</SelectItem>
              <SelectItem value="ranking_asc">Global Rank</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-zinc-800 rounded-lg bg-[#1e2022]">
          <Loader2 className="w-10 h-10 animate-spin text-[#00dfc0] mb-3" />
          <p className="text-zinc-400 text-sm">Loading proposals from database...</p>
        </div>
      ) : error ? (
        <div className="p-6 border border-red-950 bg-red-950/20 text-red-400 rounded-lg text-center">
          <p className="font-semibold mb-1">Error Loading Proposals</p>
          <p className="text-xs text-red-500">{error}</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg text-zinc-500 bg-[#1e2022]">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm">No proposals found matching the criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredProposals.map((proposal) => {
            const coverUrl = getFullCoverUrl(proposal.coverImageUrl)
            const dateStr = new Date(proposal.submittedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
            
            const reviewDateStr = proposal.reviewedAt ? new Date(proposal.reviewedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }) : null

            return (
              <Card key={proposal.proposalId} className="bg-[#1e2022] border-zinc-800 overflow-hidden flex flex-col md:flex-row">
                {/* Cover Image */}
                <div className="md:w-56 shrink-0 aspect-[3/4] md:aspect-auto relative bg-zinc-900 border-r border-zinc-800/50 flex items-center justify-center">
                  {proposal.coverImageUrl ? (
                    <img
                      src={coverUrl}
                      alt={proposal.seriesTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center">
                      <BookOpen className="w-10 h-10 text-zinc-700 mb-2" />
                      <span className="text-[11px] text-zinc-500">No cover image uploaded</span>
                    </div>
                  )}

                  {proposal.ranking && (
                    <div className="absolute top-2 left-2 bg-[#00dfc0] text-black font-bold text-xs px-2 py-0.5 rounded shadow">
                      Rank #{proposal.ranking}
                    </div>
                  )}
                </div>

                {/* Details Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Title and Badges */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-white leading-tight">
                          {proposal.seriesTitle}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          Submitted by <span className="font-semibold text-zinc-300">{proposal.submittedByName}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-xs px-2.5 py-1 ${statusColors[proposal.status.toLowerCase()] || "bg-zinc-700"}`}>
                        {statusLabels[proposal.status.toLowerCase()] || proposal.status}
                      </Badge>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-1.5">
                      {proposal.seriesGenres.length > 0 ? (
                        proposal.seriesGenres.map((g) => (
                          <Badge key={g} variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs px-2 py-0">
                            {g}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 hover:bg-zinc-800 text-xs px-2 py-0">
                          General
                        </Badge>
                      )}
                    </div>

                    {/* Synopsis */}
                    <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                      {proposal.seriesSynopsis || "No synopsis available for this series."}
                    </p>

                    {/* Database Specs Row */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-zinc-400 border-t border-zinc-800/40">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-zinc-500" />
                        Readers: <strong className="text-zinc-200">{proposal.readerCount.toLocaleString()}</strong>
                      </span>
                      {proposal.rating !== null && (
                        <span className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          Rating: <strong className="text-zinc-200">{proposal.rating.toFixed(2)} / 5.0</strong>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        Submitted: <span className="text-zinc-300 font-medium">{dateStr}</span>
                      </span>
                    </div>

                    {/* Review Board Panel (If Reviewed) */}
                    {proposal.reviewedById && (
                      <div className="mt-4 p-4 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-2 text-sm">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span>Reviewer: <strong className="text-zinc-300">{proposal.reviewedByName}</strong></span>
                          {reviewDateStr && <span>Reviewed: <span className="text-zinc-400 font-medium">{reviewDateStr}</span></span>}
                        </div>
                        {proposal.feedback && (
                          <div className="text-zinc-300 italic pt-1 border-t border-zinc-800/30">
                            &ldquo;{proposal.feedback}&rdquo;
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  {proposal.status.toLowerCase() === "submitted" && (
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800/50">
                      <Button
                        onClick={() => handleOpenReview(proposal)}
                        className="bg-[#00dfc0] text-black font-bold hover:bg-[#00dfc0]/90 px-5"
                      >
                        Review Proposal
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={(open) => !open && handleCloseReview()}>
        <DialogContent className="bg-[#18181b] text-white border-zinc-800 sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-white">Review Series Proposal</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Provide your review decision and feedback for <strong className="text-zinc-300">{selectedProposal?.seriesTitle}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Decision</Label>
              <Select
                value={reviewDecision}
                onValueChange={(val: "approved" | "rejected") => setReviewDecision(val)}
              >
                <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="approved">Approve Publication</SelectItem>
                  <SelectItem value="rejected">Reject Proposal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-feedback" className="text-zinc-300">Feedback / Review Note</Label>
              <Textarea
                id="review-feedback"
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Write detail reasons, notes, or suggestions..."
                rows={4}
                className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-[#00dfc0]"
              />
            </div>

            {reviewDecision === "approved" && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Assign Tantou Editor</Label>
                <Select value={selectedTantouId} onValueChange={setSelectedTantouId}>
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Select Tantou Editor" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {tantouUsers.map((editor) => (
                      <SelectItem key={editor.userId} value={editor.userId}>
                        {editor.fullName} - {editor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tantouUsers.length === 0 && (
                  <p className="text-xs text-red-400">No active Tantou Editor account is available.</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCloseReview}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePostReview}
              disabled={submittingReview}
              className="bg-[#00dfc0] text-black font-bold hover:bg-[#00dfc0]/90"
            >
              {submittingReview ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Decision"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
