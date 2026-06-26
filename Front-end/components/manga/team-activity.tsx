"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

const typeBadges: Record<string, string> = {
  series: "bg-blue-500/20 text-blue-400",
  chapter: "bg-green-500/20 text-green-400",
  user: "bg-purple-500/20 text-purple-400",
  system: "bg-yellow-500/20 text-yellow-400",
  payment: "bg-cyan-500/20 text-cyan-400",
}

export function TeamActivity() {
  const { role, token } = useAuth()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || role !== "editorial") {
      setActivities([])
      setLoading(false)
      return
    }

    fetch(`${API_BASE_URL}/api/data/audit-logs`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // Map to activity shape
          const mapped = data.slice(0, 5).map((log: any) => ({
            id: log.id,
            user: { name: log.user.name, avatar: log.user.avatar },
            action: log.action.replace("_", " "),
            target: log.entityName,
            project: log.category.toUpperCase(),
            time: log.timestamp,
            type: log.category,
          }))
          setActivities(mapped)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching activity logs:", err)
        setLoading(false)
      })
  }, [role, token])

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-zinc-400">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">No recent activity.</div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${activity.user.avatar}`} />
                  <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>
                    <span className="text-muted-foreground"> {activity.action} </span>
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{activity.project}</Badge>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
                <Badge className={`${typeBadges[activity.type] || "bg-secondary text-secondary-foreground"} text-xs`}>
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
