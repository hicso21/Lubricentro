"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, AlertTriangle } from "lucide-react"
import type { Product, PurchaseOrder } from "@/lib/types"

interface PurchaseOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: PurchaseOrder | null
  products: Product[]
  onSave: (order: Omit<PurchaseOrder, "id" | "created_at">) => void
}

export function PurchaseOrderDialog({ open, onOpenChange, order, products, onSave }: PurchaseOrderDialogProps) {
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: 0,
    unit_cost: 0,
    total: 0,
    supplier: "",
    status: "pending" as "pending" | "received" | "cancelled",
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (order) {
      const product = products.find((p) => p.id === order.product_id)
      setFormData({
        product_id: order.product_id,
        quantity: order.quantity,
        unit_cost: order.unit_cost,
        total: order.total,
        supplier: order.supplier,
        status: order.status,
      })
      setSelectedProduct(product || null)
    } else {
      setFormData({
        product_id: "",
        quantity: 0,
        unit_cost: 0,
        total: 0,
        supplier: "",
        status: "pending",
      })
      setSelectedProduct(null)
    }
    setSearchQuery("")
    setErrors({})
  }, [order, open, products])

  useEffect(() => {
    filterProducts()
  }, [searchQuery, products])

  useEffect(() => {
    // Calculate total when quantity or unit cost changes
    const total = formData.quantity * formData.unit_cost
    setFormData((prev) => ({ ...prev, total }))
  }, [formData.quantity, formData.unit_cost])

  const filterProducts = () => {
    if (!searchQuery) {
      // Show low stock products by default
      const lowStockProducts = products.filter((product) => product.stock <= product.min_stock).slice(0, 8)
      setFilteredProducts(lowStockProducts)
      return
    }

    const filtered = products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.barcode.includes(searchQuery),
      )
      .slice(0, 8)

    setFilteredProducts(filtered)
  }

  const selectProduct = (product: Product) => {
    setSelectedProduct(product)
    setFormData((prev) => ({
      ...prev,
      product_id: product.id!,
      supplier: product.supplier,
      unit_cost: product.cost || product.price * 0.7, // Default to 70% of sale price if no cost
    }))
    setSearchQuery("")
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_id) {
      newErrors.product_id = "Debe seleccionar un producto"
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = "La cantidad debe ser mayor a 0"
    }
    if (formData.unit_cost <= 0) {
      newErrors.unit_cost = "El costo unitario debe ser mayor a 0"
    }
    if (!formData.supplier.trim()) {
      newErrors.supplier = "El proveedor es requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      onSave(formData)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const getLowStockProducts = () => {
    return products.filter((product) => product.stock <= product.min_stock)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Editar Pedido" : "Nuevo Pedido"}</DialogTitle>
          <DialogDescription>
            {order ? "Modifica los datos del pedido existente" : "Crea una nueva orden de compra"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Producto *</Label>
            {selectedProduct ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                <div>
                  <div className="font-medium">{selectedProduct.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedProduct.brand} • Stock actual: {selectedProduct.stock}
                    {selectedProduct.stock <= selectedProduct.min_stock && (
                      <Badge variant="destructive" className="ml-2">
                        Stock bajo
                      </Badge>
                    )}
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto por nombre, marca o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* Product Results */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {!searchQuery && getLowStockProducts().length > 0 && (
                    <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Productos con stock bajo (recomendados):
                    </div>
                  )}
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                      onClick={() => selectProduct(product)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.brand} • Stock: {product.stock} • Min: {product.min_stock}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{product.supplier}</div>
                        {product.stock <= product.min_stock && (
                          <Badge variant="destructive" className="text-xs">
                            Stock bajo
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {errors.product_id && <p className="text-sm text-destructive">{errors.product_id}</p>}
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", Number.parseInt(e.target.value) || 0)}
                placeholder="0"
                className={errors.quantity ? "border-destructive" : ""}
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost">Costo Unitario *</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => handleInputChange("unit_cost", Number.parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className={errors.unit_cost ? "border-destructive" : ""}
              />
              {errors.unit_cost && <p className="text-sm text-destructive">{errors.unit_cost}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor *</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleInputChange("supplier", e.target.value)}
              placeholder="Nombre del proveedor"
              className={errors.supplier ? "border-destructive" : ""}
            />
            {errors.supplier && <p className="text-sm text-destructive">{errors.supplier}</p>}
          </div>

          {order && (
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="pending">Pendiente</option>
                <option value="received">Recibido</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total del Pedido:</span>
              <span className="text-primary">${formData.total.toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="racing-shadow">
              {order ? "Actualizar" : "Crear"} Pedido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
