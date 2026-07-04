"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  ShieldAlert,
} from "lucide-react"

import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  taskId?: string | null
  taskTitle?: string | null
  taskType?: string | null
  seriesTitle?: string | null
  chapterNumber?: number | null
  chapterTitle?: string | null
  pageNumber?: number | null
  periodStart: string
  periodEnd: string
  baseAmount: number
  bonusAmount: number
  deductionAmount: number
  totalAmount: number
  status: string
  paidAt?: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Clock,
  },
  paid: {
    label: "Paid",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: AlertCircle,
  },
}

const taskLabels: Record<string, string> = {
  line_art: "Line Art",
  background: "Background",
  effects: "Effects",
  coloring: "Coloring",
  lettering: "Lettering",
  review: "Review",
}

export default function PayrollPage() {
  const { role, token } = useAuth()
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || role !== "assistant") {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`${API_BASE_URL}/api/payroll/my-payroll`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load payroll records")
        return res.json()
      })
      .then((data) => {
        setRecords(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error("Error loading payroll records:", err)
        setError("Could not load your payroll records.")
      })
      .finally(() => setLoading(false))
  }, [role, token])

  const formatCurrency = (value: number) => `$${Number(value || 0).toLocaleString()}`

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A"
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return dateStr

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const summary = useMemo(() => {
    const pending = records.filter((record) => {
      const status = record.status.toLowerCase()
      return status === "pending" || status === "processing"
    })
    const paid = records.filter((record) => record.status.toLowerCase() === "paid")
    const uniquePages = new Set(
      records
        .filter((record) => record.seriesTitle && record.chapterNumber && record.pageNumber)
        .map((record) => `${record.seriesTitle}-${record.chapterNumber}-${record.pageNumber}`)
    )

    return {
      pendingAmount: pending.reduce((sum, record) => sum + record.totalAmount, 0),
      paidAmount: paid.reduce((sum, record) => sum + record.totalAmount, 0),
      approvedTasks: records.length,
      completedPages: uniquePages.size,
    }
  }, [records])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-80 bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 bg-zinc-800" />
          ))}
        </div>
        <Skeleton className="h-72 bg-zinc-800" />
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
            <CardDescription className="text-zinc-400">
              Payroll is read-only and available to assistants only.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          My Earnings
        </h1>
        <p className="text-muted-foreground mt-1">
          Earnings are added only after Tantou approves the chapter.
        </p>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summary.pendingAmount)}</p>
                <p className="text-xs text-muted-foreground">Pending Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summary.paidAmount)}</p>
                <p className="text-xs text-muted-foreground">Paid Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.approvedTasks}</p>
                <p className="text-xs text-muted-foreground">Approved Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.completedPages}</p>
                <p className="text-xs text-muted-foreground">Pages Credited</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Payroll Records</CardTitle>
          <CardDescription>
            Each row is generated from an approved task inside a Tantou-approved chapter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No payroll records yet. Records will appear after Tantou approves a chapter containing your approved tasks.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Series / Chapter</TableHead>
                  <TableHead className="text-zinc-400">Page</TableHead>
                  <TableHead className="text-zinc-400">Task</TableHead>
                  <TableHead className="text-right text-zinc-400">Base</TableHead>
                  <TableHead className="text-right text-zinc-400">Bonus</TableHead>
                  <TableHead className="text-right text-zinc-400">Total</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const status = record.status.toLowerCase()
                  const config = statusConfig[status] ?? {
                    label: record.status,
                    color: "bg-zinc-800 text-zinc-300 border-zinc-700",
                    icon: Clock,
                  }
                  const StatusIcon = config.icon

                  return (
                    <TableRow key={record.payrollRecordId} className="border-zinc-800 hover:bg-zinc-900/30">
                      <TableCell>
                        <p className="font-medium text-white">{record.seriesTitle ?? "Unknown Series"}</p>
                        <p className="text-xs text-zinc-500">
                          Chapter {record.chapterNumber ?? "?"}
                          {record.chapterTitle ? ` - ${record.chapterTitle}` : ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        Page {record.pageNumber ?? "?"}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-white">{record.taskTitle ?? "Task"}</p>
                        <p className="text-xs text-zinc-500">
                          {taskLabels[record.taskType ?? ""] ?? record.taskType ?? "Unknown type"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right text-zinc-300">
                        {formatCurrency(record.baseAmount)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400">
                        {formatCurrency(record.bonusAmount)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(record.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`border ${config.color}`}>
                          <StatusIcon className="w-3.5 h-3.5 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {formatDate(record.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
