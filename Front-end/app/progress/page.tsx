"use client"

import { useState, useEffect } from "react"
import { BarChart3, Clock, BookOpen, Loader2, Sparkles, TrendingUp, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { WorkflowBoard } from "@/components/manga/workflow-board"
import { SeriesDetailModal } from "@/components/manga/series-detail-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SeriesProgress {
  id: string
  title: string
  genre: string
  chapters: number
  progress: number
  status: string
  team: string[]
  color: string
  coverImageUrl?: string | null
  todoCount?: number
  doingCount?: number
  reviewCount?: number
  totalCount?: number
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
            <BarChart3 className="w-8 h-8 text-[#00dfc0]" />
            Studio Progress
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time tracking of manga series development, chapter statuses, and workflow pipelines.
          </p>
        </div>
      </div>

      <Tabs defaultValue="portfolio" className="w-full space-y-6">
        <TabsList className="bg-[#121416] border border-zinc-800 p-1 text-zinc-400">
          <TabsTrigger
            value="portfolio"
            className="data-[state=active]:bg-[#00dfc0] data-[state=active]:text-black hover:text-white"
          >
            <BookOpen className="w-4 h-4 mr-1.5" />
            Active Series Portfolio
          </TabsTrigger>
          <TabsTrigger
            value="pipeline"
            className="data-[state=active]:bg-[#00dfc0] data-[state=active]:text-black hover:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Production Pipeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4 outline-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[160px] border border-border rounded-lg bg-card text-muted-foreground p-6">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-[#00dfc0]" />
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
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 bg-zinc-950/50 text-[11px] text-zinc-500 uppercase font-extrabold tracking-wider">
                      <th className="py-4 px-6 w-20">Cover</th>
                      <th className="py-4 px-6">Manga Series</th>
                      <th className="py-4 px-6 w-32">Status</th>
                      <th className="py-4 px-6 w-32">Chapters</th>
                      <th className="py-4 px-6 w-60">Development Progress</th>
                      <th className="py-4 px-6 w-48">Active Cycle</th>
                      <th className="py-4 px-6 text-right w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {seriesList.map((series) => (
                      <tr 
                        key={series.id}
                        onClick={() => handleCardClick(series.id)}
                        className="group hover:bg-zinc-900/40 transition-colors duration-250 cursor-pointer text-sm"
                      >
                        {/* Cover image cell */}
                        <td className="py-4 px-6">
                          {series.coverImageUrl ? (
                            <div className="w-10 h-14 relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner">
                              <img
                                src={series.coverImageUrl.startsWith("http") ? series.coverImageUrl : `${API_BASE_URL}${series.coverImageUrl}`}
                                alt={series.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 rounded-lg border border-zinc-850 bg-zinc-950/60 flex items-center justify-center text-zinc-650 shadow-inner">
                              <BookOpen className="w-4 h-4 opacity-50" />
                            </div>
                          )}
                        </td>

                        {/* Series Title cell */}
                        <td className="py-4 px-6 font-bold text-zinc-200 group-hover:text-[#00dfc0] transition-colors">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-base line-clamp-1">{series.title}</span>
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                              {series.genre}
                            </span>
                          </div>
                        </td>

                        {/* Status cell */}
                        <td className="py-4 px-6">
                          <Badge variant="outline" className={`text-xs ${statusColors[series.status] || "bg-secondary text-secondary-foreground"}`}>
                            {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
                          </Badge>
                        </td>

                        {/* Chapters cell */}
                        <td className="py-4 px-6 font-semibold text-zinc-300">
                          <span className="text-sm">{series.chapters} chapters</span>
                        </td>

                        {/* Development Progress cell */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1.5 w-52">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Progress
                              </span>
                              <span className="font-semibold text-white">{series.progress}%</span>
                            </div>
                            <Progress value={series.progress} className="h-1.5 bg-zinc-950" />
                          </div>
                        </td>

                        {/* Active Cycle cell */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-xs text-white">
                            <TrendingUp className="w-3.5 h-3.5 text-success" />
                            <span className="font-semibold text-zinc-300">On Track</span>
                          </div>
                        </td>

                        {/* Action cell */}
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 group-hover:text-[#00dfc0] hover:bg-transparent transition-colors text-xs font-semibold"
                          >
                            View Progress
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="outline-none">
          <WorkflowBoard />
        </TabsContent>
      </Tabs>

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
