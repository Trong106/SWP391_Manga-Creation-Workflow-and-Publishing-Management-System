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
  const [showErrorModal, setShowErrorModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;

    // Validate email
    if (!email.trim()) {
      if (emailInput) {
        emailInput.setCustomValidity("Email is required.");
        emailInput.reportValidity();
      }
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      if (emailInput) {
        emailInput.setCustomValidity("Please enter a valid email address.");
        emailInput.reportValidity();
      }
      return;
    }
    if (emailInput) emailInput.setCustomValidity("");

    // Validate password
    if (!password) {
      if (passwordInput) {
        passwordInput.setCustomValidity("Password is required.");
        passwordInput.reportValidity();
      }
      return;
    }
    if (passwordInput) passwordInput.setCustomValidity("");

    setLoading(true)

    try {
      const result = await login(email, password)
      
      // Handle both object and boolean return values for safety/caching
      const isSuccess = typeof result === "boolean" ? result : (result && result.success);
      let errorMessage = typeof result === "object" && result && result.error 
        ? result.error 
        : "Incorrect email or password. Please try again.";

      if (isSuccess) {
        router.push("/")
      } else {
        setError(errorMessage)
        setShowErrorModal(true)
      }
    } catch (err: any) {
      console.error("Login submit error:", err)
      setError("An unexpected error occurred. Please try again.")
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  // Fill a demo account quickly.
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("123456")

    // Clear custom validity on DOM elements so form submission is not blocked
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    if (emailInput) emailInput.setCustomValidity("");
    if (passwordInput) passwordInput.setCustomValidity("");
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
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/82">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="yuki@mangaflow.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      const emailInput = document.getElementById("email") as HTMLInputElement;
                      if (emailInput) emailInput.setCustomValidity("");
                    }}
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      const passwordInput = document.getElementById("password") as HTMLInputElement;
                      if (passwordInput) passwordInput.setCustomValidity("");
                    }}
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

      {/* Error Modal Overlay */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-[#121214] border border-[#2d2d30] rounded-2xl p-6 max-w-[360px] w-full shadow-[0_0_50px_0_rgba(0,0,0,0.8)] animate-in zoom-in-95 fade-in duration-200 text-center relative">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Login Failed</h3>
            <p className="text-sm text-neutral-400 mb-6 leading-relaxed px-2">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-150 cursor-pointer text-sm shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
