"use client";

import type React from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { Scan } from "lucide-react";
import type { Product } from "@/lib/types";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  setProduct?: (product: Product | null) => void;
  onSave: (product: Omit<Product, "id" | "created_at" | "updated_at">) => void;
  categories: { id: string; name: string }[];
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  setProduct,
  onSave,
  categories,
}: ProductDialogProps) {
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    brand: "",
    category: "",
    price: 0,
    cost: 0,
    stock: 0,
    min_stock: 0,
    description: "",
    supplier: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleBarcodeScanned = (event: CustomEvent) => {
      const { barcode } = event.detail;

      // Only update if barcode field is empty or if we're creating a new product
      if (!product && !formData.barcode) {
        handleInputChange("barcode", barcode);
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
  }, [open, product, formData.barcode]);

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        min_stock: product.min_stock,
        description: product.description || "",
        supplier: product.supplier,
      });
    } else {
      setFormData({
        barcode: "",
        name: "",
        brand: "",
        category: "",
        price: 0,
        cost: 0,
        stock: 0,
        min_stock: 0,
        description: "",
        supplier: "",
      });
    }
    setErrors({});
  }, [product, open]);

  const getPercentaje = () => {
    try {
      const stored = localStorage?.getItem("lubricentro_settings");
      return stored
        ? parseFloat(JSON.parse(stored)?.markupPercentage) || 0.3
        : 0.3;
    } catch {
      return 0.3;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData?.barcode || !formData.barcode?.trim())
      newErrors.barcode = "El código de barras es requerido";

    if (!formData?.name || !formData.name?.trim())
      newErrors.name = "El nombre del producto es requerido";

    if (!formData?.brand || !formData.brand?.trim())
      newErrors.brand = "La marca es requerida";

    if (!formData?.category || !formData.category?.trim())
      newErrors.category = "La categoría es requerida";

    if (formData.price <= 0) newErrors.price = "El precio debe ser mayor a 0";

    if (formData.cost < 0) newErrors.cost = "El costo no puede ser negativo";

    if (formData.stock < 0) newErrors.stock = "El stock no puede ser negativo";

    if (formData.min_stock < 0)
      newErrors.min_stock = "El stock mínimo no puede ser negativo";

    if (!formData?.supplier || !formData.supplier?.trim())
      newErrors.supplier = "El proveedor es requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Modifica los datos del producto existente"
              : "Completa la información del nuevo producto. Puedes usar el escáner para el código de barras."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode" className="flex items-center gap-2">
                Código de Barras *
                <Scan className="w-4 h-4 text-muted-foreground" />
              </Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => handleInputChange("barcode", e.target.value)}
                placeholder="Escanea o ingresa manualmente..."
                className={errors.barcode ? "border-destructive" : ""}
              />
              {errors.barcode && (
                <p className="text-sm text-destructive">{errors.barcode}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Aceite Motor 5W-30"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                placeholder="Castrol, Mobil, Shell..."
                className={errors.brand ? "border-destructive" : ""}
              />
              {errors.brand && (
                <p className="text-sm text-destructive">{errors.brand}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className={`w-full h-10 px-3 rounded-md border bg-background text-sm cursor-pointer ${errors.category ? "border-destructive" : "border-input"
                  }`}
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Costo</Label>
              <Input
                id="cost"
                type="number"
                step="1"
                min="0"
                value={formData.cost}
                onChange={(e) => {
                  const percentaje: number = getPercentaje();
                  handleInputChange(
                    "cost",
                    Number.parseFloat(e.target.value) || 0
                  );
                  handleInputChange(
                    "price",
                    (
                      ((Number.parseFloat(e.target.value) * (1 + percentaje)) * (1.21)) * (1.15) || 0
                    ).toFixed(2) as unknown as number
                  );
                }}
                placeholder="0.00"
                className={errors.cost ? "border-destructive" : ""}
              />
              {errors.cost && (
                <p className="text-sm text-destructive">{errors.cost}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  handleInputChange(
                    "price",
                    Number.parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0.00"
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Actual</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) =>
                  handleInputChange(
                    "stock",
                    Number.parseInt(e.target.value) || 0
                  )
                }
                placeholder="0"
                className={errors.stock ? "border-destructive" : ""}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">{errors.stock}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">Stock Mínimo</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) =>
                  handleInputChange(
                    "min_stock",
                    Number.parseInt(e.target.value) || 0
                  )
                }
                placeholder="0"
                className={errors.min_stock ? "border-destructive" : ""}
              />
              {errors.min_stock && (
                <p className="text-sm text-destructive">{errors.min_stock}</p>
              )}
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
            {errors.supplier && (
              <p className="text-sm text-destructive">{errors.supplier}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descripción adicional del producto..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { onOpenChange(false); setProduct(null) }}
            >
              Cancelar
            </Button>
            <Button type="submit" className="racing-shadow">
              {product ? "Actualizar" : "Crear"} Producto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
