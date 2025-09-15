"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Package, Plus, Edit, AlertTriangle, TrendingUp, Minus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  category: string
  price: number
  description?: string
}

interface InventoryItem {
  id: string
  product_id: string
  current_stock: number
  min_stock: number
  max_stock?: number
  cost_per_unit?: number
  last_updated: string
  products: Product
}

interface InventoryManagerProps {
  initialInventory: InventoryItem[]
  allProducts: Product[]
}

export function InventoryManager({ initialInventory, allProducts }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos")
  const [formData, setFormData] = useState({
    product_id: "",
    current_stock: "",
    min_stock: "",
    max_stock: "",
    cost_per_unit: "",
  })
  const { toast } = useToast()
  const supabase = createClient()

  // Get products that don't have inventory records yet
  const productsWithoutInventory = allProducts.filter(
    (product) => !inventory.some((inv) => inv.product_id === product.id),
  )

  // Get unique categories
  const categories = ["Todos", ...Array.from(new Set(allProducts.map((p) => p.category)))]

  // Filter inventory by category
  const filteredInventory =
    selectedCategory === "Todos" ? inventory : inventory.filter((item) => item.products.category === selectedCategory)

  // Calculate statistics
  const lowStockItems = inventory.filter((item) => item.current_stock <= item.min_stock)
  const totalProducts = inventory.length
  const totalValue = inventory.reduce((sum, item) => {
    const cost = item.cost_per_unit || item.products.price * 0.6
    return sum + item.current_stock * cost
  }, 0)

  const resetForm = () => {
    setFormData({
      product_id: "",
      current_stock: "",
      min_stock: "",
      max_stock: "",
      cost_per_unit: "",
    })
    setEditingItem(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.product_id || !formData.current_stock || !formData.min_stock) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      const inventoryData = {
        product_id: formData.product_id,
        current_stock: Number.parseInt(formData.current_stock),
        min_stock: Number.parseInt(formData.min_stock),
        max_stock: formData.max_stock ? Number.parseInt(formData.max_stock) : null,
        cost_per_unit: formData.cost_per_unit ? Number.parseFloat(formData.cost_per_unit) : null,
        user_id: user.id,
        last_updated: new Date().toISOString(),
      }

      if (editingItem) {
        // Update existing inventory item
        const { data, error } = await supabase
          .from("inventory")
          .update(inventoryData)
          .eq("id", editingItem.id)
          .select(`
            *,
            products (
              id,
              name,
              category,
              price,
              description
            )
          `)
          .single()

        if (error) throw error

        setInventory((prev) => prev.map((item) => (item.id === editingItem.id ? data : item)))
        toast({
          title: "¡Inventario actualizado!",
          description: "El inventario ha sido actualizado correctamente",
        })
      } else {
        // Create new inventory item
        const { data, error } = await supabase
          .from("inventory")
          .insert(inventoryData)
          .select(`
            *,
            products (
              id,
              name,
              category,
              price,
              description
            )
          `)
          .single()

        if (error) throw error

        setInventory((prev) => [data, ...prev])
        toast({
          title: "¡Inventario agregado!",
          description: "El producto ha sido agregado al inventario",
        })
      }

      resetForm()
    } catch (error) {
      console.error("Error saving inventory:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el inventario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      product_id: item.product_id,
      current_stock: item.current_stock.toString(),
      min_stock: item.min_stock.toString(),
      max_stock: item.max_stock?.toString() || "",
      cost_per_unit: item.cost_per_unit?.toString() || "",
    })
    setShowForm(true)
  }

  const adjustStock = async (itemId: string, adjustment: number) => {
    try {
      const item = inventory.find((inv) => inv.id === itemId)
      if (!item) return

      const newStock = Math.max(0, item.current_stock + adjustment)

      const { data, error } = await supabase
        .from("inventory")
        .update({
          current_stock: newStock,
          last_updated: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select(`
          *,
          products (
            id,
            name,
            category,
            price,
            description
          )
        `)
        .single()

      if (error) throw error

      setInventory((prev) => prev.map((inv) => (inv.id === itemId ? data : inv)))

      toast({
        title: "Stock actualizado",
        description: `Stock ${adjustment > 0 ? "aumentado" : "reducido"} correctamente`,
      })
    } catch (error) {
      console.error("Error adjusting stock:", error)
      toast({
        title: "Error",
        description: "No se pudo ajustar el stock",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Gestión de Inventario</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Producto
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>¡Atención!</strong> {lowStockItems.length} producto(s) con stock bajo:{" "}
            {lowStockItems.map((item) => item.products.name).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Productos en inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Productos con stock mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor estimado del inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Inventario</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsWithoutInventory.length}</div>
            <p className="text-xs text-muted-foreground">Productos sin registro</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className="whitespace-nowrap"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Inventory Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingItem ? "Editar Inventario" : "Agregar al Inventario"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="product">Producto *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                    disabled={!!editingItem}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editingItem ? allProducts : productsWithoutInventory).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="current_stock">Stock Actual *</Label>
                  <Input
                    id="current_stock"
                    type="number"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="min_stock">Stock Mínimo *</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="max_stock">Stock Máximo</Label>
                  <Input
                    id="max_stock"
                    type="number"
                    min="0"
                    value={formData.max_stock}
                    onChange={(e) => setFormData({ ...formData, max_stock: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <Label htmlFor="cost_per_unit">Costo por Unidad</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Guardando..." : editingItem ? "Actualizar" : "Guardar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1 bg-transparent">
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredInventory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay productos en el inventario</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInventory.map((item) => {
                  const isLowStock = item.current_stock <= item.min_stock
                  const stockPercentage = item.max_stock ? (item.current_stock / item.max_stock) * 100 : undefined

                  return (
                    <Card key={item.id} className={`p-4 ${isLowStock ? "border-destructive/50" : ""}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {item.products.name}
                              {isLowStock && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            </h4>
                            <p className="text-sm text-muted-foreground">{item.products.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isLowStock ? "destructive" : "secondary"}>Stock: {item.current_stock}</Badge>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Mínimo:</span>
                          <div className="font-medium">{item.min_stock}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Máximo:</span>
                          <div className="font-medium">{item.max_stock || "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Costo/Unidad:</span>
                          <div className="font-medium">
                            ${(item.cost_per_unit || item.products.price * 0.6).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor Total:</span>
                          <div className="font-medium">
                            ${((item.cost_per_unit || item.products.price * 0.6) * item.current_stock).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {stockPercentage !== undefined && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Nivel de stock</span>
                            <span>{stockPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                stockPercentage < 25
                                  ? "bg-destructive"
                                  : stockPercentage < 50
                                    ? "bg-yellow-500"
                                    : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adjustStock(item.id, -1)}
                            disabled={item.current_stock <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => adjustStock(item.id, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Actualizado: {new Date(item.last_updated).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
