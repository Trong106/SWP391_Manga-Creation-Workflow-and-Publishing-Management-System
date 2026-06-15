"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const deadlines = [
  {
    id: "1",
    title: "Chapter 45 Submission",
    project: "Dragon Hunters",
    date: "May 25",
    daysLeft: 5,
    priority: "high",
  },
  {
    id: "2",
    title: "Character Designs Due",
    project: "Spirit Academy",
    date: "May 28",
    daysLeft: 8,
    priority: "medium",
  },
  {
    id: "3",
    title: "Volume 3 Cover Art",
    project: "Night Bloom",
    date: "June 1",
    daysLeft: 12,
    priority: "medium",
  },
  {
    id: "4",
    title: "Chapter 46 Storyboard",
    project: "Dragon Hunters",
    date: "June 5",
    daysLeft: 16,
    priority: "low",
  },
]

const priorityColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
}

export function DeadlineCalendar() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Deadlines
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">May 2026</span>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deadlines.map((deadline) => (
            <div 
              key={deadline.id}
              className={`p-3 rounded-lg border ${priorityColors[deadline.priority]} bg-opacity-50`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{deadline.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{deadline.project}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {deadline.daysLeft}d left
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{deadline.date}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
