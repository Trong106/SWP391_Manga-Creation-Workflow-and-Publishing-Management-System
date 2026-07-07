"use client"

import { Check, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themeOptions = [
  {
    name: "dark",
    label: "Dark",
    description: "Professional dark mode",
    swatches: ["#0d1118", "#2dd4bf", "#a78bfa"],
  },
  {
    name: "white",
    label: "White",
    description: "Clean readable light mode",
    swatches: ["#ffffff", "#111827", "#d85c9f"],
  },
  {
    name: "nocturne",
    label: "Nocturne",
    description: "Deep studio focus",
    swatches: ["#0d1118", "#2dd4bf", "#c084fc"],
  },
  {
    name: "sakura",
    label: "Sakura",
    description: "Soft daylight calm",
    swatches: ["#f8f3ee", "#e879a6", "#2f6f73"],
  },
  {
    name: "aurora",
    label: "Aurora",
    description: "Clean editorial energy",
    swatches: ["#071514", "#2ee8bd", "#f5c86a"],
  },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative overflow-hidden">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Interface theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((option) => {
          const selected = theme === option.name

          return (
            <DropdownMenuItem
              key={option.name}
              onClick={() => setTheme(option.name)}
              className="flex cursor-pointer items-center gap-3 py-3"
            >
              <div className="flex -space-x-1">
                {option.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className="h-5 w-5 rounded-full border border-background shadow-sm"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-none">{option.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
              </div>
              <Check className={cn("h-4 w-4 text-primary opacity-0", selected && "opacity-100")} />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
