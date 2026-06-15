"use client"

import { Eye, Check, X, MessageSquare, Clock, MoreHorizontal, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const chaptersInReview = [
  {
    id: "1",
    series: "Dragon Hunters",
    chapter: 45,
    title: "The Final Battle",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    submittedAt: "2 hours ago",
    pages: 24,
    status: "pending_review",
    deadline: "May 25",
    isUrgent: true,
  },
  {
    id: "2",
    series: "Night Bloom",
    chapter: 12,
    title: "Confession",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    submittedAt: "1 day ago",
    pages: 20,
    status: "pending_review",
    deadline: "May 28",
    isUrgent: false,
  },
  {
    id: "3",
    series: "Cyber Knights",
    chapter: 8,
    title: "System Override",
    mangaka: { name: "Kenji Yamamoto", avatar: "kenji" },
    submittedAt: "3 days ago",
    pages: 18,
    status: "revision_requested",
    deadline: "May 22",
    isUrgent: true,
  },
]

const seriesProgress = [
  {
    id: "1",
    title: "Dragon Hunters",
    mangaka: "Yuki Tanaka",
    currentChapter: 45,
    weeklyProgress: 85,
    status: "on_track",
  },
  {
    id: "2",
    title: "Night Bloom",
    mangaka: "Yuki Tanaka",
    currentChapter: 12,
    weeklyProgress: 60,
    status: "on_track",
  },
  {
    id: "3",
    title: "Cyber Knights",
    mangaka: "Kenji Yamamoto",
    currentChapter: 8,
    weeklyProgress: 35,
    status: "behind",
  },
  {
    id: "4",
    title: "Garden of Shadows",
    mangaka: "Mei Chen",
    currentChapter: 22,
    weeklyProgress: 100,
    status: "ahead",
  },
]

const statusColors = {
  pending_review: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  revision_requested: "bg-destructive/20 text-destructive",
  on_track: "bg-success/20 text-success",
  behind: "bg-destructive/20 text-destructive",
  ahead: "bg-primary/20 text-primary",
}

export function TantouReviewQueue() {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Chapters Pending Review
          </CardTitle>
          <Badge variant="secondary" className="bg-warning/20 text-warning">
            {chaptersInReview.filter((c) => c.status === "pending_review").length} pending
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {chaptersInReview.map((chapter) => (
            <div
              key={chapter.id}
              className="p-4 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {chapter.isUrgent && (
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{chapter.series}</h4>
                      <span className="text-muted-foreground">Ch. {chapter.chapter}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{chapter.title}</p>
                  </div>
                </div>
                <Badge className={statusColors[chapter.status as keyof typeof statusColors]}>
                  {chapter.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${chapter.mangaka.avatar}`} />
                    <AvatarFallback>{chapter.mangaka.name[0]}</AvatarFallback>
                  </Avatar>
                  <span>{chapter.mangaka.name}</span>
                </div>
                <span>{chapter.pages} pages</span>
                <span>Submitted {chapter.submittedAt}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Due: {chapter.deadline}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Annotate
                </Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                  <X className="w-4 h-4 mr-2" />
                  Request Revision
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

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Series Progress Overview</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                This Week
                <MoreHorizontal className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>This Week</DropdownMenuItem>
              <DropdownMenuItem>This Month</DropdownMenuItem>
              <DropdownMenuItem>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-4">
          {seriesProgress.map((series) => (
            <div key={series.id} className="p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{series.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {series.mangaka} - Chapter {series.currentChapter}
                  </p>
                </div>
                <Badge className={statusColors[series.status as keyof typeof statusColors]}>
                  {series.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={series.weeklyProgress} className="flex-1 h-2" />
                <span className="text-sm font-medium w-12">{series.weeklyProgress}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
