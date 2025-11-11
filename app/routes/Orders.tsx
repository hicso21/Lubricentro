import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductService } from "@/lib/product-service"
import { OfflineSync } from "@/lib/offline-sync"
import type { Product, PurchaseOrder } from "@/lib/types"
import { Plus, TrendingUp, Search, Package, Clock, CheckCircle } from "lucide-react"
import { PurchaseOrderDialog } from "@/components/orders/purchase-order-dialog"
import { OrdersTable } from "@/components/orders/orders-table"
import { useToast } from "@/hooks/use-toast"
import { useStorage } from "@/hooks/use-storage"

export default function OrdersPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    receivedOrders: 0,
    totalValue: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchQuery, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load products
      if (OfflineSync.isOnline()) {
        const { data: productsData } = await ProductService.getAllProducts()
        if (productsData) {
          setProducts(productsData)
          OfflineSync.saveProductsToLocal(productsData)
        }
      } else {
        const localProducts = OfflineSync.getProductsFromLocal()
        setProducts(localProducts)
      }

      // Load purchase orders (mock data for now)
      const mockOrders = generateMockOrders()
      setOrders(mockOrders)
      calculateOrderStats(mockOrders)

      // Load pending orders from localStorage
      const pendingOrders = OfflineSync.getPendingPurchaseOrders()
      if (pendingOrders.length > 0) {
        setOrders((prev) => [...pendingOrders, ...prev])
        calculateOrderStats([...pendingOrders, ...mockOrders])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMockOrders = (): PurchaseOrder[] => {
    const mockOrders: PurchaseOrder[] = []
    const statuses: Array<"pending" | "received" | "cancelled"> = ["pending", "received", "cancelled"]

    for (let i = 0; i < 15; i++) {
      const orderDate = new Date()
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30))

      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const quantity = Math.floor(Math.random() * 50) + 10
      const unitCost = Math.floor(Math.random() * 5000) + 500

      mockOrders.push({
        id: `order_${i}`,
        product_id: `product_${i}`,
        quantity,
        unit_cost: unitCost,
        total: quantity * unitCost,
        supplier: `Proveedor ${Math.floor(Math.random() * 5) + 1}`,
        status,
        created_at: orderDate.toISOString(),
        received_at: status === "received" ? new Date().toISOString() : undefined,
      })
    }

    return mockOrders
  }

  const calculateOrderStats = (ordersData: PurchaseOrder[]) => {
    const totalOrders = ordersData.length
    const pendingOrders = ordersData.filter((order) => order.status === "pending").length
    const receivedOrders = ordersData.filter((order) => order.status === "received").length
    const totalValue = ordersData
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0)

    setOrderStats({
      totalOrders,
      pendingOrders,
      receivedOrders,
      totalValue,
    })
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.id!.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const handleOrderSave = async (orderData: Omit<PurchaseOrder, "id" | "created_at">) => {
    try {
      const storage = useStorage()
      if (editingOrder) {
        // Update existing order
        const updatedOrder = {
          ...editingOrder,
          ...orderData,
        }

        setOrders((prev) => prev.map((order) => (order.id === editingOrder.id ? updatedOrder : order)))

        // Save to localStorage if offline
        if (!OfflineSync.isOnline()) {
          const pendingOrders = OfflineSync.getPendingPurchaseOrders()
          const updatedPending = pendingOrders.map((order) => (order.id === editingOrder.id ? updatedOrder : order))
          storage.setItem("lubricentro_purchase_orders", JSON.stringify(updatedPending))
        }

        toast({
          title: "Pedido actualizado",
          description: `Pedido ${editingOrder.id} actualizado correctamente`,
        })
      } else {
        // Create new order
        const newOrder: PurchaseOrder = {
          ...orderData,
          id: `order_${Date.now()}`,
          created_at: new Date().toISOString(),
        }

        setOrders((prev) => [newOrder, ...prev])

        // Save to localStorage for offline sync
        OfflineSync.savePendingPurchaseOrder(orderData)

        toast({
          title: "Pedido creado",
          description: `Nuevo pedido para ${orderData.supplier}`,
        })
      }

      setShowOrderDialog(false)
      setEditingOrder(null)
      loadData() // Refresh stats
    } catch (error) {
      console.error("Error saving order:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el pedido",
        variant: "destructive",
      })
    }
  }

  const handleOrderEdit = (order: PurchaseOrder) => {
    setEditingOrder(order)
    setShowOrderDialog(true)
  }

  const handleOrderStatusChange = async (order: PurchaseOrder, newStatus: "pending" | "received" | "cancelled") => {
    try {
      const updatedOrder = {
        ...order,
        status: newStatus,
        received_at: newStatus === "received" ? new Date().toISOString() : order.received_at,
      }

      setOrders((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)))

      // If order is received, update product stock
      if (newStatus === "received" && order.status !== "received") {
        const product = products.find((p) => p.id === order.product_id)
        if (product) {
          const newStock = product.stock + order.quantity
          OfflineSync.updateLocalProductStock(order.product_id, newStock)
          setProducts((prev) => prev.map((p) => (p.id === order.product_id ? { ...p, stock: newStock } : p)))

          // Update in Supabase if online
          if (OfflineSync.isOnline()) {
            try {
              await ProductService.updateProduct(order.product_id, { stock: newStock })
            } catch (error) {
              console.error("Error updating stock in Supabase:", error)
            }
          }
        }
      }

      toast({
        title: "Estado actualizado",
        description: `Pedido marcado como ${newStatus === "received" ? "recibido" : newStatus === "cancelled" ? "cancelado" : "pendiente"}`,
      })

      loadData() // Refresh stats
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      })
    }
  }

  const handleOrderDelete = async (order: PurchaseOrder) => {
    const storage = useStorage()
    if (!confirm(`¿Estás seguro de eliminar el pedido ${order.id}?`)) return

    try {
      setOrders((prev) => prev.filter((o) => o.id !== order.id))

      // Remove from localStorage if it's a pending order
      if (order.id?.startsWith("order_")) {
        const pendingOrders = OfflineSync.getPendingPurchaseOrders()
        const updatedPending = pendingOrders.filter((o) => o.id !== order.id)
        storage.setItem("lubricentro_purchase_orders", JSON.stringify(updatedPending))
      }

      toast({
        title: "Pedido eliminado",
        description: `Pedido ${order.id} eliminado correctamente`,
      })

      loadData() // Refresh stats
    } catch (error) {
      console.error("Error deleting order:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Pedidos</h2>
          <p className="text-muted-foreground">Gestión de órdenes de compra y reposición de stock</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowOrderDialog(true)} className="racing-shadow cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="racing-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{orderStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Pedidos registrados</p>
          </CardContent>
        </Card>

        <Card className="racing-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{orderStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Esperando recepción</p>
          </CardContent>
        </Card>

        <Card className="racing-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{orderStats.receivedOrders}</div>
            <p className="text-xs text-muted-foreground">Completados</p>
          </CardContent>
        </Card>

        <Card className="racing-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${orderStats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inversión en pedidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra pedidos por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por proveedor o ID de pedido..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="received">Recibidos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
          <CardDescription>Lista completa de órdenes de compra</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Cargando pedidos...</div>
            </div>
          ) : (
            <OrdersTable
              orders={filteredOrders}
              products={products}
              onEdit={handleOrderEdit}
              onDelete={handleOrderDelete}
              onStatusChange={handleOrderStatusChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Purchase Order Dialog */}
      <PurchaseOrderDialog
        open={showOrderDialog}
        onOpenChange={setShowOrderDialog}
        order={editingOrder}
        products={products}
        onSave={handleOrderSave}
      />
    </>
  )
}
