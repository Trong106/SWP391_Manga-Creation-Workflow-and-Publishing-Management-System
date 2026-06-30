"use client"

import { useEffect, useState } from "react"
import { Clock, User, Search, Filter, FileText, Settings, Shield, Database } from "lucide-react"
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

import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

export default function AuditPage() {
  const { token } = useAuth()
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
      <div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all system activities and changes
          </p>
        </div>
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
          </div>
        </CardContent>
      </Card>

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
                        {log.timestamp}
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
