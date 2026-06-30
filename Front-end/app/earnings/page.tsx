"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { API_BASE_URL } from "@/lib/api-config"
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, ShieldAlert, FileSpreadsheet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface PayrollRecord {
  payrollRecordId: string
  assistantId: string
  assistantName: string
  periodStart: string
  periodEnd: string
  baseAmount: number
  bonusAmount: number
  deductionAmount: number
  totalAmount: number
  status: string
  paidAt: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: "Pending Approval",
    color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    icon: Clock,
  },
  paid: {
    label: "Paid",
    color: "bg-green-500/20 text-green-400 border border-green-500/30",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/20 text-red-400 border border-red-500/30",
    icon: AlertCircle,
  },
}

export default function AssistantEarningsPage() {
  const { user, role, token } = useAuth()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || role !== "assistant") return

    fetch(`${API_BASE_URL}/api/payroll/my-payroll`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch payroll records")
        return res.json()
      })
      .then((data) => {
        setRecords(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading payroll records:", err)
        setLoading(false)
      })
  }, [token, role])

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A"
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-72 bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full bg-zinc-800" />
      </div>
    )
  }

  if (role !== "assistant") {
    return (
      <Card className="bg-destructive/10 border-destructive/20 max-w-md mx-auto mt-12 text-white">
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-destructive" />
          <div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription className="text-zinc-400">Only studio assistants can view this page.</CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  // Financial status computations
  const paidRecords = records.filter(r => r.status.toLowerCase() === "paid")
  const pendingRecords = records.filter(r => r.status.toLowerCase() === "pending" || r.status.toLowerCase() === "processing")

  const totalEarned = paidRecords.reduce((sum, r) => sum + r.totalAmount, 0)
  const pendingPayment = pendingRecords.reduce((sum, r) => sum + r.totalAmount, 0)

  const thisMonthEarned = paidRecords.reduce((sum, r) => {
    try {
      const createdDate = new Date(r.createdAt)
      const now = new Date()
      if (createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()) {
        return sum + r.totalAmount
      }
    } catch {}
    return sum
  }, 0)

  const completedTasksCount = records.length

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            My Earnings
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your payroll records and payout history
          </p>
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-3xl font-bold mt-1">¥{totalEarned.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">All time</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payment</p>
                <p className="text-3xl font-bold mt-1">¥{pendingPayment.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-warning">Awaiting approval</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-warning/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold mt-1">¥{thisMonthEarned.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">Current Cycle</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Records</p>
                <p className="text-3xl font-bold mt-1">{completedTasksCount}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-muted-foreground">Processed tasks</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-warning" />
            Awaiting Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRecords.length === 0 ? (
            <p className="text-sm text-zinc-500 py-2">No pending payments.</p>
          ) : (
            <div className="space-y-3">
              {pendingRecords.map((rec) => {
                const status = rec.status.toLowerCase()
                const config = statusConfig[status] || { label: rec.status, color: "bg-zinc-800 text-zinc-300", icon: Clock }
                const IconComponent = config.icon

                return (
                  <div
                    key={rec.payrollRecordId}
                    className="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-850 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold text-zinc-200">Task Payment Record</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Period: {formatDate(rec.periodStart)} - {formatDate(rec.periodEnd)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-extrabold text-warning">¥{rec.totalAmount.toLocaleString()}</span>
                      <Badge className={config.color}>
                        <IconComponent className="w-3.5 h-3.5 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History Section */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paidRecords.length === 0 ? (
            <p className="text-sm text-zinc-500 py-2">No past payments recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Date Paid</TableHead>
                  <TableHead className="text-zinc-400">Period</TableHead>
                  <TableHead className="text-zinc-400">Base Amount</TableHead>
                  <TableHead className="text-zinc-400 font-bold text-zinc-300">Total Amount</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidRecords.map((rec) => (
                  <TableRow key={rec.payrollRecordId} className="border-zinc-800 hover:bg-zinc-900/20">
                    <TableCell>{formatDate(rec.paidAt)}</TableCell>
                    <TableCell>
                      {formatDate(rec.periodStart)} - {formatDate(rec.periodEnd)}
                    </TableCell>
                    <TableCell className="text-zinc-300">¥{rec.baseAmount.toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-primary">¥{rec.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Paid
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
