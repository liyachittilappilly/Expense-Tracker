"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarIcon,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Edit,
  Trash2,
  Loader2,
  MoreHorizontal,
  CreditCard,
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserNav } from "@/components/user-nav"
import { AIComponent } from "@/components/ai-component"
import { useAuth } from "@/context/auth-context"
import { motion } from "framer-motion"

interface Transaction {
  id: string
  amount: number
  category: string
  date: Date
  note: string
  type: "income" | "expense"
}

interface UserData {
  email: string
  name: string
  provider?: string
}

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Income",
  "Other",
]

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
]

export default function ExpenseTracker() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    date: new Date(),
    note: "",
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [insights, setInsights] = useState<string>("")
  const [selectedChartData, setSelectedChartData] = useState<{
    type: "bar" | "pie"
    category: string
    amount: number
    transactions: Transaction[]
  } | null>(null)

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/transactions')
      const data = await res.json()
      // Ensure date objects are correctly parsed
      setTransactions(data.map((tx: any) => ({ ...tx, date: new Date(tx.date) })))
    } catch (error) {
      console.error("Failed to fetch transactions", error)
    } finally {
      setIsLoading(false)
    }
  };

  // Handle mounting and authentication
  useEffect(() => {
    setMounted(true)
    if (!loading && !user) {
      router.push("/auth/signin")
    } else if (user) {
      fetchTransactions()
    }
  }, [user, loading, router])

  // Calculate totals
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpenses

  // Prepare chart data
  const categoryData = categories
    .map((category) => {
      const amount = transactions
        .filter((t) => t.category === category && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)
      return {
        category: category.length > 12 ? category.substring(0, 12) + "..." : category,
        amount,
        fullName: category,
      }
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const pieData = categoryData.map((item, index) => ({
    ...item,
    fill: chartColors[index % chartColors.length],
  }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || !formData.category) return

    const amount = Number.parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) return

    const type = formData.category === "Income" ? "income" : "expense"

    const transactionData = {
      amount,
      category: formData.category,
      date: formData.date,
      note: formData.note,
      type,
    }

    if (editingId) {
      await fetch(`/api/transactions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      })
      setEditingId(null)
    } else {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      })
    }
    
    fetchTransactions() // Refetch data after add/edit
    setFormData({ amount: "", category: "", date: new Date(), note: "" })
  }

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      amount: transaction.amount.toString(),
      category: transaction.category,
      // Ensure date is a Date object for the calendar
      date: new Date(transaction.date),
      note: transaction.note,
    })
    setEditingId(transaction.id)
    // Scroll to form
    document.getElementById("transaction-form")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete transaction');
      }

      fetchTransactions(); // Refetch data only after successful delete
    } catch (error) {
      console.error(error);
      // Optionally, show an error message to the user
      alert("Error: Could not delete the transaction.");
    }
  }

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to delete all transactions? This action cannot be undone.")) {
      try {
        const res = await fetch('/api/transactions/all', {
          method: 'DELETE',
        });
        if (!res.ok) {
          throw new Error('Failed to clear transactions');
        }
        fetchTransactions();
      } catch (error) {
        console.error(error);
        alert("Error: Could not clear all transactions.");
      }
    }
  }

  const exportTransactionsCSV = () => {
    if (transactions.length === 0) {
      alert("No transactions to export")
      return
    }

    // Prepare data for CSV export
    const csvData = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date (newest first)
      .map((transaction) => ({
        Date: format(new Date(transaction.date), "yyyy-MM-dd"),
        Category: transaction.category,
        Type: transaction.type === "income" ? "Income" : "Expense",
        Amount: transaction.amount.toFixed(2),
        Note: transaction.note || "",
      }))

    // Convert to CSV format
    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(","), // Header row
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in values
            return typeof value === "string" && (value.includes(",") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value
          })
          .join(","),
      ),
    ].join("\n")

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `expense-tracker-${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const loadAIInsights = async () => {
    setIsLoadingInsights(true)
    setInsights("")

    try {
      const res = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: "Based on all the transactions, provide some analysis and insights into my spending habits. Give me some tips to save money." }),
      });
      const data = await res.json();
      setInsights(data.response);
    } catch (error) {
      console.error("Failed to fetch AI insights", error);
      setInsights("Sorry, I couldn't generate insights at the moment. Please try again later.");
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const handleChartClick = (data: any, chartType: "bar" | "pie") => {
    const category = chartType === "bar" ? data.fullName : data.category
    const categoryTransactions = transactions.filter((t) => t.category === category && t.type === "expense")

    setSelectedChartData({
      type: chartType,
      category,
      amount: data.amount,
      transactions: categoryTransactions,
    })
  }

  if (loading || !user || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto p-4 space-y-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          variants={animationVariants}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expense Tracker</h1>
            <p className="text-muted-foreground">Welcome back, {user.displayName || user.email}!</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportTransactionsCSV} disabled={transactions.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <UserNav />
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.1 }}
          variants={animationVariants}
          className="grid gap-4 md:grid-cols-3"
        >
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", balance >= 0 ? "text-green-600" : "text-red-600")}>
                ${balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Transaction Form */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.2 }}
          variants={animationVariants}
        >
          <Card id="transaction-form" className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingId ? "Edit Transaction" : "Add Transaction"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData((prev) => ({ ...prev, date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    placeholder="Add a note (optional)"
                    value={formData.note}
                    onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Update Transaction" : "Add Transaction"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      setEditingId(null)
                      setFormData({ amount: "", category: "", date: new Date(), note: "" })
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.3 }}
          variants={animationVariants}
        >
          <Card id="ai-insights" className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>Powered by Gemini API - Get personalized financial insights</CardDescription>
                </div>
                <Button onClick={loadAIInsights} disabled={isLoadingInsights} variant="outline">
                  {isLoadingInsights ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Insights"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-6 text-center min-h-[120px] flex items-center justify-center">
                {isLoadingInsights ? (
                  <div className="space-y-3 w-full">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                      <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
                    </div>
                    <p className="text-sm text-muted-foreground">Analyzing your spending patterns...</p>
                  </div>
                ) : insights ? (
                  <p className="text-sm whitespace-pre-wrap">{insights}</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      AI insights will appear here based on your spending patterns
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click "Generate Insights" to get personalized recommendations
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.4 }}
          variants={animationVariants}
          className="grid gap-6 lg:grid-cols-2"
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Expense by Category</CardTitle>
              <CardDescription>Your spending breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ChartContainer
                  config={{
                    amount: {
                      label: "Amount ($)",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(label) => {
                          const item = categoryData.find((d) => d.category === label)
                          return item?.fullName || label
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                        onClick={(data) => handleChartClick(data, "bar")}
                        style={{ cursor: "pointer" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No expense data to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Percentage breakdown of your expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ChartContainer
                  config={{
                    amount: {
                      label: "Amount ($)",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="amount"
                        label={({ category, percent }) => `${category} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                        onClick={(data) => handleChartClick(data, "pie")}
                        style={{ cursor: "pointer" }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(label) => {
                          const item = pieData.find((d) => d.category === label)
                          return item?.fullName || label
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <p>No expense data to display</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Table */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.5 }}
          variants={animationVariants}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>All your transactions in one place</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={handleClearAll} className="text-red-600">
                      Clear All Transactions
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Date</TableHead>
                          <TableHead className="min-w-[120px]">Category</TableHead>
                          <TableHead className="min-w-[150px]">Note</TableHead>
                          <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                          <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{format(new Date(transaction.date), "MMM dd, yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant={transaction.type === "income" ? "default" : "secondary"}>
                                {transaction.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <div className="truncate" title={transaction.note}>
                                {transaction.note || "-"}
                              </div>
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-medium",
                                transaction.type === "income" ? "text-green-600" : "text-red-600",
                              )}
                            >
                              {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(transaction)}>
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit transaction</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(transaction.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete transaction</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No transactions yet. Add your first transaction above!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart Details Modal */}
        <Dialog open={!!selectedChartData} onOpenChange={() => setSelectedChartData(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor:
                      selectedChartData?.type === "pie"
                        ? pieData.find(
                            (d) =>
                              d.category === selectedChartData.category || d.fullName === selectedChartData.category,
                          )?.fill
                        : "hsl(var(--chart-1))",
                  }}
                />
                {selectedChartData?.category} - Detailed View
              </DialogTitle>
              <DialogDescription>
                Total spent: <span className="font-semibold text-red-600">${selectedChartData?.amount.toFixed(2)}</span>{" "}
                ({selectedChartData?.transactions.length} transactions)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">${selectedChartData?.amount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{selectedChartData?.transactions.length}</div>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      $
                      {selectedChartData && selectedChartData.transactions.length > 0
                        ? (selectedChartData.amount / selectedChartData.transactions.length).toFixed(2)
                        : "0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {totalExpenses > 0 && selectedChartData ? ((selectedChartData.amount / totalExpenses) * 100).toFixed(1) : "0"}%
                    </div>
                    <p className="text-xs text-muted-foreground">of Total Expenses</p>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">All Transactions</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedChartData?.transactions
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">{format(new Date(transaction.date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-medium text-red-600">${transaction.amount.toFixed(2)}</TableCell>
                            <TableCell className="max-w-[300px]">
                              <div className="truncate" title={transaction.note}>
                                {transaction.note || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    handleEdit(transaction)
                                    setSelectedChartData(null)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    handleDelete(transaction.id)
                                    setSelectedChartData(null)
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ask the AI Assistant */}
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.6 }}
          variants={animationVariants}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Ask the AI Assistant</CardTitle>
              <CardDescription>
                Ask questions about your expenses and get instant insights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIComponent />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}