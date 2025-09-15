"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import { ShoppingCart, Plus, Minus, CreditCard, Banknote, Smartphone, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  price: number
  category: string
  description?: string
  image_url?: string
}

interface CartItem extends Product {
  quantity: number
}

interface POSInterfaceProps {
  products: Product[]
}

export function POSInterface({ products }: POSInterfaceProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos")
  const [showPayment, setShowPayment] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo")
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Get unique categories
  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))]

  // Filter products by category
  const filteredProducts =
    selectedCategory === "Todos" ? products : products.filter((p) => p.category === selectedCategory)

  // Calculate total
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, change: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + change
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "El carrito está vacío",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuario no autenticado")

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          total_amount: total,
          payment_method: paymentMethod,
          customer_name: customerName || null,
          user_id: user.id,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items
      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

      if (itemsError) throw itemsError

      // Clear cart and close payment
      setCart([])
      setCustomerName("")
      setShowPayment(false)

      toast({
        title: "¡Venta completada!",
        description: `Total: $${total.toFixed(2)}`,
      })
    } catch (error) {
      console.error("Error processing sale:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la venta",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Products Section */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Productos</h2>

          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
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
        </div>

        {/* Products Grid */}
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-4xl">🍽️</div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1 text-balance">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-card border-l border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingCart className="h-6 w-6" />
          <h2 className="text-xl font-bold">Carrito</h2>
          <Badge variant="secondary" className="ml-auto">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </Badge>
        </div>

        <ScrollArea className="h-[calc(100vh-300px)] mb-6">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="h-6 w-6 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Total and Checkout */}
        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold">Total:</span>
            <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>

          <Button className="w-full" size="lg" disabled={cart.length === 0} onClick={() => setShowPayment(true)}>
            Procesar Pago
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 max-w-[90vw]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Procesar Pago
                <Button variant="ghost" size="sm" onClick={() => setShowPayment(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer">Nombre del Cliente (Opcional)</Label>
                <Input
                  id="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ingrese el nombre del cliente"
                />
              </div>

              <div>
                <Label>Método de Pago</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button
                    variant={paymentMethod === "efectivo" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("efectivo")}
                    className="flex flex-col gap-1 h-16"
                  >
                    <Banknote className="h-5 w-5" />
                    <span className="text-xs">Efectivo</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "tarjeta" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("tarjeta")}
                    className="flex flex-col gap-1 h-16"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Tarjeta</span>
                  </Button>
                  <Button
                    variant={paymentMethod === "transferencia" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("transferencia")}
                    className="flex flex-col gap-1 h-16"
                  >
                    <Smartphone className="h-5 w-5" />
                    <span className="text-xs">Transfer.</span>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total a Pagar:</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>

              <Button className="w-full" size="lg" onClick={processSale} disabled={isProcessing}>
                {isProcessing ? "Procesando..." : "Confirmar Pago"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
