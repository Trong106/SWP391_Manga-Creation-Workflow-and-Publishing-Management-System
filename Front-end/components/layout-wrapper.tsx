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

  // Chuyển hướng người dùng dựa trên trạng thái đăng nhập
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !isLoginPage) {
        router.push("/login")
      } else if (isAuthenticated && isLoginPage) {
        router.push("/")
      }
    }
  }, [isAuthenticated, loading, isLoginPage, router])

  // Hiển thị vòng xoay tải trang khi đang xác thực JWT ở lần đầu tải trang
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading MangaFlow...</p>
        </div>
      </div>
    )
  }

  // Nếu chưa đăng nhập hoặc đang ở trang đăng nhập, hiển thị giao diện thuần (không có Sidebar/Header)
  if (isLoginPage || !isAuthenticated) {
    return <main className="w-full min-h-screen bg-background">{children}</main>
  }

  // Khi đang ở trang đọc truyện, hiển thị giao diện đọc truyện thuần (không có Sidebar/Header)
  if (pathname?.startsWith("/chapters")) {
    return <main className="w-full min-h-screen bg-[#0B0C0D]">{children}</main>
  }

  // Khi đã đăng nhập, hiển thị giao diện Dashboard hoàn chỉnh kèm Sidebar & TopHeader
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <div className="flex-1 lg:ml-64 transition-all duration-300">
        <TopHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
