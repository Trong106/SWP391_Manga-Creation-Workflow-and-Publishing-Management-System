"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CalendarDays, Eye, Loader2, ShieldAlert, Wallet } from "lucide-react"

import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

type PayrollTask = {
  taskId: string
  taskName: string
  taskType?: string | null
  pageNumber?: number | null
  status: "Approved" | "Submitted" | "Revision Required" | string
  submittedAt: string
  approvedDate?: string | null
  payment: number
}

type PayrollMonth = {
  month: string
  year: number
  monthNumber: number
  completedTasks: number
  approvedTasks: number
  monthlyIncome: number
  tasks: PayrollTask[]
}

const statusStyle: Record<string, string> = {
  Approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  Submitted: "border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
  "Revision Required": "border-orange-500/30 bg-orange-500/15 text-orange-300",
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
  const [months, setMonths] = useState<PayrollMonth[]>([])
  const [selectedMonth, setSelectedMonth] = useState<PayrollMonth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || role !== "assistant") {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`${API_BASE_URL}/api/payroll/my-payroll/monthly`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load payroll data")
        return res.json()
      })
      .then((data) => setMonths(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error loading monthly payroll:", err)
        setError("Could not load your payroll data.")
      })
      .finally(() => setLoading(false))
  }, [role, token])

  const formatCurrency = (value: number) => `$${Number(value || 0).toLocaleString()}`

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTaskName = (task: PayrollTask) => {
    if (task.taskName) return task.taskName
    return taskLabels[task.taskType ?? ""] ?? "Task"
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 bg-zinc-800" />
          <Skeleton className="h-4 w-80 bg-zinc-800" />
        </div>
        <Skeleton className="h-80 bg-zinc-800" />
      </div>
    )
  }

  if (role !== "assistant") {
    return (
      <Card className="mx-auto mt-12 max-w-md border-destructive/20 bg-destructive/10 text-white">
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription className="text-zinc-400">
              Payroll is available to assistants only.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Wallet className="h-6 w-6 text-primary" />
          My Payroll
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monthly task submissions, approved work, and earned payment.
        </p>
      </div>

      {error && (
        <Card className="border-destructive/20 bg-destructive/10">
          <CardContent className="flex items-center gap-2 p-4 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Monthly Payroll
          </CardTitle>
          <CardDescription>
            Approved tasks are counted only when the task is paid by a valid payroll record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No payroll data yet. Submitted tasks will appear here by month.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Month</TableHead>
                  <TableHead className="text-right text-zinc-400">Completed Tasks</TableHead>
                  <TableHead className="text-right text-zinc-400">Approved Tasks</TableHead>
                  <TableHead className="text-right text-zinc-400">Income</TableHead>
                  <TableHead className="text-right text-zinc-400">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {months.map((month) => (
                  <TableRow key={month.month} className="border-zinc-800 hover:bg-zinc-900/30">
                    <TableCell className="font-medium text-white">{month.month}</TableCell>
                    <TableCell className="text-right text-zinc-300">{month.completedTasks}</TableCell>
                    <TableCell className="text-right text-zinc-300">{month.approvedTasks}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(month.monthlyIncome)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedMonth(month)}
                        className="border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedMonth !== null} onOpenChange={(open) => !open && setSelectedMonth(null)}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto overflow-x-hidden border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>Payroll Detail - {selectedMonth?.month}</DialogTitle>
            <DialogDescription>
              Tasks submitted in this month and their payable status.
            </DialogDescription>
          </DialogHeader>

          {selectedMonth && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-md border border-zinc-800">
                <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,.8fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,.9fr)] gap-2 border-b border-zinc-800 px-4 py-3 text-xs font-medium text-zinc-400 sm:text-sm">
                  <div className="break-words">Task Name</div>
                  <div>Page</div>
                  <div>Status</div>
                  <div className="break-words">Approved Date</div>
                  <div className="break-words text-right">Payment</div>
                </div>
                <div>
                  {selectedMonth.tasks.map((task) => (
                    <div
                      key={task.taskId}
                      className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,.8fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,.9fr)] gap-2 border-b border-zinc-800 px-4 py-3 text-xs last:border-b-0 hover:bg-zinc-900/30 sm:text-sm"
                    >
                      <div className="min-w-0">
                        <p className="break-words font-medium text-white">{formatTaskName(task)}</p>
                        {task.taskType && (
                          <p className="break-words text-xs text-zinc-500">
                            {taskLabels[task.taskType] ?? task.taskType}
                          </p>
                        )}
                      </div>
                      <div className="break-words text-zinc-300">Page {task.pageNumber ?? "?"}</div>
                      <div>
                        <Badge className={`whitespace-normal border ${statusStyle[task.status] ?? "border-zinc-700 bg-zinc-800 text-zinc-300"}`}>
                          {task.status}
                        </Badge>
                      </div>
                      <div className="break-words text-zinc-300">{formatDate(task.approvedDate)}</div>
                      <div className="break-words text-right font-medium text-primary">
                        {formatCurrency(task.payment)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ml-auto w-full max-w-sm space-y-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Completed Tasks</span>
                  <span className="font-semibold text-white">{selectedMonth.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Approved Tasks</span>
                  <span className="font-semibold text-white">{selectedMonth.approvedTasks}</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
                  <span className="text-zinc-400">Monthly Income</span>
                  <span className="font-bold text-primary">{formatCurrency(selectedMonth.monthlyIncome)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
