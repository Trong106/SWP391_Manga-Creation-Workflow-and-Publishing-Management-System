"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ThemeSwitcher } from "@/components/theme-switcher"

const demoUsers = [
  { role: "mangaka", name: "Yuki Tanaka (Mangaka)", email: "yuki@mangaflow.com", color: "border-primary text-primary" },
  { role: "assistant", name: "Kenji Yamamoto (Assistant)", email: "kenji@mangaflow.com", color: "border-chart-3 text-chart-3" },
  { role: "tantou", name: "Sakura Ito (Tantou Editor)", email: "sakura@mangaflow.com", color: "border-chart-2 text-chart-2" },
  { role: "editorial", name: "Takeshi Sato (Editorial Board)", email: "takeshi@mangaflow.com", color: "border-chart-5 text-chart-5" },
]

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const success = await login(email, password)
    if (success) {
      router.push("/")
    } else {
      setError("Incorrect email or password. Please try again.")
      setLoading(false)
    }
  }

  // Hàm điền nhanh thông tin tài khoản mẫu
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("123456")
  }

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute right-5 top-5 z-20">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-[480px] z-10 space-y-6">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <Image
            src="/logo.png"
            alt="MangaFlow Logo"
            width={64}
            height={64}
            className="rounded-xl object-contain drop-shadow-[0_0_18px_rgba(0,200,180,0.35)]"
          />
          <h2 className="text-3xl font-bold tracking-tight text-foreground mt-3">MangaFlow</h2>
          <p className="text-muted-foreground text-sm">Professional Manga Production Workflow Management System</p>
        </div>

        {/* Login Card */}
        <Card className="surface-glass shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-foreground">Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/15 border border-destructive/25 text-destructive rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/82">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="yuki@mangaflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-input/70 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/82">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 bg-input/70 border-border/80 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border/80"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase tracking-widest font-mono">Demo Accounts</span>
              <div className="flex-grow border-t border-border/80"></div>
            </div>

            {/* Quick Demo Login Grid */}
            <div className="grid grid-cols-1 gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleQuickLogin(user.email)}
                  className="group flex items-center justify-between rounded-lg border border-border/80 bg-secondary/35 p-2.5 text-left text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-secondary/60"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground/82 transition-colors group-hover:text-foreground">{user.name}</span>
                    <span className="text-muted-foreground">{user.email}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] uppercase font-mono px-2 py-0.5 ${user.color}`}>
                    Quick Select
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
