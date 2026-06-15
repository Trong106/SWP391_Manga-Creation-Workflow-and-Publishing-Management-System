"use client"

import { DollarSign, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

const earningsData = {
  totalEarned: 2450,
  pendingPayment: 480,
  thisMonth: 850,
  completedTasks: 12,
}

const paymentHistory = [
  { id: "1", date: "May 15", amount: 350, tasks: 2, status: "paid" },
  { id: "2", date: "May 8", amount: 420, tasks: 3, status: "paid" },
  { id: "3", date: "May 1", amount: 280, tasks: 2, status: "paid" },
  { id: "4", date: "Apr 24", amount: 550, tasks: 4, status: "paid" },
]

const pendingPayments = [
  { id: "1", task: "Chapter 45 - Background Art", series: "Dragon Hunters", amount: 180, status: "pending" },
  { id: "2", task: "Chapter 12 - Coloring", series: "Night Bloom", amount: 300, status: "pending" },
]

export function AssistantEarnings() {
  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-3xl font-bold mt-1">${earningsData.totalEarned}</p>
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
                <p className="text-3xl font-bold mt-1">${earningsData.pendingPayment}</p>
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
                <p className="text-3xl font-bold mt-1">${earningsData.thisMonth}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm text-success">+15%</span>
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
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
                <p className="text-3xl font-bold mt-1">{earningsData.completedTasks}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-sm text-muted-foreground">This month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-warning" />
            Pending Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{payment.task}</h4>
                  <p className="text-sm text-muted-foreground">{payment.series}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-warning">${payment.amount}</span>
                  <Badge className="bg-warning/20 text-warning">Pending</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment History</CardTitle>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.tasks} tasks</TableCell>
                  <TableCell className="font-medium">${payment.amount}</TableCell>
                  <TableCell>
                    <Badge className="bg-success/20 text-success">Paid</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
