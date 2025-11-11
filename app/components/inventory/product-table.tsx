"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import type { Product } from "@/lib/types";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const [sortField, setSortField] = useState<keyof Product>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedProducts = [...products].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return {
        status: "Sin stock",
        variant: "destructive" as const,
        icon: AlertTriangle,
      };
    } else if (product.stock <= product.min_stock) {
      return {
        status: "Stock bajo",
        variant: "outline" as const,
        icon: AlertTriangle,
      };
    } else {
      return {
        status: "En stock",
        variant: "secondary" as const,
        icon: CheckCircle,
      };
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border w-[calc(100vw-240px-110px)]">
      <Table className="flex flex-col w-full">
        <TableHeader className="flex w-full">
          <TableRow className="flex flex-row justify-between">
            <TableHead
              className="flex items-center cursor-pointer hover:bg-muted/50 w-[130px]"
              onClick={() => handleSort("barcode")}
            >
              Código de Barras
            </TableHead>
            <TableHead
              className="flex items-center cursor-pointer hover:bg-muted/50 w-[calc(100vw-240px-110px-130px-81px-55px-58px-85px-103px-48px)]"
              onClick={() => handleSort("name")}
            >
              Producto
            </TableHead>
            <TableHead
              className="flex items-center cursor-pointer hover:bg-muted/50 w-[81px]"
              onClick={() => handleSort("category")}
            >
              Categoría
            </TableHead>
            <TableHead
              className="flex items-center cursor-pointer hover:bg-muted/50 text-right w-[55px]"
              onClick={() => handleSort("stock")}
            >
              Stock
            </TableHead>
            <TableHead
              className="flex items-center cursor-pointer hover:bg-muted/50 text-right w-[58px]"
              onClick={() => handleSort("price")}
            >
              Precio
            </TableHead>
            <TableHead
              className="flex items-center cursor-pointer hover:bg-muted/50 w-[85px]"
              onClick={() => handleSort("supplier")}
            >
              Proveedor
            </TableHead>
            <TableHead className="flex items-center w-[103px]">Estado</TableHead>
            <TableHead className="flex items-center w-[48px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="flex flex-col w-full">
          {sortedProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            const StatusIcon = stockStatus.icon;

            return (
              <TableRow key={product.id} className="flex justify-between">
                <TableCell className="font-mono text-sm w-[130px] flex flex-col justify-center">
                  {product.barcode}
                </TableCell>
                <TableCell className="w-[calc(100vw-240px-110px-130px-81px-55px-58px-85px-103px-48px)]">
                  <p className="font-medium text-wrap">{product.name}</p>
                  <div className="text-sm text-muted-foreground">
                    {product.brand}
                  </div>
                </TableCell>
                <TableCell className="w-[81px] flex flex-col justify-center">
                  <Badge variant="outline" className="w-full">
                    <p className="w-full text-wrap text-center">{product.category}</p>
                  </Badge>
                </TableCell>
                <TableCell className="text-right w-[55px] flex flex-col justify-center">
                  <div className="font-medium">{product.stock}</div>
                  <div className="text-xs text-muted-foreground">
                    Min: {product.min_stock}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium w-[58px] flex flex-col justify-center">
                  ${product.price.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm w-[85px] flex flex-col justify-center">{product.supplier}</TableCell>
                <TableCell className="w-[103px] flex flex-col justify-center">
                  <Badge variant={stockStatus.variant} className="gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {stockStatus.status}
                  </Badge>
                </TableCell>
                <TableCell className="w-[48px] flex flex-col justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onEdit(product)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => onDelete(product)}
                        variant="destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}