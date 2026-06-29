"use client"

import { useState, useEffect } from "react"
import { BarChart3, Clock, BookOpen, Loader2, Sparkles, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { WorkflowBoard } from "@/components/manga/workflow-board"
import { SeriesDetailModal } from "@/components/manga/series-detail-modal"

interface SeriesProgress {
  id: string
  title: string
  genre: string
  chapters: number
  progress: number
  status: string
  team: string[]
  color: string
}

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success border-success/30",
  ongoing: "bg-success/20 text-success border-success/30",
  completed: "bg-primary/20 text-primary border-primary/30",
  planning: "bg-warning/20 text-warning border-warning/30",
  proposal: "bg-warning/20 text-warning border-warning/30",
}

export default function ProgressPage() {
  const { token } = useAuth()
  const [seriesList, setSeriesList] = useState<SeriesProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchSeriesData = () => {
    if (!token) return

    fetch(`${API_BASE_URL}/api/data/series`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load series progress data")
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setSeriesList(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching series data for progress:", err)
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchSeriesData()
  }, [token])

  const handleCardClick = (id: string) => {
    setSelectedSeriesId(id)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-white">
            <BarChart3 className="w-8 h-8 text-primary" />
            Studio Progress
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time tracking of manga series development, chapter statuses, and workflow pipelines.
          </p>
        </div>
      </div>

      {/* Series Progress Cards section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Active Series Portfolio
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[160px] border border-border rounded-lg bg-card text-muted-foreground p-6">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
            <p className="text-sm">Loading series progress...</p>
          </div>
        ) : error ? (
          <div className="p-4 border border-red-950 bg-red-950/20 text-red-400 rounded-lg text-sm">
            Error loading series progress: {error}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 border border-dashed border-border rounded-lg">
            No series progress found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {seriesList.map((series) => (
              <Card
                key={series.id}
                onClick={() => handleCardClick(series.id)}
                className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-white">{series.title}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1">
                        {series.genre}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`text-xs ${statusColors[series.status] || "bg-secondary text-secondary-foreground"}`}>
                      {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Ch. {series.chapters} Development Progress
                      </span>
                      <span className="font-semibold text-white">{series.progress}%</span>
                    </div>
                    <Progress value={series.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      Active Chapter Cycle
                    </span>
                    <span className="flex items-center gap-1 text-white">
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                      On Track
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Production Pipeline section */}
      <div className="border-t border-border/40 pt-6">
        <WorkflowBoard />
      </div>

      {/* Reusable Series Detail Modal */}
      {selectedSeriesId && (
        <SeriesDetailModal
          seriesId={selectedSeriesId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSeriesId(null)
          }}
          onUpdate={fetchSeriesData}
        />
      )}
    </div>
  )
}
