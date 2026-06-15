"use client"

import { FileText, Check, X, TrendingUp, TrendingDown, BarChart3, AlertTriangle, Eye, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const proposals = [
  {
    id: "1",
    title: "Steel Dynasty",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    genre: ["Mecha", "Sci-Fi"],
    synopsis: "In a world ruled by giant mechs, a young pilot discovers...",
    submittedAt: "2 days ago",
    status: "pending",
  },
  {
    id: "2",
    title: "Crimson Tide",
    mangaka: { name: "Kenji Yamamoto", avatar: "kenji" },
    genre: ["Action", "Thriller"],
    synopsis: "A retired assassin is pulled back into the underworld...",
    submittedAt: "5 days ago",
    status: "pending",
  },
]

const pendingPublish = [
  {
    id: "1",
    series: "Dragon Hunters",
    chapter: 44,
    tantou: "Sakura Ito",
    submittedAt: "1 hour ago",
    scheduledDate: "May 24",
  },
  {
    id: "2",
    series: "Night Bloom",
    chapter: 11,
    tantou: "Sakura Ito",
    submittedAt: "3 hours ago",
    scheduledDate: "May 25",
  },
  {
    id: "3",
    series: "Garden of Shadows",
    chapter: 21,
    tantou: "Ryu Tanaka",
    submittedAt: "1 day ago",
    scheduledDate: "May 26",
  },
]

const seriesRanking = [
  { rank: 1, title: "One Step Beyond", votes: 2450, change: 0, status: "safe" },
  { rank: 2, title: "Heart of Steel", votes: 2380, change: 1, status: "safe" },
  { rank: 3, title: "Dragon Hunters", votes: 2250, change: 2, status: "safe" },
  { rank: 4, title: "Midnight Sun", votes: 2100, change: -2, status: "safe" },
  { rank: 5, title: "Garden of Shadows", votes: 1980, change: 0, status: "safe" },
  { rank: 6, title: "Night Bloom", votes: 1850, change: 1, status: "safe" },
  { rank: 7, title: "Cyber Knights", votes: 1720, change: -1, status: "warning" },
  { rank: 8, title: "Silent Whispers", votes: 1450, change: -2, status: "danger" },
  { rank: 9, title: "Fading Light", votes: 1200, change: 0, status: "danger" },
  { rank: 10, title: "Broken Dreams", votes: 980, change: -3, status: "danger" },
]

const statusColors = {
  safe: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
}

export function EditorialDashboard() {
  return (
    <div className="space-y-6">
      {/* Proposals Section */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            New Series Proposals
          </CardTitle>
          <Badge variant="secondary" className="bg-warning/20 text-warning">
            {proposals.length} pending
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="p-4 bg-secondary/50 rounded-lg border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{proposal.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${proposal.mangaka.avatar}`} />
                      <AvatarFallback>{proposal.mangaka.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{proposal.mangaka.name}</span>
                    <span className="text-sm text-muted-foreground">- {proposal.submittedAt}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {proposal.genre.map((g) => (
                    <Badge key={g} variant="outline">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{proposal.synopsis}</p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Review Full Proposal
                </Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/50">
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90">
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pending Publish Approvals */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            Chapters Pending Publish Approval
          </CardTitle>
          <Badge variant="secondary" className="bg-warning/20 text-warning">
            {pendingPublish.length} pending
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Series</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Tantou</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPublish.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.series}</TableCell>
                  <TableCell>Ch. {item.chapter}</TableCell>
                  <TableCell>{item.tantou}</TableCell>
                  <TableCell>{item.submittedAt}</TableCell>
                  <TableCell>{item.scheduledDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90">
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Series Ranking */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Weekly Series Ranking
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-destructive/20 text-destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              3 at risk
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Week 20
                  <MoreHorizontal className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Week 20</DropdownMenuItem>
                <DropdownMenuItem>Week 19</DropdownMenuItem>
                <DropdownMenuItem>Week 18</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Series</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seriesRanking.map((series) => (
                <TableRow key={series.rank} className={series.status === "danger" ? "bg-destructive/5" : ""}>
                  <TableCell>
                    <span className={`font-bold text-lg ${statusColors[series.status as keyof typeof statusColors]}`}>
                      #{series.rank}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {series.title}
                      {series.status === "danger" && (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{series.votes.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {series.change > 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-success" />
                          <span className="text-success">+{series.change}</span>
                        </>
                      ) : series.change < 0 ? (
                        <>
                          <TrendingDown className="w-4 h-4 text-destructive" />
                          <span className="text-destructive">{series.change}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {series.status === "danger" && (
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/50">
                        Consider Cancellation
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
