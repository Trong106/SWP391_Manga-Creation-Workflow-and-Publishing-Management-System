"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config"
import { Layers, Users, Plus, Check, GripVertical, Trash2, DollarSign, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

interface Region {
  id: string
  type: "background" | "line_art" | "effects" | "coloring" | "lettering"
  pages: string
  assignee?: { id: string; name: string; avatar: string }
  payment: number
  dueDate: string
}

// Removed local mockRegions and assistants in favor of database-driven states.

const typeColors = {
  background: "bg-blue-500/20 text-blue-400",
  line_art: "bg-green-500/20 text-green-400",
  effects: "bg-yellow-500/20 text-yellow-400",
  coloring: "bg-purple-500/20 text-purple-400",
  lettering: "bg-cyan-500/20 text-cyan-400",
}

export default function TaskAssignPage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [assistants, setAssistants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssistant, setSelectedAssistant] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE_URL}/api/data/tasks`).then((res) => res.json()),
      fetch(`${API_BASE_URL}/api/data/team`).then((res) => res.json())
    ])
      .then(([tasksData, teamData]) => {
        if (Array.isArray(tasksData)) {
          const mappedRegions = tasksData.map((t: any) => ({
            id: t.id,
            type: t.type === "ink" ? "line_art" : (t.type === "color" ? "coloring" : (t.type === "letter" ? "lettering" : t.type)),
            pages: t.pageNumber ? t.pageNumber.toString() : "1",
            assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName, avatar: t.assigneeName.toLowerCase().replace(" ", "") } : undefined,
            payment: t.payment,
            dueDate: t.dueDate || "May 22"
          }))
          setRegions(mappedRegions)
        }
        if (Array.isArray(teamData)) {
          const mappedAssistants = teamData.map((a: any) => ({
            id: a.id,
            name: a.name,
            avatar: a.avatar,
            specialty: a.role,
            rate: Number(a.hourlyRate)
          }))
          setAssistants(mappedAssistants)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading task assignment data:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-zinc-400">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading task assignment pipeline from database...
      </div>
    )
  }

  const unassignedCount = regions.filter((r) => !r.assignee).length
  const totalPayment = regions.reduce((sum, r) => sum + r.payment, 0)

  const removeRegion = (id: string) => {
    setRegions(regions.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Layers className="w-8 h-8 text-primary" />
          Task Assignment
        </h1>
        <p className="text-muted-foreground mt-1">
          Assign regions and tasks to your assistants
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chapter Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Select Chapter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Series</Label>
                  <Select defaultValue="dragon-hunters">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dragon-hunters">Dragon Hunters</SelectItem>
                      <SelectItem value="night-bloom">Night Bloom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select defaultValue="45">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45">Chapter 45 - The Final Battle</SelectItem>
                      <SelectItem value="44">Chapter 44</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Regions */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Task Regions</CardTitle>
                <CardDescription>Define work regions and assign to assistants</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Region
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Task Region</DialogTitle>
                    <DialogDescription>Define a new task region for this chapter</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Task Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="background">Background</SelectItem>
                          <SelectItem value="line_art">Line Art</SelectItem>
                          <SelectItem value="effects">Effects</SelectItem>
                          <SelectItem value="coloring">Coloring</SelectItem>
                          <SelectItem value="lettering">Lettering</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pages</Label>
                      <Input placeholder="e.g., 1-10 or 5, 12, 18" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Payment ($)</Label>
                        <Input type="number" placeholder="e.g., 150" />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-primary text-primary-foreground" onClick={() => setIsDialogOpen(false)}>
                      Add Region
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg border border-border"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                  
                  <Badge className={typeColors[region.type]}>
                    {region.type.replace("_", " ")}
                  </Badge>
                  
                  <div className="flex-1">
                    <p className="font-medium">Pages {region.pages}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">${region.payment}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{region.dueDate}</span>
                  </div>

                  {region.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${region.assignee.avatar}`} />
                        <AvatarFallback>{region.assignee.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{region.assignee.name}</span>
                      <Badge className="bg-success/20 text-success">
                        <Check className="w-3 h-3" />
                      </Badge>
                    </div>
                  ) : (
                    <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assistants.map((assistant) => (
                          <SelectItem key={assistant.id} value={assistant.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${assistant.avatar}`} />
                                <AvatarFallback>{assistant.name[0]}</AvatarFallback>
                              </Avatar>
                              {assistant.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button variant="ghost" size="icon" onClick={() => removeRegion(region.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Assignment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Regions</span>
                <span className="font-medium">{regions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assigned</span>
                <span className="font-medium text-success">{regions.length - unassignedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unassigned</span>
                <span className="font-medium text-warning">{unassignedCount}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-muted-foreground">Total Payment</span>
                <span className="font-bold text-lg">${totalPayment}</span>
              </div>
              <Button className="w-full bg-primary text-primary-foreground" disabled={unassignedCount > 0}>
                <Check className="w-4 h-4 mr-2" />
                Confirm & Notify Team
              </Button>
            </CardContent>
          </Card>

          {/* Available Assistants */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Available Assistants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${assistant.avatar}`} />
                    <AvatarFallback>{assistant.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{assistant.name}</p>
                    <p className="text-xs text-muted-foreground">{assistant.specialty}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    ${assistant.rate}/hr
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
