"use client"

import { useState } from "react"
import { BarChart3, TrendingUp, TrendingDown, Plus, Save, History, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface VoteEntry {
  id: string
  series: string
  votes: number
  previousVotes: number
  change: number
  rank: number
  previousRank: number
}

const mockVotes: VoteEntry[] = [
  { id: "1", series: "One Step Beyond", votes: 2450, previousVotes: 2380, change: 70, rank: 1, previousRank: 1 },
  { id: "2", series: "Heart of Steel", votes: 2380, previousVotes: 2290, change: 90, rank: 2, previousRank: 3 },
  { id: "3", series: "Dragon Hunters", votes: 2250, previousVotes: 2100, change: 150, rank: 3, previousRank: 5 },
  { id: "4", series: "Midnight Sun", votes: 2100, previousVotes: 2350, change: -250, rank: 4, previousRank: 2 },
  { id: "5", series: "Garden of Shadows", votes: 1980, previousVotes: 1980, change: 0, rank: 5, previousRank: 5 },
  { id: "6", series: "Night Bloom", votes: 1850, previousVotes: 1720, change: 130, rank: 6, previousRank: 7 },
  { id: "7", series: "Cyber Knights", votes: 1720, previousVotes: 1850, change: -130, rank: 7, previousRank: 6 },
  { id: "8", series: "Silent Whispers", votes: 1450, previousVotes: 1620, change: -170, rank: 8, previousRank: 8 },
  { id: "9", series: "Fading Light", votes: 1200, previousVotes: 1200, change: 0, rank: 9, previousRank: 9 },
  { id: "10", series: "Broken Dreams", votes: 980, previousVotes: 1150, change: -170, rank: 10, previousRank: 10 },
]

const weekHistory = [
  { week: 20, year: 2026, totalVotes: 18360, topSeries: "One Step Beyond" },
  { week: 19, year: 2026, totalVotes: 17640, topSeries: "One Step Beyond" },
  { week: 18, year: 2026, totalVotes: 17890, topSeries: "Midnight Sun" },
  { week: 17, year: 2026, totalVotes: 16920, topSeries: "One Step Beyond" },
]

import { useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

export default function VotesPage() {
  const { token } = useAuth()
  const [selectedWeek, setSelectedWeek] = useState("20")
  const [votes, setVotes] = useState<Record<string, string>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [voteEntries, setVoteEntries] = useState<VoteEntry[]>([])
  const [seriesList, setSeriesList] = useState<any[]>([])
  const [availableWeeks, setAvailableWeeks] = useState<string[]>(["20", "19", "18", "17"])
  const [inputWeek, setInputWeek] = useState("21")
  const [inputYear, setInputYear] = useState("2026")
  const [loading, setLoading] = useState(true)

  // Fetch votes for the selected week
  useEffect(() => {
    if (!token) return

    setLoading(true)
    fetch(`${API_BASE_URL}/api/data/reader-votes?week=${selectedWeek}&year=2026`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVoteEntries(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching reader votes:", err)
        setLoading(false)
      })
  }, [selectedWeek, token])

  // Fetch all series for input dropdown/list
  useEffect(() => {
    if (!token) return

    fetch(`${API_BASE_URL}/api/data/series`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSeriesList(data)
        }
      })
      .catch((err) => console.error("Error fetching series:", err))
  }, [token])

  const handleVoteChange = (seriesId: string, value: string) => {
    setVotes({ ...votes, [seriesId]: value })
  }

  const handleSaveVotes = async () => {
    if (!token) {
      alert("Your session is not ready. Please sign in again.")
      return
    }

    const weekNum = parseInt(inputWeek)
    const yearNum = parseInt(inputYear)
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 53) {
      alert("Please enter a valid week number (1-53).")
      return
    }
    if (isNaN(yearNum) || yearNum < 2000) {
      alert("Please enter a valid year.")
      return
    }

    const votesPayload = Object.entries(votes)
      .map(([seriesId, voteVal]) => ({
        seriesId,
        votes: parseInt(voteVal) || 0
      }))
      .filter(v => v.votes >= 0)

    if (votesPayload.length === 0) {
      alert("Please enter votes for at least one series.")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/data/reader-votes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          weekNumber: weekNum,
          yearNumber: yearNum,
          votes: votesPayload
        })
      })

      if (!response.ok) {
        throw new Error("Failed to save votes")
      }

      alert("Votes saved successfully!")
      setIsDialogOpen(false)
      setVotes({})
      
      // Update available weeks if this is a new one
      const weekStr = weekNum.toString()
      if (!availableWeeks.includes(weekStr)) {
        setAvailableWeeks(prev => [...prev, weekStr].sort((a, b) => parseInt(b) - parseInt(a)))
      }
      setSelectedWeek(weekStr)
    } catch (err) {
      console.error("Error saving votes:", err)
      alert("Failed to save votes. Please try again.")
    }
  }

  const totalVotes = voteEntries.reduce((sum, v) => sum + v.votes, 0)
  const topSeries = voteEntries.length > 0 ? voteEntries[0] : null
  const atRiskCount = voteEntries.filter(v => v.rank >= 8).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Reader Votes
          </h1>
          <p className="text-muted-foreground mt-1">
            Input and manage weekly reader votes for series ranking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map((wk) => (
                <SelectItem key={wk} value={wk}>Week {wk}, 2026</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Input New Week
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Input Weekly Votes</DialogTitle>
                <DialogDescription>Enter the reader votes for each series this week</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border mb-4">
                <div>
                  <Label htmlFor="input-week">Week Number</Label>
                  <Input
                    id="input-week"
                    type="number"
                    min="1"
                    max="53"
                    value={inputWeek}
                    onChange={(e) => setInputWeek(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="input-year">Year</Label>
                  <Input
                    id="input-year"
                    type="number"
                    min="2000"
                    value={inputYear}
                    onChange={(e) => setInputYear(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                {seriesList.length === 0 ? (
                  <p className="text-sm text-zinc-400">Loading series...</p>
                ) : (
                  seriesList.map((series) => (
                    <div key={series.id} className="flex items-center gap-4">
                      <Label className="w-48 text-sm">{series.title}</Label>
                      <Input
                        type="number"
                        placeholder="Enter votes"
                        value={votes[series.id] || ""}
                        onChange={(e) => handleVoteChange(series.id, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-primary text-primary-foreground" onClick={handleSaveVotes}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Votes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Votes</p>
                <p className="text-3xl font-bold mt-1">{totalVotes.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Series</p>
                <p className="text-xl font-bold mt-1">{topSeries ? topSeries.series : "N/A"}</p>
                <p className="text-sm text-success">{topSeries ? `${topSeries.votes.toLocaleString()} votes` : ""}</p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-xl font-bold mt-1">{atRiskCount} Series</p>
                <p className="text-sm text-destructive">Below threshold</p>
              </div>
              <div className="w-12 h-12 bg-destructive/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Rankings */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Week {selectedWeek} Rankings</CardTitle>
            <CardDescription>Current series rankings based on reader votes</CardDescription>
          </div>
          <Button variant="outline" size="sm">
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
                <TableHead className="text-right">Votes</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">Rank Change</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-zinc-400">Loading rankings...</TableCell>
                </TableRow>
              ) : voteEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-zinc-400">No rankings found.</TableCell>
                </TableRow>
              ) : (
                voteEntries.map((entry) => {
                  const rankChange = entry.previousRank - entry.rank
                  const isAtRisk = entry.rank >= 8

                  return (
                    <TableRow key={entry.id} className={isAtRisk ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <span className={`font-bold text-lg ${isAtRisk ? "text-destructive" : ""}`}>
                          #{entry.rank}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{entry.series}</TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.votes.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {entry.change > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-success" />
                              <span className="text-success">+{entry.change}</span>
                            </>
                          ) : entry.change < 0 ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-destructive" />
                              <span className="text-destructive">{entry.change}</span>
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
                      {isAtRisk ? (
                        <Badge className="bg-destructive/20 text-destructive">At Risk</Badge>
                      ) : (
                        <Badge className="bg-success/20 text-success">Safe</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                  )
                }))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Vote History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weekHistory.map((week) => (
              <div
                key={week.week}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
              >
                <div>
                  <p className="font-medium">Week {week.week}, {week.year}</p>
                  <p className="text-sm text-muted-foreground">Top: {week.topSeries}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{week.totalVotes.toLocaleString()} total votes</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
