"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, CheckCircle, Clock, XCircle, Package } from "lucide-react"
import type { Product, PurchaseOrder } from "@/lib/types"

interface OrdersTableProps {
  orders: PurchaseOrder[]
  products: Product[]
  onEdit: (order: PurchaseOrder) => void
  onDelete: (order: PurchaseOrder) => void
  onStatusChange: (order: PurchaseOrder, status: "pending" | "received" | "cancelled") => void
}

export function OrdersTable({ orders, products, onEdit, onDelete, onStatusChange }: OrdersTableProps) {
  const [sortField, setSortField] = useState<keyof PurchaseOrder>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product ? `${product.name} (${product.brand})` : "Producto no encontrado"
  }

  const sortedOrders = [...orders].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const handleSort = (field: keyof PurchaseOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          variant: "outline" as const,
          icon: Clock,
          text: "Pendiente",
          color: "text-accent",
        }
      case "received":
        return {
          variant: "secondary" as const,
          icon: CheckCircle,
          text: "Recibido",
          color: "text-green-500",
        }
      case "cancelled":
        return {
          variant: "destructive" as const,
          icon: XCircle,
          text: "Cancelado",
          color: "text-destructive",
        }
      default:
        return {
          variant: "outline" as const,
          icon: Package,
          text: status,
          color: "text-muted-foreground",
        }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se encontraron pedidos</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("id")}>
              ID Pedido
            </TableHead>
            <TableHead>Producto</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("supplier")}>
              Proveedor
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort("quantity")}>
              Cantidad
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort("unit_cost")}>
              Costo Unit.
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleSort("total")}>
              Total
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("status")}>
              Estado
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("created_at")}>
              Fecha
            </TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOrders.map((order) => {
            const statusInfo = getStatusBadge(order.status)
            const StatusIcon = statusInfo.icon

            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.id}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{getProductName(order.product_id)}</div>
                </TableCell>
                <TableCell className="text-sm">{order.supplier}</TableCell>
                <TableCell className="text-right font-medium">{order.quantity}</TableCell>
                <TableCell className="text-right">${order.unit_cost.toLocaleString()}</TableCell>
                <TableCell className="text-right font-medium">${order.total.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant} className="gap-1">
                    <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                    {statusInfo.text}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{formatDate(order.created_at!)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(order)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {order.status === "pending" && (
                        <DropdownMenuItem onClick={() => onStatusChange(order, "received")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Marcar como Recibido
                        </DropdownMenuItem>
                      )}
                      {order.status === "pending" && (
                        <DropdownMenuItem onClick={() => onStatusChange(order, "cancelled")}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onDelete(order)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
