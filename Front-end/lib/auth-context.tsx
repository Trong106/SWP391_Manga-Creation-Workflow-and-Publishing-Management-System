"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "@/lib/types"

import { API_BASE_URL, readJson } from "@/lib/api-config"

// Thông tin tài khoản mẫu
const mockUsers: Record<UserRole, { name: string; email: string; avatar: string; id: string }> = {
  mangaka: {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Yuki Tanaka",
    email: "yuki@mangaflow.com",
    avatar: "yuki",
  },
  assistant: {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Kenji Yamamoto",
    email: "kenji@mangaflow.com",
    avatar: "kenji",
  },
  tantou: {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Sakura Ito",
    email: "sakura@mangaflow.com",
    avatar: "sakura",
  },
  editorial: {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Takeshi Sato",
    email: "takeshi@mangaflow.com",
    avatar: "takeshi",
  },
}

interface AuthContextType {
  user: User | null
  role: UserRole
  setRole: (role: UserRole) => void
  isAuthenticated: boolean
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("mangaka")
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Khôi phục phiên đăng nhập từ LocalStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("auth_role") as UserRole | null
    const savedToken = localStorage.getItem("auth_token")
    const savedUser = localStorage.getItem("auth_user")
    if (savedRole && savedToken && savedUser) {
      try {
        setRoleState(savedRole)
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem("auth_role")
        localStorage.removeItem("auth_token")
        localStorage.removeItem("auth_user")
      }
    }
    setLoading(false)
  }, [])

  // Hàm gọi API Đăng nhập thật ở Backend
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await readJson<any>(res)
        if (!data?.token) return { success: false, error: "Invalid token response from server." }
        setToken(data.token)
        
        const backendRole = data.role.toLowerCase() as UserRole
        setRoleState(backendRole)
        
        const mockDetail = mockUsers[backendRole] || { avatar: backendRole, id: data.userId }
        const loggedUser: User = {
          id: data.userId,
          name: data.fullName,
          email: data.email,
          avatar: mockDetail.avatar,
          role: backendRole,
        }
        setUser(loggedUser)
        
        localStorage.setItem("auth_role", backendRole)
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("auth_user", JSON.stringify(loggedUser))
        return { success: true }
      }

      // Try to parse the specific error message from the backend
      try {
        const errorData = await readJson<any>(res)
        if (errorData?.message) {
          return { success: false, error: errorData.message }
        }
      } catch {}

      return { success: false, error: "Incorrect email or password. Please try again." }
    } catch (err) {
      console.error("Login failed:", err)
      return { success: false, error: "Unable to connect to the server. Please check your internet connection." }
    }
  }

  // Đăng xuất và xóa session
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_role")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
  }

  // Hỗ trợ đổi nhanh vai trò (Demo Switcher) bằng cách đăng nhập ngầm tài khoản tương ứng
  const setRole = async (newRole: UserRole) => {
    const mockUser = mockUsers[newRole]
    await login(mockUser.email, "123456")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        isAuthenticated: !!token,
        token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
