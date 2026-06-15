"use client"

import { Clock, Download, Upload, Eye, CheckCircle, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

const mockTasks = [
  {
    id: "1",
    title: "Chapter 45 - Background Art",
    series: "Dragon Hunters",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    type: "background",
    pages: "Pages 5-12",
    dueDate: "May 22",
    payment: 180,
    status: "in_progress",
    progress: 60,
  },
  {
    id: "2",
    title: "Chapter 45 - Speed Lines",
    series: "Dragon Hunters",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    type: "effects",
    pages: "Pages 1-8",
    dueDate: "May 23",
    payment: 120,
    status: "pending",
    progress: 0,
  },
  {
    id: "3",
    title: "Chapter 12 - Coloring",
    series: "Night Bloom",
    mangaka: { name: "Yuki Tanaka", avatar: "yuki" },
    type: "coloring",
    pages: "Pages 1-20",
    dueDate: "May 25",
    payment: 350,
    status: "pending",
    progress: 0,
  },
]

const completedTasks = [
  {
    id: "4",
    title: "Chapter 44 - Background Art",
    series: "Dragon Hunters",
    payment: 180,
    completedAt: "May 18",
    status: "approved",
  },
  {
    id: "5",
    title: "Chapter 11 - Coloring",
    series: "Night Bloom",
    payment: 320,
    completedAt: "May 15",
    status: "approved",
  },
]

const typeColors = {
  background: "bg-blue-500/20 text-blue-400",
  effects: "bg-yellow-500/20 text-yellow-400",
  coloring: "bg-purple-500/20 text-purple-400",
  line_art: "bg-green-500/20 text-green-400",
  lettering: "bg-cyan-500/20 text-cyan-400",
}

const statusColors = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-warning/20 text-warning",
  submitted: "bg-primary/20 text-primary",
  revision: "bg-destructive/20 text-destructive",
  approved: "bg-success/20 text-success",
}

export function AssistantTasks() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          My Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active ({mockTasks.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {mockTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{task.title}</h4>
                      <Badge className={typeColors[task.type as keyof typeof typeColors]}>
                        {task.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.series} - {task.pages}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Download Resources</DropdownMenuItem>
                      <DropdownMenuItem>Message Mangaka</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${task.mangaka.avatar}`} />
                      <AvatarFallback>{task.mangaka.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{task.mangaka.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Due: {task.dueDate}</span>
                  <span className="text-sm font-medium text-success">${task.payment}</span>
                </div>

                {task.status === "in_progress" && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1.5" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                    {task.status.replace("_", " ")}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Resources
                    </Button>
                    {task.status === "in_progress" && (
                      <Button size="sm" className="bg-primary text-primary-foreground">
                        <Upload className="w-4 h-4 mr-2" />
                        Submit
                      </Button>
                    )}
                    {task.status === "pending" && (
                      <Button size="sm" className="bg-primary text-primary-foreground">
                        Start Task
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-secondary/50 rounded-lg flex items-center justify-between"
              >
                <div>
                  <h4 className="font-semibold">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">{task.series}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{task.completedAt}</span>
                  <span className="text-sm font-medium text-success">${task.payment}</span>
                  <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
