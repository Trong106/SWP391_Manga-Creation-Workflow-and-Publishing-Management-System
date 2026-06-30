"use client"

import { useState } from "react"
import { Clock, User, Search, Filter, Download, ChevronRight, FileText, Settings, Shield, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AuditEntry {
  id: string
  user: { name: string; avatar: string; role: string }
  action: string
  entityType: string
  entityName: string
  details: string
  timestamp: string
  category: "series" | "chapter" | "user" | "system" | "payment"
}

// const mockAuditLogs: AuditEntry[] = [
//   {
//     id: "1",
//     user: { name: "Takeshi Sato", avatar: "takeshi", role: "Editorial Board" },
//     action: "approved_series",
//     entityType: "Series",
//     entityName: "Steel Dynasty",
//     details: "Approved new series proposal from Yuki Tanaka",
//     timestamp: "2 hours ago",
//     category: "series",
//   },
//   {
//     id: "2",
//     user: { name: "Sakura Ito", avatar: "sakura", role: "Tantou Editor" },
//     action: "submitted_chapter",
//     entityType: "Chapter",
//     entityName: "Dragon Hunters Ch. 45",
//     details: "Submitted chapter for publishing approval",
//     timestamp: "3 hours ago",
//     category: "chapter",
//   },
//   {
//     id: "3",
//     user: { name: "Yuki Tanaka", avatar: "yuki", role: "Mangaka" },
//     action: "uploaded_pages",
//     entityType: "Chapter",
//     entityName: "Dragon Hunters Ch. 46",
//     details: "Uploaded 24 new pages",
//     timestamp: "5 hours ago",
//     category: "chapter",
//   },
//   {
//     id: "4",
//     user: { name: "System", avatar: "system", role: "Automated" },
//     action: "published_chapter",
//     entityType: "Chapter",
//     entityName: "Night Bloom Ch. 11",
//     details: "Auto-published on schedule",
//     timestamp: "8 hours ago",
//     category: "system",
//   },
//   {
//     id: "5",
//     user: { name: "Takeshi Sato", avatar: "takeshi", role: "Editorial Board" },
//     action: "cancelled_series",
//     entityType: "Series",
//     entityName: "Fading Light",
//     details: "Cancelled due to low reader votes (3 consecutive weeks below threshold)",
//     timestamp: "1 day ago",
//     category: "series",
//   },
//   {
//     id: "6",
//     user: { name: "System", avatar: "system", role: "Automated" },
//     action: "processed_payment",
//     entityType: "Payment",
//     entityName: "Batch #2024-05-19",
//     details: "Processed 15 assistant payments totaling $4,250",
//     timestamp: "1 day ago",
//     category: "payment",
//   },
//   {
//     id: "7",
//     user: { name: "Kenji Yamamoto", avatar: "kenji", role: "Assistant" },
//     action: "submitted_task",
//     entityType: "Task",
//     entityName: "Background Art - Ch. 44",
//     details: "Submitted completed task for review",
//     timestamp: "2 days ago",
//     category: "chapter",
//   },
//   {
//     id: "8",
//     user: { name: "Takeshi Sato", avatar: "takeshi", role: "Editorial Board" },
//     action: "updated_schedule",
//     entityType: "Schedule",
//     entityName: "May 2026 Schedule",
//     details: "Modified publish schedule for 3 series",
//     timestamp: "2 days ago",
//     category: "system",
//   },
// ]

const categoryColors = {
  series: "bg-blue-500/20 text-blue-400",
  chapter: "bg-green-500/20 text-green-400",
  user: "bg-purple-500/20 text-purple-400",
  system: "bg-yellow-500/20 text-yellow-400",
  payment: "bg-cyan-500/20 text-cyan-400",
}

const categoryIcons = {
  series: FileText,
  chapter: FileText,
  user: User,
  system: Settings,
  payment: Database,
}

import { useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { formatRelativeTime } from "@/lib/date-time"
import { useNow } from "@/lib/use-now"

export default function AuditPage() {
  const { token } = useAuth()
  const now = useNow()
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    fetch(`${API_BASE_URL}/api/data/audit-logs`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAuditLogs(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching audit logs:", err)
        setLoading(false)
      })
  }, [token])

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all system activities and changes
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="series">Series</SelectItem>
                <SelectItem value="chapter">Chapters</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Last 7 days
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Last 24 hours</DropdownMenuItem>
                <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                <DropdownMenuItem>Custom range</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: "1,247", period: "This month" },
          { label: "Series Changes", value: "23", period: "This week" },
          { label: "Chapter Actions", value: "156", period: "This week" },
          { label: "System Events", value: "89", period: "This week" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Showing {filteredLogs.length} events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">Loading audit logs from database...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">No events found in database.</div>
          ) : (
            filteredLogs.map((log) => {
              const CategoryIcon = categoryIcons[log.category]
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryColors[log.category]}`}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.entityName}</span>
                      <Badge className={categoryColors[log.category]}>
                        {log.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {log.user.name === "System" ? (
                          <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <Settings className="w-3 h-3 text-yellow-400" />
                          </div>
                        ) : (
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${log.user.avatar}`} />
                            <AvatarFallback>{log.user.name[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        <span>{log.user.name}</span>
                        <span className="text-muted-foreground/60">({log.user.role})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(log.timestamp, now)}
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
