"use client"

import { useAuth } from "@/lib/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { TopHeader } from "@/components/top-header"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === "/login"

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isLoginPage) {
        router.push("/login")
      } else if (isAuthenticated && isLoginPage) {
        router.push("/")
      }
    }
  }, [isAuthenticated, loading, isLoginPage, router])

  if (loading) {
    return (
      <div className="app-background flex h-screen w-screen items-center justify-center">
        <div className="surface-glass flex flex-col items-center gap-4 rounded-xl px-10 py-8">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading MangaCreation...</p>
        </div>
      </div>
    )
  }

  if (isLoginPage || !isAuthenticated) {
    return <main className="app-background w-full min-h-screen">{children}</main>
  }

  if (pathname?.startsWith("/chapters")) {
    return <main className="w-full min-h-screen bg-[#0B0C0D]">{children}</main>
  }

  return (
    <div className="app-background flex min-h-screen overflow-x-hidden">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <div className="min-w-0 w-full transition-all duration-300 lg:ml-64 lg:w-[calc(100%-16rem)]">
        <TopHeader />
        <main className="relative z-10 min-w-0 overflow-x-hidden p-6 page-enter">{children}</main>
      </div>
    </div>
  )
}
