"use client"

import { Search, Bell, Settings, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
            <span className="font-bold text-accent-foreground text-sm">MF</span>
          </div>
          <span className="text-xl font-bold tracking-tight">MangaFlow</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Dashboard</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Projects</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Team</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Assets</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            className="pl-9 w-64 bg-secondary border-border"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=manga" />
              <AvatarFallback>TN</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
