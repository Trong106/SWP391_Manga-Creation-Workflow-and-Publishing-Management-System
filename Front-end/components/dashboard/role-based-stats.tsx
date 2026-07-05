"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, BookOpen, Users, Clock, CheckCircle2, DollarSign, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"

const mangakaStats = [
  { title: "Active Series", value: "3", change: "+1", trend: "up", icon: BookOpen },
  { title: "Team Members", value: "12", change: "+2", trend: "up", icon: Users },
  { title: "Pages This Week", value: "24", change: "+8", trend: "up", icon: FileText },
  { title: "Pending Reviews", value: "5", change: "-2", trend: "down", icon: CheckCircle2 },
]

const assistantStats = [
  { title: "Active Tasks", value: "8", change: "+3", trend: "up", icon: Clock },
  { title: "Completed Today", value: "4", change: "+2", trend: "up", icon: CheckCircle2 },
  { title: "Pending Payment", value: "$480", change: "+$120", trend: "up", icon: DollarSign },
  { title: "Due This Week", value: "6", change: "-1", trend: "down", icon: FileText },
]

const tantouStats = [
  { title: "Series Managed", value: "8", change: "0", trend: "up", icon: BookOpen },
  { title: "Chapters in Review", value: "12", change: "+4", trend: "up", icon: FileText },
  { title: "Ready to Publish", value: "3", change: "+1", trend: "up", icon: CheckCircle2 },
  { title: "Overdue", value: "2", change: "-1", trend: "down", icon: Clock },
]

const editorialStats = [
  { title: "New Proposals", value: "5", change: "+2", trend: "up", icon: FileText },
  { title: "Active Series", value: "24", change: "+1", trend: "up", icon: BookOpen },
  { title: "Pending Approvals", value: "8", change: "+3", trend: "up", icon: CheckCircle2 },
  { title: "Low Ranking", value: "3", change: "+1", trend: "up", icon: TrendingDown },
]

const statsMap = {
  mangaka: mangakaStats,
  assistant: assistantStats,
  tantou: tantouStats,
  editorial: editorialStats,
}

export function RoleBasedStats() {
  const { role, user, token } = useAuth()
  const [apiStats, setApiStats] = useState<{ totalSeries: number; totalAssistants: number } | null>(null)

  // Gọi API lấy dữ liệu thống kê thật từ database của tác giả (gửi kèm JWT Token để xác thực)
  useEffect(() => {
    if (role === "mangaka" && user?.id && token) {
      fetch(`${API_BASE_URL}/api/mangaka/dashboard-stats/${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          setApiStats(data)
        })
        .catch((err) => console.error("Failed to load dashboard statistics:", err))
    } else {
      setApiStats(null)
    }
  }, [role, user?.id, token])

  let stats = statsMap[role]

  // Nếu vai trò là mangaka và đã gọi xong dữ liệu từ API, cập nhật hiển thị dữ liệu thật từ SQL Server
  if (role === "mangaka" && apiStats) {
    stats = mangakaStats.map((s) => {
      if (s.title === "Active Series") {
        return { ...s, value: apiStats.totalSeries.toString() }
      }
      if (s.title === "Team Members") {
        return { ...s, value: apiStats.totalAssistants.toString() }
      }
      return s
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )}
                  <span className={`text-sm ${stat.trend === "up" ? "text-success" : "text-destructive"}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground">vs last week</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
