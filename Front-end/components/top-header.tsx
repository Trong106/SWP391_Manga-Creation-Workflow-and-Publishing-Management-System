"use client"

import { Search, Bell, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AppSidebar } from "./app-sidebar"

const mockNotifications = [
  {
    id: "1",
    title: "New task assigned",
    message: "Chapter 45 - Background art needs completion",
    time: "5 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "Review requested",
    message: "Kenji submitted pages for Chapter 44",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: "3",
    title: "Payment processed",
    message: "Your payment of $350 has been sent",
    time: "2 hours ago",
    unread: false,
  },
]

export function TopHeader() {
  const unreadCount = mockNotifications.filter((n) => n.unread).length

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
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

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, tasks, team..."
            className="pl-9 w-80 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search Mobile */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Search className="w-5 h-5" />
        </Button>

        {/* Notifications */}
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
              <Button variant="ghost" size="sm" className="text-xs text-primary">
                Mark all read
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {mockNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  {notification.unread && (
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  )}
                  <span className="font-medium text-sm">{notification.title}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {notification.message}
                </p>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
