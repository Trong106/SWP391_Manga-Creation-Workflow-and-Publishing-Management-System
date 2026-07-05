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
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-[#09090b] overflow-hidden px-4">
      {/* Background Decorative Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-chart-2/10 blur-[150px] pointer-events-none"></div>

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
          <h2 className="text-3xl font-bold tracking-tight text-white mt-3">MangaFlow</h2>
          <p className="text-muted-foreground text-sm">Professional Manga Production Workflow Management System</p>
        </div>

        {/* Login Card */}
        <Card className="bg-zinc-900/60 border-zinc-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold text-white">Sign In</CardTitle>
            <CardDescription className="text-zinc-400">
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
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="yuki@mangaflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-600 focus-visible:ring-primary"
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
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-xs text-zinc-500 uppercase tracking-widest font-mono">Demo Accounts</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            {/* Quick Demo Login Grid */}
            <div className="grid grid-cols-1 gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => handleQuickLogin(user.email)}
                  className="flex items-center justify-between p-2.5 bg-zinc-950/20 hover:bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 rounded-lg text-left text-xs transition-all group"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">{user.name}</span>
                    <span className="text-zinc-500">{user.email}</span>
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
