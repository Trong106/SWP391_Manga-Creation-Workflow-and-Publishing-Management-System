"use client"

import { useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, BookOpen, MoreHorizontal, Edit2, Trash2 } from "lucide-react"
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

interface ScheduledItem {
  id: string
  series: string
  chapter: number
  status: "scheduled" | "published" | "cancelled"
  time?: string
  day?: number
}

interface DaySchedule {
  date: number
  items: ScheduledItem[]
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const mockSchedule: Record<number, ScheduledItem[]> = {
  20: [
    { id: "1", series: "Dragon Hunters", chapter: 44, status: "published", time: "10:00" },
  ],
  21: [
    { id: "2", series: "Night Bloom", chapter: 11, status: "scheduled", time: "12:00" },
  ],
  24: [
    { id: "3", series: "Dragon Hunters", chapter: 45, status: "scheduled", time: "10:00" },
    { id: "4", series: "Garden of Shadows", chapter: 22, status: "scheduled", time: "14:00" },
  ],
  25: [
    { id: "5", series: "Night Bloom", chapter: 12, status: "scheduled", time: "12:00" },
  ],
  27: [
    { id: "6", series: "Cyber Knights", chapter: 9, status: "scheduled", time: "10:00" },
  ],
}

const statusColors = {
  scheduled: "bg-primary/20 text-primary",
  published: "bg-success/20 text-success",
  cancelled: "bg-destructive/20 text-destructive",
}

import { useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config"

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4)) // May 2026
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [scheduleItems, setScheduleItems] = useState<ScheduledItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/data/publish-schedule`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setScheduleItems(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching publish schedule:", err)
        setLoading(false)
      })
  }, [])

  const scheduleByDay: Record<number, ScheduledItem[]> = {}
  scheduleItems.forEach((item: any) => {
    if (item.day) {
      if (!scheduleByDay[item.day]) {
        scheduleByDay[item.day] = []
      }
      scheduleByDay[item.day].push(item)
    }
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Publish Schedule
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the publishing schedule for all series
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Chapter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Chapter Publication</DialogTitle>
              <DialogDescription>Set the publish date and time for a chapter</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Series</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select series" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dragon-hunters">Dragon Hunters</SelectItem>
                    <SelectItem value="night-bloom">Night Bloom</SelectItem>
                    <SelectItem value="garden-shadows">Garden of Shadows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chapter</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">Chapter 45</SelectItem>
                    <SelectItem value="46">Chapter 46</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" defaultValue="10:00" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground" onClick={() => setIsDialogOpen(false)}>
                Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{formatMonth(currentMonth)}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-32 bg-secondary/30 rounded-lg" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const items = scheduleByDay[day] || []
              const isToday = day === 20 // Mock today as May 20

              return (
                <div
                  key={day}
                  className={`h-32 p-2 bg-secondary/50 rounded-lg border ${
                    isToday ? "border-primary" : "border-transparent"
                  } hover:border-primary/50 transition-colors`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                      {day}
                    </span>
                    {isToday && (
                      <Badge className="bg-primary/20 text-primary text-xs">Today</Badge>
                    )}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {loading ? (
                      <span className="text-[10px] text-muted-foreground">Loading...</span>
                    ) : (
                      items.map((item) => (
                        <DropdownMenu key={item.id}>
                          <DropdownMenuTrigger asChild>
                            <div
                              className={`text-xs p-1.5 rounded cursor-pointer ${statusColors[item.status]} truncate`}
                            >
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.time}</span>
                              </div>
                              <div className="truncate font-medium">
                                {item.series} Ch.{item.chapter}
                              </div>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Releases */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Upcoming Releases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-6 text-zinc-400">Loading releases...</div>
            ) : scheduleItems.filter((item) => item.status === "scheduled").length === 0 ? (
              <div className="text-center py-6 text-zinc-400">No upcoming releases scheduled.</div>
            ) : (
              scheduleItems
                .filter((item) => item.status === "scheduled")
                .sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.series}</p>
                        <p className="text-sm text-muted-foreground">Chapter {item.chapter}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">May {item.day}, 2026</p>
                        <p className="text-sm text-muted-foreground">{item.time}</p>
                      </div>
                      <Badge className={statusColors[item.status]}>
                        {item.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Reschedule</DropdownMenuItem>
                          <DropdownMenuItem>Publish Now</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
