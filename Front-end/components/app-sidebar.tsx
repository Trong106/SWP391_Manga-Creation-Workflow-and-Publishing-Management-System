"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  ListTodo,
  Users,
  DollarSign,
  FileCheck,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  Bell,
  Sparkles,
  FileText,
  Eye,
  CheckCircle,
  Clock,
  Layers,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  badge?: number
  roles: UserRole[]
}

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
    badge: 5,
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
    href: "/earnings",
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
    badge: 3,
    roles: ["mangaka", "tantou"],
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
    title: "Submit to Publish",
    href: "/publish/submit",
    icon: FileText,
    roles: ["tantou"],
  },
  {
    title: "Series Proposals",
    href: "/proposals",
    icon: FileText,
    badge: 2,
    roles: ["editorial"],
  },
  {
    title: "Approve Publishing",
    href: "/publish/approve",
    icon: CheckCircle,
    badge: 4,
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

const roleColors: Record<UserRole, string> = {
  mangaka: "bg-primary/20 text-primary",
  assistant: "bg-chart-3/20 text-chart-3",
  tantou: "bg-chart-2/20 text-chart-2",
  editorial: "bg-chart-5/20 text-chart-5",
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, role, setRole, logout } = useAuth()

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role))

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
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="font-bold text-primary-foreground text-sm">MF</span>
                </div>
                <span className="text-lg font-bold">MangaFlow</span>
              </Link>
            )}
            {collapsed && (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
                <span className="font-bold text-primary-foreground text-sm">MF</span>
              </div>
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
                        {item.badge && (
                          <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                            {item.badge}
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
                          {item.badge && (
                            <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
                              {item.badge}
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
