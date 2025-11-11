"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { ScannerStatus } from "@/components/barcode/scanner-status";

interface SaleItem {
  product: Product;
  quantity: number;
  unit_price: number;
  id?: string;
}

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSaleComplete: (saleData: {
    items: Array<{ product: Product; quantity: number; unit_price: number }>;
    total: number;
    discount?: number;
    customer_name?: string;
    customer_email?: string;
    payment_method?: "cash" | "card" | "transfer" | "other";
    notes?: string;
  }) => void | Promise<void>;
}

export function SaleDialog({
  open,
  onOpenChange,
  products,
  onSaleComplete,
}: SaleDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "transfer" | "other"
  >("cash");
  const [discountMethod, setDiscountMethod] = useState<
    "direct" | "percentage"
  >("direct");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleBarcodeScanned = (event: CustomEvent) => {
      const { barcode } = event.detail;

      // Find product by barcode
      const product = products.find(
        (p) => p.barcode === barcode && p.stock > 0
      );

      if (product) {
        addProductToSale(product);
        // Show visual feedback
        setSearchQuery(`✓ ${product.name}`);
        setTimeout(() => setSearchQuery(""), 2000);
      } else {
        // Show error feedback
        setSearchQuery(`❌ Producto no encontrado: ${barcode}`);
        setTimeout(() => setSearchQuery(""), 3000);
      }
    };

    if (open) {
      window.addEventListener(
        "barcodeScanned",
        handleBarcodeScanned as EventListener
      );
    }

    return () => {
      window.removeEventListener(
        "barcodeScanned",
        handleBarcodeScanned as EventListener
      );
    };
  }, [open, products]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  useEffect(() => {
    calculateTotal();
  }, [saleItems]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setSearchQuery("");
      setSaleItems([]);
      setTotal(0);
      setDiscount(0);
      setCustomerName("");
      setCustomerEmail("");
      setNotes("");
      setPaymentMethod("cash");
    }
  }, [open]);

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products
      .filter(
        (product) =>
          product.stock > 0 && // Only show products with stock
          (product.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
            product.brand?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
            product.barcode
              ?.toLowerCase()
              .includes(searchQuery?.toLowerCase())) &&
          saleItems.findIndex((item) => item.id === product.id) === -1
      )
      .slice(0, 8); // Limit results

    setFilteredProducts(filtered);
  };

  const calculateTotal = () => {
    const subtotal = saleItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    setTotal(subtotal);
  };

  const addProductToSale = (product: Product) => {
    const existingItem = saleItems.find(
      (item) => item.product.id === product.id
    );

    if (existingItem) {
      // Increase quantity if product already in sale
      if (existingItem.quantity < product.stock) {
        setSaleItems((prev) =>
          prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      // Add new product to sale
      setSaleItems((prev) => [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: product.price,
          id: product.id,
        },
      ]);
    }

    setSearchQuery(""); // Clear search after adding
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromSale(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product && newQuantity > product.stock) {
      return; // Don't allow quantity greater than stock
    }

    setSaleItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;

    setSaleItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, unit_price: newPrice } : item
      )
    );
  };

  const removeItemFromSale = (productId: string) => {
    setSaleItems((prev) =>
      prev.filter((item) => item.product.id !== productId)
    );
  };

  const handleCompleteSale = async () => {
    if (saleItems.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      // 🔹 SOLUCIÓN: Solo pasar los datos al parent component
      // El parent (SalesPage) se encarga de guardar en Supabase
      await onSaleComplete({
        items: saleItems,
        total: finalAmount,
        discount: discountMethod === 'percentage' ? total * (discount / 100) : discount,
        customer_name: customerName,
        customer_email: customerEmail,
        payment_method: paymentMethod,
        notes,
      });

      // Reset form
      setSaleItems([]);
      setTotal(0);
      setDiscount(0);
      setCustomerName("");
      setCustomerEmail("");
      setNotes("");
      setPaymentMethod("cash");
      onOpenChange(false);
    } catch (error) {
      console.error("Error completing sale:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const finalAmount = total - (discountMethod === 'percentage' ? total * (discount / 100) : discount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
          <DialogDescription>
            Agrega productos escaneando códigos de barras o buscando manualmente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScannerStatus />

          {/* Product Search */}
          <div className="space-y-2">
            <Label>Buscar Productos</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, marca o código de barras... (o usa el escáner)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Search Results */}
            {filteredProducts.length > 0 && (
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                    onClick={() => addProductToSale(product)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.brand} • Stock: {product.stock}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${product.price.toLocaleString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {product.barcode}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sale Items */}
          {saleItems.length > 0 && (
            <div className="space-y-2">
              <Label>Productos en la Venta</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {saleItems.map((item) => (
                  <Card key={item.product.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {item.product.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.product.brand} • Stock disponible:{" "}
                            {item.product.stock}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateItemQuantity(
                                item.product.id!,
                                item.quantity - 1
                              )
                            }
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                item.product.id!,
                                Number.parseInt(e.target.value) || 1
                              )
                            }
                            className="w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateItemQuantity(
                                item.product.id!,
                                item.quantity + 1
                              )
                            }
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItemPrice(
                                item.product.id!,
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-right"
                          />
                        </div>

                        <div className="w-20 text-right font-medium">
                          ${(item.quantity * item.unit_price).toLocaleString()}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItemFromSale(item.product.id!)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Customer and Payment Information */}
          {saleItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-3">
                <Label>Información del Cliente (Opcional)</Label>
                <Input
                  placeholder="Nombre del cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="CUIL del cliente"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Detalles de Pago</Label>
                <div className="flex gap-5">
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: any) => setPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={discountMethod}
                    onValueChange={(value: any) => setDiscountMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Directo</SelectItem>
                      <SelectItem value="percentage">Porcentaje</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  placeholder="Descuento ($)"
                  value={discount}
                  min={0}
                  onChange={(e) =>
                    setDiscount(Number.parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Label>Notas (Opcional)</Label>
                <Textarea
                  placeholder="Notas adicionales sobre la venta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Total */}
          {saleItems.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>Subtotal:</span>
                <span>${total.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Descuento:</span>
                  <span>-${discountMethod === 'percentage' ? total * (discount / 100) : discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-lg font-bold border-t pt-2">
                <span>Total Final:</span>
                <span className="text-primary">
                  ${finalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCompleteSale}
            disabled={saleItems.length === 0 || isProcessing}
            className="racing-shadow"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isProcessing
              ? "Procesando..."
              : `Completar Venta ($${finalAmount.toLocaleString()})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}