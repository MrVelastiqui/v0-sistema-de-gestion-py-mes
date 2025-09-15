"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Calculator, Download } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"

interface Product {
  id: string
  name: string
  category: string
  price: number
}

interface SaleItem {
  id: string
  quantity: number
  unit_price: number
  subtotal: number
  products: Product
}

interface Sale {
  id: string
  total_amount: number
  payment_method: string
  customer_name?: string
  created_at: string
  sale_items: SaleItem[]
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  notes?: string
}

interface InventoryItem {
  id: string
  product_id: string
  current_stock: number
  cost_per_unit?: number
  products: Product
}

interface FinancialReportsProps {
  sales: Sale[]
  expenses: Expense[]
  inventory: InventoryItem[]
}

const COLORS = ["#15803d", "#84cc16", "#f97316", "#ef4444", "#8b5cf6", "#06b6d4", "#f59e0b"]

export function FinancialReports({ sales, expenses, inventory }: FinancialReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current-month")
  const [selectedTab, setSelectedTab] = useState("overview")

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date()
    switch (selectedPeriod) {
      case "current-month":
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case "last-month":
        const lastMonth = subMonths(now, 1)
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
      case "last-3-months":
        return { start: subMonths(now, 3), end: now }
      case "all-time":
        return { start: new Date(2020, 0, 1), end: now }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) }
    }
  }, [selectedPeriod])

  // Filter data by selected period
  const filteredSales = sales.filter((sale) =>
    isWithinInterval(new Date(sale.created_at), { start: dateRange.start, end: dateRange.end }),
  )

  const filteredExpenses = expenses.filter((expense) =>
    isWithinInterval(new Date(expense.date), { start: dateRange.start, end: dateRange.end }),
  )

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalSales = filteredSales.length
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    // Calculate COGS (Cost of Goods Sold)
    const totalCOGS = filteredSales.reduce((sum, sale) => {
      return (
        sum +
        sale.sale_items.reduce((itemSum, item) => {
          const inventoryItem = inventory.find((inv) => inv.product_id === item.products.id)
          const cost = inventoryItem?.cost_per_unit || item.products.price * 0.6
          return itemSum + cost * item.quantity
        }, 0)
      )
    }, 0)

    const grossProfit = totalRevenue - totalCOGS
    const netProfit = grossProfit - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      totalExpenses,
      totalSales,
      averageOrderValue,
      totalCOGS,
      grossProfit,
      netProfit,
      profitMargin,
    }
  }, [filteredSales, filteredExpenses, inventory])

  // Sales by category data
  const salesByCategory = useMemo(() => {
    const categoryData: Record<string, number> = {}
    filteredSales.forEach((sale) => {
      sale.sale_items.forEach((item) => {
        const category = item.products.category
        categoryData[category] = (categoryData[category] || 0) + item.subtotal
      })
    })
    return Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount,
    }))
  }, [filteredSales])

  // Sales by payment method
  const salesByPaymentMethod = useMemo(() => {
    const paymentData: Record<string, number> = {}
    filteredSales.forEach((sale) => {
      paymentData[sale.payment_method] = (paymentData[sale.payment_method] || 0) + sale.total_amount
    })
    return Object.entries(paymentData).map(([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount,
    }))
  }, [filteredSales])

  // Daily sales trend
  const dailySalesTrend = useMemo(() => {
    const dailyData: Record<string, number> = {}
    filteredSales.forEach((sale) => {
      const date = format(new Date(sale.created_at), "dd/MM")
      dailyData[date] = (dailyData[date] || 0) + sale.total_amount
    })
    return Object.entries(dailyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split("/").map(Number)
        const [dayB, monthB] = b.date.split("/").map(Number)
        return monthA - monthB || dayA - dayB
      })
  }, [filteredSales])

  // Top selling products
  const topProducts = useMemo(() => {
    const productData: Record<string, { name: string; quantity: number; revenue: number }> = {}
    filteredSales.forEach((sale) => {
      sale.sale_items.forEach((item) => {
        const productId = item.products.id
        if (!productData[productId]) {
          productData[productId] = { name: item.products.name, quantity: 0, revenue: 0 }
        }
        productData[productId].quantity += item.quantity
        productData[productId].revenue += item.subtotal
      })
    })
    return Object.values(productData)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [filteredSales])

  // Expense categories
  const expensesByCategory = useMemo(() => {
    const categoryData: Record<string, number> = {}
    filteredExpenses.forEach((expense) => {
      categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount
    })
    return Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount,
    }))
  }, [filteredExpenses])

  const exportReport = () => {
    const reportData = {
      period: selectedPeriod,
      dateRange: {
        start: format(dateRange.start, "dd/MM/yyyy"),
        end: format(dateRange.end, "dd/MM/yyyy"),
      },
      metrics,
      salesByCategory,
      salesByPaymentMethod,
      topProducts,
      expensesByCategory,
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `reporte-financiero-${format(new Date(), "yyyy-MM-dd")}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Reportes Financieros</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Mes Actual</SelectItem>
              <SelectItem value="last-month">Mes Anterior</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
              <SelectItem value="all-time">Todo el Tiempo</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="expenses">Gastos</TabsTrigger>
          <TabsTrigger value="profit">Rentabilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${metrics.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {format(dateRange.start, "dd MMM", { locale: es })} -{" "}
                  {format(dateRange.end, "dd MMM", { locale: es })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
                {metrics.netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-primary" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                  ${metrics.netProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Margen: {metrics.profitMargin.toFixed(1)}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalSales}</div>
                <p className="text-xs text-muted-foreground">Promedio: ${metrics.averageOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">${metrics.totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">{filteredExpenses.length} registros</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Ventas"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ventas Diarias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailySalesTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Ventas"]} />
                    <Line type="monotone" dataKey="amount" stroke="#15803d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByPaymentMethod}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]} />
                    <Bar dataKey="amount" fill="#15803d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">{product.quantity} unidades</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${product.revenue.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gastos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expensesByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Gastos"]} />
                    <Bar dataKey="amount" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle de Gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {filteredExpenses.slice(0, 10).map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <h4 className="font-medium">{expense.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            {expense.category} • {format(new Date(expense.date), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-destructive">${expense.amount.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Ingresos Brutos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${metrics.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total de ventas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Costo de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">${metrics.totalCOGS.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Costo de productos vendidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Ganancia Bruta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${metrics.grossProfit.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Margen:{" "}
                  {metrics.totalRevenue > 0 ? ((metrics.grossProfit / metrics.totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análisis de Rentabilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Desglose de Costos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingresos Totales:</span>
                      <span className="font-medium">${metrics.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">- Costo de Productos:</span>
                      <span className="font-medium text-orange-600">-${metrics.totalCOGS.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Ganancia Bruta:</span>
                      <span className="font-medium text-primary">${metrics.grossProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">- Gastos Operativos:</span>
                      <span className="font-medium text-destructive">-${metrics.totalExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold">
                      <span>Ganancia Neta:</span>
                      <span className={metrics.netProfit >= 0 ? "text-primary" : "text-destructive"}>
                        ${metrics.netProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Indicadores Clave</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margen Bruto:</span>
                      <span className="font-medium">
                        {metrics.totalRevenue > 0 ? ((metrics.grossProfit / metrics.totalRevenue) * 100).toFixed(1) : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margen Neto:</span>
                      <span className="font-medium">{metrics.profitMargin.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ticket Promedio:</span>
                      <span className="font-medium">${metrics.averageOrderValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Transacciones:</span>
                      <span className="font-medium">{metrics.totalSales}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
