"use client"

import { Users, Plus, Mail, MoreHorizontal, Star, Clock, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"

export default function TeamPage() {
  const { token, role } = useAuth()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isReadOnly = role === "tantou"

  useEffect(() => {
    if (!token) return
    if (role !== "mangaka" && role !== "tantou") {
      setLoading(false)
      setTeamMembers([])
      return
    }

    fetch(`${API_BASE_URL}/api/data/team`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTeamMembers(data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching team members:", err)
        setLoading(false)
      })
  }, [token, role])

  const activeMembers = teamMembers.filter((m) => m.status === "active").length
  const totalTasks = teamMembers.reduce((sum, m) => sum + m.currentTasks, 0)
  const avgRating = teamMembers.length > 0 
    ? (teamMembers.reduce((sum, m) => sum + Number(m.rating), 0) / teamMembers.length).toFixed(1) 
    : "0.0"

  if (role !== "mangaka" && role !== "tantou") {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-destructive">Access Denied</h1>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            Team information is available to Mangaka and Tantou Editor roles only.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            {isReadOnly ? "Team Overview" : "Team Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isReadOnly
              ? "View studio assistant capacity while reviewing chapter readiness"
              : "Manage your studio assistants and collaborators"}
          </p>
        </div>
        {!isReadOnly && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>Send an invitation to join your studio</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" placeholder="assistant@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="background">Background Artist</SelectItem>
                    <SelectItem value="effects">Effects Specialist</SelectItem>
                    <SelectItem value="colorist">Colorist</SelectItem>
                    <SelectItem value="line">Line Artist</SelectItem>
                    <SelectItem value="letterer">Letterer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <Input type="number" placeholder="e.g., 18" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button className="bg-primary text-primary-foreground">
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-3xl font-bold mt-1">{teamMembers.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-3xl font-bold mt-1">{activeMembers}</p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks In Progress</p>
                <p className="text-3xl font-bold mt-1">{totalTasks}</p>
              </div>
              <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
                <p className="text-3xl font-bold mt-1">{avgRating}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {isReadOnly ? "Studio assistant workload, completion count, and rates" : "Your studio assistants and their current status"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">
              Loading team members from database...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No team members found in database.
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.avatar}`} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{member.name}</h4>
                    <Badge
                      className={
                        member.status === "active"
                          ? "bg-success/20 text-success"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {member.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.specialty}</p>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">{member.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>

                  <div className="text-center">
                    <p className="font-medium">{member.tasksCompleted}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>

                  <div className="text-center">
                    <p className="font-medium">{member.currentTasks}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>

                  <div className="text-center">
                    <p className="font-medium">${member.hourlyRate}/hr</p>
                    <p className="text-xs text-muted-foreground">Rate</p>
                  </div>
                </div>

                {isReadOnly ? (
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                    Read only
                  </Badge>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Assign Task</DropdownMenuItem>
                      <DropdownMenuItem>View History</DropdownMenuItem>
                      <DropdownMenuItem>Edit Rate</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Remove from Team</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  )
}
