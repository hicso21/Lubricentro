"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Receipt, Calendar, Trash2, Loader2 } from "lucide-react";
import type { Sale, Product } from "@/lib/types";

interface SalesHistoryProps {
  sales: Sale[];
  products: Product[];
  onDeleteSale?: (saleNumber: string) => Promise<void>;
}

export function SalesHistory({
  sales,
  products,
  onDeleteSale,
}: SalesHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product
      ? `${product.name} (${product.brand})`
      : "Producto no encontrado";
  };

  const filteredSales = sales.filter((sale) => {
    const productName = getProductName(sale.product_id).toLowerCase();
    const saleNumber = (sale.sale_number || "").toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      productName.includes(searchQuery.toLowerCase()) ||
      saleNumber.includes(searchQuery.toLowerCase());

    const saleDate = new Date(sale.created_at!).toISOString().split("T")[0];
    const matchesDate = dateFilter === "" || saleDate === dateFilter;

    return matchesSearch && matchesDate;
  });

  // Agrupar ventas por sale_number para mostrar información consolidada
  const groupedSales = filteredSales.reduce((acc, sale) => {
    const saleNumber = (sale.sale_number || "").toLowerCase();
    if (!acc[saleNumber]) {
      acc[saleNumber] = {
        sale_number: saleNumber,
        created_at: sale.created_at,
        items: [],
        total: 0,
        status: sale.id?.startsWith("temp_") ? "pending" : "completed",
      };
    }
    acc[saleNumber].items.push(sale);
    acc[saleNumber].total += sale.final_amount || 0;
    return acc;
  }, {} as Record<string, { sale_number: string; created_at: string; items: Sale[]; total: number; status: string }>);

  const groupedSalesArray = Object.values(groupedSales).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteClick = (saleNumber: string) => {
    setSaleToDelete(saleNumber);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete || !onDeleteSale) return;

    setIsDeleting(true);
    try {
      await onDeleteSale(saleToDelete);
      setSaleToDelete(null);
    } catch (error) {
      console.error("Error al eliminar venta:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Historial de Ventas
          </CardTitle>
          <CardDescription>
            Registro completo de todas las ventas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por producto o número de venta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {(searchQuery || dateFilter) && (
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  setSearchQuery("");
                  setDateFilter("");
                }}
              >
                Limpiar
              </Button>
            )}
          </div>

          {/* Sales Table */}
          {groupedSalesArray.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron ventas</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>ID de compra</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead className="text-right">Cant. Total</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedSalesArray.map((group) => (
                    <TableRow key={group.sale_number}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(group.created_at)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {group.sale_number}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {group.items.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium">
                                {getProductName(item.product_id)}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                x{item.quantity} ($
                                {item.unit_price.toLocaleString()})
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {group.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${group.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            group.status === "pending" ? "outline" : "secondary"
                          }
                        >
                          {group.status === "pending"
                            ? "Pendiente sync"
                            : "Completada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(group.sale_number)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {filteredSales.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Ventas</div>
                  <div className="text-2xl font-bold text-primary">
                    {groupedSalesArray.length}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Cantidad Total</div>
                  <div className="text-2xl font-bold text-primary">
                    {filteredSales.reduce(
                      (sum, sale) => sum + sale.quantity,
                      0
                    )}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Monto Total</div>
                  <div className="text-2xl font-bold text-primary">
                    $
                    {filteredSales
                      .reduce((sum, sale) => sum + sale.final_amount, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Ticket Promedio</div>
                  <div className="text-2xl font-bold text-primary">
                    $
                    {Math.round(
                      filteredSales.reduce(
                        (sum, sale) => sum + sale.final_amount,
                        0
                      ) / groupedSalesArray.length
                    ).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={() => setSaleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la venta <strong>{saleToDelete}</strong> y
              restaurará el stock de los productos vendidos. Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
