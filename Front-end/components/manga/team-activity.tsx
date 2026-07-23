"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TeamActivity() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-zinc-400">No recent activity.</div>
      </CardContent>
    </Card>
  )
}
