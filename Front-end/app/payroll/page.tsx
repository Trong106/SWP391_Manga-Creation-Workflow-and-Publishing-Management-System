"use client"

import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/api-config"
import { useAuth } from "@/lib/auth-context"
import {
  DollarSign,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  Filter,
  Search,
  MoreVertical,
  FileText,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PayrollEntry {
  id: string
  assistantId: string
  assistantName: string
  assistantAvatar: string
  role: string
  period: string
  tasksCompleted: number
  pagesCompleted: number
  baseRate: number
  bonuses: number
  deductions: number
  totalAmount: number
  status: "pending" | "processing" | "paid" | "failed"
  paidDate?: string
}

interface AssistantSummary {
  id: string
  name: string
  avatar: string
  role: string
  totalEarned: number
  pendingAmount: number
  tasksThisMonth: number
  rating: number
}

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500/20 text-yellow-400",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-500/20 text-blue-400",
    icon: Clock,
  },
  paid: {
    label: "Paid",
    color: "bg-green-500/20 text-green-400",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/20 text-red-400",
    icon: AlertCircle,
  },
}

export default function PayrollPage() {
  const { token, role } = useAuth()
  const [payroll, setPayroll] = useState<PayrollEntry[]>([])
  const [assistantSummaries, setAssistantSummaries] = useState<AssistantSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false)

  useEffect(() => {
    if (!token) return

    fetch(`${API_BASE_URL}/api/data/payroll`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPayroll(data)
          
          // Group by assistantId to compute assistantSummaries
          const summariesMap: Record<string, AssistantSummary> = {}
          data.forEach((entry: any) => {
            const aid = entry.assistantId
            if (!summariesMap[aid]) {
              summariesMap[aid] = {
                id: aid,
                name: entry.assistantName,
                avatar: entry.assistantAvatar,
                role: entry.role,
                totalEarned: 0,
                pendingAmount: 0,
                tasksThisMonth: 0,
                rating: 4.8, // default rating
              }
            }
            if (entry.status === "paid") {
              summariesMap[aid].totalEarned += entry.totalAmount
            } else if (entry.status === "pending" || entry.status === "processing") {
              summariesMap[aid].pendingAmount += entry.totalAmount
            }
            summariesMap[aid].tasksThisMonth += entry.tasksCompleted || 0
          })
          setAssistantSummaries(Object.values(summariesMap))
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching payroll data:", err)
        setLoading(false)
      })
  }, [token])

  const totalPending = payroll
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((acc, p) => acc + p.totalAmount, 0)

  const totalPaidThisMonth = payroll
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.totalAmount, 0)

  const pendingCount = payroll.filter(
    (p) => p.status === "pending" || p.status === "processing"
  ).length
  const isAssistant = role === "assistant"

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  const handleSelectAll = () => {
    const pendingIds = payroll
      .filter((p) => p.status === "pending")
      .map((p) => p.id)
    if (selectedEntries.length === pendingIds.length) {
      setSelectedEntries([])
    } else {
      setSelectedEntries(pendingIds)
    }
  }

  const handleSelect = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            {isAssistant ? "My Earnings" : "Payroll Management"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAssistant
              ? "Track your approved payouts, pending earnings, and payment history"
              : "Manage payments for your studio assistants"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {!isAssistant && (
            <Button
              onClick={() => setIsPayDialogOpen(true)}
              disabled={selectedEntries.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Process Payment ({selectedEntries.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-muted-foreground">{isAssistant ? "Pending Earnings" : "Pending Payments"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPaidThisMonth)}</p>
                <p className="text-xs text-muted-foreground">Paid This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assistantSummaries.length}</p>
                <p className="text-xs text-muted-foreground">{isAssistant ? "Payout Sources" : "Active Assistants"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payroll">Payroll History</TabsTrigger>
          {!isAssistant && <TabsTrigger value="assistants">Assistant Summary</TabsTrigger>}
        </TabsList>

        <TabsContent value="payroll" className="space-y-4">
          {/* Filters */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by assistant name..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="current">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Jan 1-15, 2024</SelectItem>
                    <SelectItem value="prev">Dec 16-31, 2023</SelectItem>
                    <SelectItem value="prev2">Dec 1-15, 2023</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Table */}
          <Card className="bg-card/50 border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  {!isAssistant && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedEntries.length ===
                          payroll.filter((p) => p.status === "pending").length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-border"
                      />
                    </TableHead>
                  )}
                  <TableHead>Assistant</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-center">Tasks</TableHead>
                  <TableHead className="text-center">Pages</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  {!isAssistant && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAssistant ? 8 : 10} className="text-center py-8 text-zinc-400">
                      Loading payroll records from database...
                    </TableCell>
                  </TableRow>
                ) : payroll.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAssistant ? 8 : 10} className="text-center py-8 text-zinc-400">
                      No payroll records found in database.
                    </TableCell>
                  </TableRow>
                ) : (
                  payroll.map((entry) => {
                  const StatusIcon = statusConfig[entry.status].icon
                  return (
                    <TableRow key={entry.id}>
                      {!isAssistant && (
                        <TableCell>
                          {entry.status === "pending" && (
                            <input
                              type="checkbox"
                              checked={selectedEntries.includes(entry.id)}
                              onChange={() => handleSelect(entry.id)}
                              className="rounded border-border"
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${entry.assistantAvatar}`}
                            />
                            <AvatarFallback>{entry.assistantName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{entry.assistantName}</p>
                            <p className="text-xs text-muted-foreground">{entry.role}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{entry.period}</TableCell>
                      <TableCell className="text-center">{entry.tasksCompleted}</TableCell>
                      <TableCell className="text-center">{entry.pagesCompleted}</TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(entry.baseRate)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-green-400">
                        +{formatCurrency(entry.bonuses)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(entry.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[entry.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[entry.status].label}
                        </Badge>
                      </TableCell>
                      {!isAssistant && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Download Invoice</DropdownMenuItem>
                              {entry.status === "pending" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>Process Payment</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                }))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="assistants" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 text-center py-8 text-zinc-400">
                Loading assistant summaries...
              </div>
            ) : assistantSummaries.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-zinc-400">
                No assistants found.
              </div>
            ) : (
              assistantSummaries.map((assistant) => (
              <Card
                key={assistant.id}
                className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/notionists/svg?seed=${assistant.avatar}`}
                      />
                      <AvatarFallback>{assistant.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{assistant.name}</h3>
                          <p className="text-sm text-muted-foreground">{assistant.role}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {assistant.rating} rating
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-lg font-bold text-green-400">
                            {formatCurrency(assistant.totalEarned)}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Earned</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-yellow-400">
                            {formatCurrency(assistant.pendingAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{assistant.tasksThisMonth}</p>
                          <p className="text-xs text-muted-foreground">Tasks/Month</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payments</DialogTitle>
            <DialogDescription>
              You are about to process {selectedEntries.length} payment(s) totaling{" "}
              {formatCurrency(
                payroll
                  .filter((p) => selectedEntries.includes(p.id))
                  .reduce((acc, p) => acc + p.totalAmount, 0)
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {payroll
                .filter((p) => selectedEntries.includes(p.id))
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${entry.assistantAvatar}`}
                        />
                        <AvatarFallback>{entry.assistantName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{entry.assistantName}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(entry.totalAmount)}</span>
                  </div>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsPayDialogOpen(false)}>
              <Send className="w-4 h-4 mr-2" />
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
