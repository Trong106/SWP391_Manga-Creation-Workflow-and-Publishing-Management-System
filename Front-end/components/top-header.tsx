"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, Menu, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AppSidebar } from "./app-sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
}

export function TopHeader() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  const fetchNotifications = () => {
    if (!token) return
    fetch(`${API_BASE_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          logout()
          return null
        }
        if (!res.ok) throw new Error("Failed to load notifications")
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data)
        }
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err)
      })
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [token])

  const handleMarkAsRead = async (id: string) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification
          )
        )
      }
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const handleOpenNotification = (notification: Notification) => {
    setSelectedNotification(notification)
    if (!notification.isRead) {
      void handleMarkAsRead(notification.id)
    }
  }

  const handleOpenRelatedWork = () => {
    if (!selectedNotification?.link) return
    const link = selectedNotification.link
    setSelectedNotification(null)
    router.push(link)
  }

  const handleMarkAllAsRead = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
    }
  }

  const getRelativeTime = (dateStr: string) => {
    let normalized = dateStr
    if (dateStr && !dateStr.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
      normalized = dateStr + "Z"
    }
    const date = new Date(normalized)
    const span = Date.now() - date.getTime()
    const minutes = Math.floor(span / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length

  return (
    <>
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-4 overflow-hidden px-6 bg-background/72 backdrop-blur-xl border-b border-border/70 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex min-w-0 items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <div className="relative hidden min-w-0 md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, tasks, team..."
            className="w-80 max-w-[min(20rem,40vw)] pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeSwitcher />

        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="w-5 h-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs text-primary hover:text-primary/80">
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleOpenNotification(notification)}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-[#00dfc0] rounded-full" />
                      )}
                      <span className="font-semibold text-sm text-white">{notification.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-zinc-500">{getRelativeTime(notification.createdAt)}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <Dialog
      open={selectedNotification !== null}
      onOpenChange={(open) => !open && setSelectedNotification(null)}
    >
      <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-start gap-3 text-xl leading-snug">
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            {selectedNotification?.title}
          </DialogTitle>
          <DialogDescription className="pl-5 text-xs text-zinc-500">
            {selectedNotification ? getRelativeTime(selectedNotification.createdAt) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900/45 p-5">
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">
            {selectedNotification?.message}
          </p>
        </div>

        <DialogFooter className="border-t border-zinc-800 pt-4">
          <Button variant="outline" onClick={() => setSelectedNotification(null)}>
            Close
          </Button>
          {selectedNotification?.link && (
            <Button onClick={handleOpenRelatedWork} className="gap-2 font-semibold">
              Open Related Work
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
