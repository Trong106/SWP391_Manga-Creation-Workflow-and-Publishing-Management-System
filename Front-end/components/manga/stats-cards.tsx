"use client"

import { Card, CardContent } from "@/components/ui/card"

interface StatsCardsProps {
  title: string
  value: string
  change: string
  icon: string
}

export function StatsCards({ title, value, change, icon }: StatsCardsProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-muted-foreground text-green-500">{change}</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
