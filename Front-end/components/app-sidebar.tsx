"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  ListTodo,
  Users,
  DollarSign,
  FileCheck,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  FileText,
  Eye,
  CheckCircle,
  Clock,
  Layers,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { UserRole } from "@/lib/types"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badgeKey?: string   // dynamic badge key
  roles: UserRole[]
}

// Badge keys map to fetched counts from API
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["mangaka", "assistant", "tantou", "editorial"],
  },
  {
    title: "My Series",
    href: "/series",
    icon: BookOpen,
    roles: ["mangaka"],
  },
  {
    title: "Upload Pages",
    href: "/upload",
    icon: Upload,
    roles: ["mangaka"],
  },
  {
    title: "Task Assignment",
    href: "/tasks/assign",
    icon: Layers,
    roles: ["mangaka"],
  },
  {
    title: "My Tasks",
    href: "/tasks",
    icon: ListTodo,
    badgeKey: "myPendingTasks",
    roles: ["assistant"],
  },
  {
    title: "Submit Work",
    href: "/submit",
    icon: FileCheck,
    roles: ["assistant"],
  },
  {
    title: "My Earnings",
    href: "/payroll",
    icon: DollarSign,
    roles: ["assistant"],
  },
  {
    title: "Studio Progress",
    href: "/progress",
    icon: BarChart3,
    roles: ["mangaka", "tantou"],
  },
  {
    title: "Review Pages",
    href: "/review",
    icon: Eye,
    badgeKey: "reviewPages",
    roles: ["mangaka"],
  },
  {
    title: "Chapter Review",
    href: "/chapter-review",
    icon: Eye,
    badgeKey: "chapterReview",
    roles: ["tantou"],
  },
  {
    title: "Team Management",
    href: "/team",
    icon: Users,
    roles: ["mangaka"],
  },
  {
    title: "Payroll",
    href: "/payroll",
    icon: DollarSign,
    roles: ["mangaka"],
  },
  {
    title: "Series Proposals",
    href: "/proposals",
    icon: FileText,
    badgeKey: "pendingProposals",
    roles: ["editorial"],
  },
  {
    title: "Approve Publishing",
    href: "/publish/approve",
    icon: CheckCircle,
    badgeKey: "pendingPublish",
    roles: ["editorial"],
  },
  {
    title: "Publish Schedule",
    href: "/schedule",
    icon: Calendar,
    roles: ["editorial"],
  },
  {
    title: "Reader Votes",
    href: "/votes",
    icon: BarChart3,
    roles: ["editorial"],
  },
  {
    title: "Series Ranking",
    href: "/ranking",
    icon: BarChart3,
    roles: ["editorial"],
  },
  {
    title: "Audit Logs",
    href: "/audit",
    icon: Clock,
    roles: ["editorial"],
  },
]

const roleLabels: Record<UserRole, string> = {
  mangaka: "Mangaka",
  assistant: "Assistant",
  tantou: "Tantou Editor",
  editorial: "Editorial Board",
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, role, setRole, logout, token } = useAuth()

  // Dynamic badge counts from real API data
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({})

  const fetchBadgeCounts = useCallback(async () => {
    if (!token || !user?.id) return

    const authHeader = { Authorization: `Bearer ${token}` }

    try {
      if (role === "assistant") {
        // Fetch assistant's pending + in_progress tasks
        const res = await fetch(`${API_BASE_URL}/api/tasks/my-tasks`, { headers: authHeader })
        if (res.ok) {
          const tasks: any[] = await res.json()
          const pending = tasks.filter(t =>
            t.status === "pending" || t.status === "in_progress"
          ).length
          setBadgeCounts(prev => ({ ...prev, myPendingTasks: pending || 0 }))
        }
      }

      if (role === "mangaka") {
        // Fetch pages in review status
        const res = await fetch(`${API_BASE_URL}/api/data/review-pages`, { headers: authHeader })
        if (res.ok) {
          const pages: any[] = await res.json()
          setBadgeCounts(prev => ({ ...prev, reviewPages: pages.length || 0 }))
        }
      }

      if (role === "tantou") {
        const res = await fetch(`${API_BASE_URL}/api/data/chapter-review-queue`, { headers: authHeader })
        if (res.ok) {
          const chapters: any[] = await res.json()
          setBadgeCounts(prev => ({ ...prev, chapterReview: chapters.length || 0 }))
        }
      }

      if (role === "editorial") {
        // Fetch pending series proposals
        const [proposalsRes, publishRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/proposals`, { headers: authHeader }),
          fetch(`${API_BASE_URL}/api/publish-schedules`, { headers: authHeader }),
        ])

        if (proposalsRes.ok) {
          const proposals: any[] = await proposalsRes.json()
          const pendingProposals = proposals.filter((p: any) =>
            p.status === "submitted" || p.status === "pending"
          ).length
          setBadgeCounts(prev => ({ ...prev, pendingProposals: pendingProposals || 0 }))
        }

        if (publishRes.ok) {
          const schedules: any[] = await publishRes.json()
          const pendingPublish = schedules.filter((s: any) =>
            s.status === "scheduled" || s.status === "pending"
          ).length
          setBadgeCounts(prev => ({ ...prev, pendingPublish: pendingPublish || 0 }))
        }
      }
    } catch (err) {
      // Silently fail — badges are informational only
    }
  }, [token, user?.id, role])

  useEffect(() => {
    fetchBadgeCounts()
    const handleBadgesRefresh = () => fetchBadgeCounts()
    window.addEventListener("mangaflow:badges-refresh", handleBadgesRefresh)
    window.addEventListener("focus", handleBadgesRefresh)
    const interval = setInterval(fetchBadgeCounts, 5000)
    return () => {
      window.removeEventListener("mangaflow:badges-refresh", handleBadgesRefresh)
      window.removeEventListener("focus", handleBadgesRefresh)
      clearInterval(interval)
    }
  }, [fetchBadgeCounts])

  const filteredNavItems = navItems.filter(item => item.roles.includes(role))

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            {!collapsed && (
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="MangaFlow Logo"
                  width={32}
                  height={32}
                  className="rounded-lg object-contain"
                />
                <span className="text-lg font-bold">MangaFlow</span>
              </Link>
            )}
            {collapsed && (
              <Link href="/" className="mx-auto">
                <Image
                  src="/logo.png"
                  alt="MangaFlow Logo"
                  width={32}
                  height={32}
                  className="rounded-lg object-contain"
                />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className={cn("shrink-0", collapsed && "mx-auto mt-2")}
            >
              {collapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href
                const NavIcon = item.icon
                const badgeCount = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0

                const linkContent = (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <NavIcon className={cn("w-5 h-5 shrink-0", isActive && "text-primary")} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-sm font-medium">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                            {badgeCount}
                          </Badge>
                        )}
                      </>
                    )}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          {item.title}
                          {badgeCount > 0 && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                              {badgeCount}
                            </Badge>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </li>
                  )
                }

                return <li key={item.href}>{linkContent}</li>
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.avatar}`}
                  />
                  <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell className="w-4 h-4 mr-2" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive cursor-pointer" onClick={logout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="w-9 h-9 mx-auto cursor-pointer">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.avatar}`}
                    />
                    <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
