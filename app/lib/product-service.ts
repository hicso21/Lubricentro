import { demoProducts } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import type {
  Product,
  ProductStats,
  Sale,
  SaleInsert,
  ProductInsert,
  SaleUpdate,
  ProductUpdate,
} from "./types";

export const isDemoMode =
  !import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
  !import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export class ProductService {
  private static getSupabase() {
    return createClient();
  }

  /**
   * Verificar autenticación antes de operaciones críticas
   */
  private static async verifyAuth(): Promise<{
    user: any | null;
    error: unknown;
  }> {
    try {
      const supabase = this.getSupabase();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Authentication error:", authError);
        return { user: null, error: authError };
      }

      if (!user) {
        console.error("User not authenticated");
        return {
          user: null,
          error: new Error("Debes iniciar sesión para realizar esta operación"),
        };
      }

      console.log("Authenticated user:", user.email, user.id);
      return { user, error: null };
    } catch (error) {
      console.error("Auth verification error:", error);
      return { user: null, error };
    }
  }

  /**
   * GET - Obtener todos los productos
   */
  static async getAllProducts(): Promise<{
    data: Product[] | null;
    error: unknown;
  }> {
    if (isDemoMode) {
      return {
        data: demoProducts.map((p) => ({
          ...p,
          id: p.id ?? "",
          description: p.description ?? "",
          created_at: p.created_at ?? new Date().toISOString(),
          updated_at: p.updated_at ?? new Date().toISOString(),
        })),
        error: null,
      };
    }

    const supabase = this.getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn("Usuario no autenticado para obtener productos");
    }

    try {
      const pageSize = 1000;
      let allProducts: Product[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error("Error obteniendo productos:", error);
          return { data: null, error };
        }

        if (data && data.length > 0) {
          allProducts = [...allProducts, ...data];
          hasMore = data.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      return { data: allProducts, error: null };
    } catch (error) {
      console.error("Error en getAllProducts:", error);
      return { data: null, error };
    }
  }

  /**
   * GET - Obtener producto por ID
   */
  static async getProductById(
    id: string
  ): Promise<{ data: Product | null; error: unknown }> {
    if (isDemoMode) {
      const product = demoProducts.find((p) => p.id === id) || null;
      if (!product) {
        return { data: null, error: null };
      }
      const safeProduct: Product = {
        id: product.id ?? "",
        barcode: product.barcode ?? "",
        name: product.name ?? "",
        brand: product.brand ?? "",
        category: product.category ?? "",
        price: product.price ?? 0,
        cost: product.cost ?? 0,
        stock: product.stock ?? 0,
        min_stock: product.min_stock ?? 0,
        description: product.description ?? "", // Ensure it's a string
        supplier: product.supplier ?? "",
        created_at: product.created_at ?? new Date().toISOString(),
        updated_at: product.updated_at ?? new Date().toISOString(),
      };
      return { data: safeProduct, error: null };
    }

    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error obteniendo producto por ID:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error en getProductById:", error);
      return { data: null, error };
    }
  }

  /**
   * GET - Buscar producto por código de barras
   */
  static async getProductByBarcode(
    barcode: string
  ): Promise<{ data: Product | null; error: unknown }> {
    if (isDemoMode) {
      const product = demoProducts.find((p) => p.barcode === barcode) || null;
      if (!product) {
        return { data: null, error: null };
      }
      const safeProduct: Product = {
        id: product.id ?? "",
        barcode: product.barcode ?? "",
        name: product.name ?? "",
        brand: product.brand ?? "",
        category: product.category ?? "",
        price: product.price ?? 0,
        cost: product.cost ?? 0,
        stock: product.stock ?? 0,
        min_stock: product.min_stock ?? 0,
        description: product.description ?? "", // Ensure it's a string
        supplier: product.supplier ?? "",
        created_at: product.created_at ?? new Date().toISOString(),
        updated_at: product.updated_at ?? new Date().toISOString(),
      };
      return { data: safeProduct, error: null };
    }

    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("barcode", barcode)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error buscando producto por código de barras:", error);
        return { data: null, error };
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error("Error en getProductByBarcode:", error);
      return { data: null, error };
    }
  }

  /**
   * POST - Crear nuevo producto con verificación de autenticación
   */
  static async createProduct(
    product: ProductInsert
  ): Promise<{ data: Product | null; error: unknown }> {
    if (isDemoMode) {
      const existingProduct = demoProducts.find(
        (p) => p.barcode === product.barcode
      );
      if (existingProduct) {
        return {
          data: null,
          error: { message: "Ya existe un producto con este código de barras" },
        };
      }

      const newProduct: Product = {
        id: `demo_${Date.now()}`,
        barcode: product.barcode ?? "",
        name: product.name ?? "",
        brand: product.brand ?? "",
        category: product.category ?? "",
        price: product.price ?? 0,
        cost: product.cost ?? 0,
        stock: product.stock ?? 0,
        min_stock: product.min_stock ?? 0,
        description: product.description ?? "", // Ensure it's a string
        supplier: product.supplier ?? "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("✅ Producto creado en modo demo:", newProduct.name);
      return { data: newProduct, error: null };
    }

    try {
      const { user, error: authError } = await this.verifyAuth();
      if (authError || !user) {
        return { data: null, error: authError };
      }

      const { data: existingProduct } = await this.getProductByBarcode(
        product.barcode
      );
      if (existingProduct) {
        return {
          data: null,
          error: { message: "Ya existe un producto con este código de barras" },
        };
      }

      // Clean the product data and ensure description is a string
      const cleanProduct: Partial<ProductInsert> = Object.fromEntries(
        Object.entries(product).filter(
          ([_, value]) => value !== undefined && value !== null && value !== ""
        )
      );

      // Ensure description is always a string, never undefined
      if (cleanProduct.description === undefined) {
        cleanProduct.description = "";
      }

      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            ...cleanProduct,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creando producto:", error);
        return { data: null, error };
      }

      console.log("✅ Producto creado exitosamente:", data.name);
      return { data, error: null };
    } catch (error) {
      console.error("Error en createProduct:", error);
      return { data: null, error };
    }
  }

  /**
   * PUT - Actualizar producto existente
   */
  static async updateProduct(
    id: string,
    updates: ProductUpdate
  ): Promise<{ data: Product | null; error: unknown }> {
    console.log("=== UPDATE PRODUCT DEBUG ===");
    console.log("Product ID:", id);
    console.log("Updates:", updates);

    if (isDemoMode) {
      const productIndex = demoProducts.findIndex((p) => p.id === id);
      if (productIndex === -1) {
        return { data: null, error: { message: "Producto no encontrado" } };
      }

      const updatedProduct: Product = {
        id: demoProducts[productIndex].id ?? "",
        barcode: updates.barcode ?? demoProducts[productIndex].barcode ?? "",
        name: updates.name ?? demoProducts[productIndex].name ?? "",
        brand: updates.brand ?? demoProducts[productIndex].brand ?? "",
        category: updates.category ?? demoProducts[productIndex].category ?? "",
        price: updates.price ?? demoProducts[productIndex].price ?? 0,
        cost: updates.cost ?? demoProducts[productIndex].cost ?? 0,
        stock: updates.stock ?? demoProducts[productIndex].stock ?? 0,
        min_stock:
          updates.min_stock ?? demoProducts[productIndex].min_stock ?? 0,
        description:
          updates.description ?? demoProducts[productIndex].description ?? "",
        supplier: updates.supplier ?? demoProducts[productIndex].supplier ?? "",
        created_at:
          demoProducts[productIndex].created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("✅ Producto actualizado en modo demo:", updatedProduct.name);
      return { data: updatedProduct, error: null };
    }

    try {
      const { user, error: authError } = await this.verifyAuth();
      if (authError || !user) {
        return { data: null, error: authError };
      }

      const supabase = this.getSupabase();

      const { data: existingProduct, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching product:", fetchError);
        return { data: null, error: fetchError };
      }

      if (!existingProduct) {
        return {
          data: null,
          error: new Error(`Product with ID ${id} not found`),
        };
      }

      if (updates.barcode && updates.barcode !== existingProduct.barcode) {
        const { data: duplicateProduct } = await this.getProductByBarcode(
          updates.barcode
        );
        if (duplicateProduct && duplicateProduct.id !== id) {
          return {
            data: null,
            error: {
              message: "Ya existe un producto con este código de barras",
            },
          };
        }
      }

      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      const { data: updateData, error: updateError } = await supabase
        .from("products")
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (updateError) {
        console.error("Update failed:", updateError);
        return { data: null, error: updateError };
      }

      if (!updateData || updateData.length === 0) {
        return {
          data: null,
          error: new Error("Update failed: No rows returned."),
        };
      }

      console.log("✅ Producto actualizado exitosamente:", updateData[0].name);
      return { data: updateData[0], error: null };
    } catch (error) {
      console.error("Error en updateProduct:", error);
      return { data: null, error };
    }
  }

  /**
   * DELETE - Eliminar producto
   */
  static async deleteProduct(
    id: string
  ): Promise<{ success: boolean; error: unknown }> {
    console.log("=== DELETE PRODUCT DEBUG ===");
    console.log("Product ID to delete:", id);

    if (isDemoMode) {
      const productExists = demoProducts.some((p) => p.id === id);
      if (!productExists) {
        return { success: false, error: { message: "Producto no encontrado" } };
      }

      console.log("✅ Producto eliminado en modo demo");
      return { success: true, error: null };
    }

    try {
      const { user, error: authError } = await this.verifyAuth();
      if (authError || !user) {
        return { success: false, error: authError };
      }

      const supabase = this.getSupabase();

      const { data: existingProduct, error: fetchError } = await supabase
        .from("products")
        .select("id, name")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Product not found:", fetchError);
        return {
          success: false,
          error: new Error(`Producto con ID ${id} no encontrado`),
        };
      }

      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log("✅ Producto eliminado exitosamente");
      return { success: true, error: null };
    } catch (error) {
      console.error("Error en deleteProduct:", error);
      return { success: false, error };
    }
  }

  /**
   * GET - Obtener estadísticas completas del inventario
   * Incluye análisis de stock, valor, alertas y distribución por categorías
   */
  static async getInventoryStats(): Promise<{
    data: {
      totalProducts: number;
      totalInventoryValue: number;
      totalCostValue: number;
      potentialProfit: number;
      lowStockCount: number;
      outOfStockCount: number;
      averageStockLevel: number;
      categoryDistribution: Array<{
        category: string;
        count: number;
        totalValue: number;
        percentage: number;
      }>;
      topValueProducts: Array<{
        id: string;
        name: string;
        brand: string;
        stock: number;
        price: number;
        totalValue: number;
      }>;
      lowStockAlerts: Array<{
        id: string;
        name: string;
        brand: string;
        barcode: string;
        current_stock: number;
        min_stock: number;
        status: "low_stock" | "out_of_stock";
        urgency: "critical" | "warning" | "attention";
      }>;
      stockDistribution: {
        healthy: number; // Stock > min_stock * 2
        warning: number; // Stock entre min_stock y min_stock * 2
        low: number; // Stock <= min_stock pero > 0
        outOfStock: number; // Stock = 0
      };
    } | null;
    error: unknown;
  }> {
    console.log("=== GET INVENTORY STATS DEBUG ===");

    if (isDemoMode) {
      // Datos demo realistas para el inventario
      return {
        data: {
          totalProducts: 1234,
          totalInventoryValue: 456789,
          totalCostValue: 298543,
          potentialProfit: 158246,
          lowStockCount: 23,
          outOfStockCount: 5,
          averageStockLevel: 28.5,
          categoryDistribution: [
            {
              category: "Aceites y Lubricantes",
              count: 450,
              totalValue: 198750,
              percentage: 36.5,
            },
            {
              category: "Filtros",
              count: 320,
              totalValue: 89600,
              percentage: 25.9,
            },
            {
              category: "Líquidos de Frenos",
              count: 180,
              totalValue: 50400,
              percentage: 14.6,
            },
            {
              category: "Repuestos Motor",
              count: 150,
              totalValue: 67500,
              percentage: 12.2,
            },
            {
              category: "Accesorios",
              count: 134,
              totalValue: 50539,
              percentage: 10.8,
            },
          ],
          topValueProducts: [
            {
              id: "demo_high_1",
              name: "Kit Distribución Timing",
              brand: "Gates",
              stock: 8,
              price: 25000,
              totalValue: 200000,
            },
            {
              id: "demo_high_2",
              name: "Aceite Sintético Racing 0W-20",
              brand: "Mobil 1",
              stock: 15,
              price: 8500,
              totalValue: 127500,
            },
            {
              id: "demo_high_3",
              name: "Turbo Reconstruido GT2860",
              brand: "Garrett",
              stock: 2,
              price: 45000,
              totalValue: 90000,
            },
            {
              id: "demo_high_4",
              name: "Suspensión Coilover KW V3",
              brand: "KW Suspension",
              stock: 1,
              price: 85000,
              totalValue: 85000,
            },
            {
              id: "demo_high_5",
              name: "ECU Performance Chip",
              brand: "APR",
              stock: 3,
              price: 28000,
              totalValue: 84000,
            },
          ],
          lowStockAlerts: [
            {
              id: "demo_alert_1",
              name: "Aceite Mobil 1 5W-30",
              brand: "Mobil 1",
              barcode: "7790001234567",
              current_stock: 2,
              min_stock: 10,
              status: "low_stock" as const,
              urgency: "critical" as const,
            },
            {
              id: "demo_alert_2",
              name: "Filtro de Aire K&N",
              brand: "K&N",
              barcode: "7790001234568",
              current_stock: 0,
              min_stock: 5,
              status: "out_of_stock" as const,
              urgency: "critical" as const,
            },
            {
              id: "demo_alert_3",
              name: "Bujías NGK Iridium",
              brand: "NGK",
              barcode: "7790001234569",
              current_stock: 5,
              min_stock: 15,
              status: "low_stock" as const,
              urgency: "warning" as const,
            },
            {
              id: "demo_alert_4",
              name: "Pastillas de Freno Brembo",
              brand: "Brembo",
              barcode: "7790001234570",
              current_stock: 8,
              min_stock: 12,
              status: "low_stock" as const,
              urgency: "attention" as const,
            },
            {
              id: "demo_alert_5",
              name: "Refrigerante Valvoline",
              brand: "Valvoline",
              barcode: "7790001234571",
              current_stock: 0,
              min_stock: 8,
              status: "out_of_stock" as const,
              urgency: "critical" as const,
            },
          ],
          stockDistribution: {
            healthy: 980, // 79.4%
            warning: 201, // 16.3%
            low: 28, // 2.3%
            outOfStock: 25, // 2.0%
          },
        },
        error: null,
      };
    }

    try {
      const { data: products, error } = await this.getAllProducts();

      if (error || !products) {
        console.error("Error obteniendo productos para estadísticas:", error);
        return { data: null, error };
      }

      if (products.length === 0) {
        return {
          data: {
            totalProducts: 0,
            totalInventoryValue: 0,
            totalCostValue: 0,
            potentialProfit: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
            averageStockLevel: 0,
            categoryDistribution: [],
            topValueProducts: [],
            lowStockAlerts: [],
            stockDistribution: {
              healthy: 0,
              warning: 0,
              low: 0,
              outOfStock: 0,
            },
          },
          error: null,
        };
      }

      // Cálculos básicos
      const totalProducts = products.length;
      const totalInventoryValue = products.reduce(
        (sum, product) => sum + product.price * product.stock,
        0
      );
      const totalCostValue = products.reduce(
        (sum, product) => sum + product.cost * product.stock,
        0
      );
      const potentialProfit = totalInventoryValue - totalCostValue;
      const averageStockLevel =
        products.reduce((sum, product) => sum + product.stock, 0) /
        totalProducts;

      // Contar alertas de stock
      const lowStockProducts = products.filter(
        (p) => p.stock <= p.min_stock && p.stock > 0
      );
      const outOfStockProducts = products.filter((p) => p.stock === 0);

      // Distribución por categorías
      const categoryMap = products.reduce((acc, product) => {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = {
            count: 0,
            totalValue: 0,
          };
        }
        acc[category].count++;
        acc[category].totalValue += product.price * product.stock;
        return acc;
      }, {} as Record<string, { count: number; totalValue: number }>);

      const categoryDistribution = Object.entries(categoryMap)
        .map(([category, stats]) => ({
          category,
          count: stats.count,
          totalValue: stats.totalValue,
          percentage: Math.round((stats.count / totalProducts) * 1000) / 10, // 1 decimal
        }))
        .sort((a, b) => b.count - a.count);

      // Top productos por valor total
      const topValueProducts = products
        .map((product) => ({
          id: product.id || "", // Usar string vacío como fallback
          name: product.name,
          brand: product.brand,
          stock: product.stock,
          price: product.price,
          totalValue: product.price * product.stock,
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      // Alertas de stock bajo con niveles de urgencia
      const lowStockAlerts = [
        ...outOfStockProducts.map((product) => ({
          id: product.id || "", // Agregar fallback
          name: product.name,
          brand: product.brand,
          barcode: product.barcode,
          current_stock: product.stock,
          min_stock: product.min_stock,
          status: "out_of_stock" as const,
          urgency: "critical" as const,
        })),
        ...lowStockProducts.map((product) => {
          const stockPercentage = product.stock / product.min_stock;
          let urgency: "critical" | "warning" | "attention";

          if (stockPercentage <= 0.3) urgency = "critical";
          else if (stockPercentage <= 0.6) urgency = "warning";
          else urgency = "attention";

          return {
            id: product.id || "", // Agregar fallback
            name: product.name,
            brand: product.brand,
            barcode: product.barcode,
            current_stock: product.stock,
            min_stock: product.min_stock,
            status: "low_stock" as const,
            urgency,
          };
        }),
      ].sort((a, b) => {
        // Ordenar por urgencia: critical, warning, attention
        const urgencyOrder = { critical: 0, warning: 1, attention: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });

      // Distribución de niveles de stock
      const stockDistribution = products.reduce(
        (acc, product) => {
          const stockRatio = product.stock / (product.min_stock || 1);

          if (product.stock === 0) {
            acc.outOfStock++;
          } else if (product.stock <= product.min_stock) {
            acc.low++;
          } else if (stockRatio <= 2) {
            acc.warning++;
          } else {
            acc.healthy++;
          }

          return acc;
        },
        {
          healthy: 0,
          warning: 0,
          low: 0,
          outOfStock: 0,
        }
      );

      const inventoryStats = {
        totalProducts,
        totalInventoryValue: Math.round(totalInventoryValue),
        totalCostValue: Math.round(totalCostValue),
        potentialProfit: Math.round(potentialProfit),
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
        averageStockLevel: Math.round(averageStockLevel * 10) / 10, // 1 decimal
        categoryDistribution,
        topValueProducts,
        lowStockAlerts,
        stockDistribution,
      };

      console.log("✅ Estadísticas de inventario calculadas:", {
        totalProducts: inventoryStats.totalProducts,
        totalValue: inventoryStats.totalInventoryValue,
        alerts: inventoryStats.lowStockCount + inventoryStats.outOfStockCount,
      });

      return { data: inventoryStats, error: null };
    } catch (error) {
      console.error("Error en getInventoryStats:", error);
      return { data: null, error };
    }
  }

  /**
   * Función auxiliar para verificar la integridad del stock después de una venta
   */
  static async verifyStockIntegrity(
    productId: string,
    expectedStock: number
  ): Promise<boolean> {
    try {
      const { data: product, error } = await this.getProductById(productId);

      if (error || !product) {
        console.error("No se pudo verificar integridad del stock:", error);
        return false;
      }

      const isValid = product.stock === expectedStock;

      if (!isValid) {
        console.warn("Inconsistencia detectada en stock:", {
          productId,
          expectedStock,
          actualStock: product.stock,
        });
      }

      return isValid;
    } catch (error) {
      console.error("Error verificando integridad de stock:", error);
      return false;
    }
  }

  /**
   * POST - Crear múltiples ventas en una transacción (para ventas con múltiples productos)
   */
  static async createBulkSale(
    saleItems: SaleInsert[],
    saleNumber?: string,
    customerInfo?: {
      customer_name?: string;
      customer_email?: string;
      payment_method?: "cash" | "card" | "transfer" | "other";
      notes?: string;
    }
  ): Promise<{ data: Sale[] | null; error: unknown }> {
    console.log("=== CREATE BULK SALE DEBUG ===");
    console.log("Sale items:", saleItems.length);

    if (isDemoMode) {
      const bulkSales: Sale[] = saleItems.map((item, index) => ({
        id: `sale_bulk_demo_${Date.now()}_${index}`,
        sale_number: saleNumber || `V-${Date.now()}`,
        ...item,
        sale_date: item.sale_date || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total: item.final_amount,
      }));

      console.log("✅ Venta múltiple creada en modo demo");
      return { data: bulkSales, error: null };
    }

    const supabase = this.getSupabase();

    try {
      // 1. Verificar autenticación
      const { user, error: authError } = await this.verifyAuth();
      if (authError || !user) {
        return { data: null, error: authError };
      }

      // 2. Validar todos los productos y stock antes de proceder
      const productValidations = await Promise.all(
        saleItems.map(async (item) => {
          const { data: product, error } = await this.getProductById(
            item.product_id
          );

          if (error || !product) {
            return {
              valid: false,
              error: `Producto ${item.product_id} no encontrado`,
            };
          }

          if (product.stock < item.quantity) {
            return {
              valid: false,
              error: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Requerido: ${item.quantity}`,
            };
          }

          return { valid: true, product };
        })
      );

      // Verificar si todas las validaciones pasaron
      const failedValidation = productValidations.find((v) => !v.valid);
      if (failedValidation) {
        return { data: null, error: { message: failedValidation.error } };
      }

      // 3. Preparar datos para inserción
      const bulkSaleNumber = saleNumber || `V-${Date.now()}`;
      const saleDate = new Date().toISOString();

      const salesForInsert = saleItems.map((item, index) => ({
        ...Object.fromEntries(
          Object.entries(item).filter(
            ([_, value]) =>
              value !== undefined && value !== null && value !== ""
          )
        ),
        id: crypto.randomUUID(),
        sale_number: bulkSaleNumber,
        sale_date: saleDate,
        created_at: saleDate,
        updated_at: saleDate,
        ...customerInfo,
      }));

      // 4. Insertar todas las ventas
      const { data: insertedSales, error: salesError } = await supabase
        .from("sales")
        .insert(salesForInsert)
        .select();

      if (salesError) {
        console.error("Error creando ventas múltiples:", salesError);
        return { data: null, error: salesError };
      }

      // 5. Actualizar stock de todos los productos
      const stockUpdates = await Promise.all(
        saleItems.map(async (item, index) => {
          const validation = productValidations[index];
          if (!validation.valid || !validation.product) return null;

          const newStock = validation.product.stock - item.quantity;

          const { error: updateError } = await supabase
            .from("products")
            .update({
              stock: newStock,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.product_id);

          if (updateError) {
            console.error(
              `Error actualizando stock para producto ${item.product_id}:`,
              updateError
            );
            return { error: updateError, productId: item.product_id };
          }

          return { success: true, productId: item.product_id, newStock };
        })
      );

      // Verificar si hubo errores en las actualizaciones de stock
      const stockErrors = stockUpdates.filter((update) => update?.error);
      if (stockErrors.length > 0) {
        console.error("Errores en actualización de stock:", stockErrors);

        // En un escenario real, aquí deberías revertir las ventas creadas
        // Por simplicidad, solo loggeamos el error
        console.warn(
          "ADVERTENCIA: Algunas actualizaciones de stock fallaron. Se requiere intervención manual."
        );
      }

      // 6. Preparar datos de respuesta
      const finalSalesData: Sale[] = insertedSales.map((sale) => ({
        ...sale,
        total: sale.final_amount,
      }));

      console.log("✅ Venta múltiple completada:", {
        saleNumber: bulkSaleNumber,
        itemsCount: finalSalesData.length,
        totalAmount: finalSalesData.reduce(
          (sum, sale) => sum + sale.final_amount,
          0
        ),
      });

      return { data: finalSalesData, error: null };
    } catch (error) {
      console.error("Error general en createBulkSale:", error);
      return { data: null, error };
    }
  }

  // ... resto de los métodos siguen el mismo patrón

  /**
   * SALES CRUD OPERATIONS
   */

  /**
   * GET - Obtener todas las ventas
   */
  static async getAllSales(): Promise<{ data: Sale[] | null; error: unknown }> {
    if (isDemoMode) {
      // Generar datos demo de ventas si no existen
      const demoSales: Sale[] = [
        {
          id: "sale_demo_1",
          sale_number: "V-001",
          product_id: "demo_1",
          product_barcode: "7790001234567",
          product_name: "Aceite Shell Helix 10W-40",
          quantity: 2,
          unit_price: 5500,
          total_amount: 11000,
          discount_amount: 0,
          final_amount: 11000,
          payment_method: "cash",
          customer_name: "Juan Pérez",
          sale_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total: undefined,
        },
        {
          id: "sale_demo_2",
          sale_number: "V-002",
          product_id: "demo_2",
          product_barcode: "7790001234568",
          product_name: "Filtro de Aceite Mann",
          quantity: 1,
          unit_price: 2800,
          total_amount: 2800,
          discount_amount: 200,
          final_amount: 2600,
          payment_method: "card",
          customer_name: "María García",
          sale_date: new Date(Date.now() - 86400000).toISOString(), // Ayer
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          total: undefined,
        },
      ];

      return { data: demoSales, error: null };
    }

    const supabase = this.getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Usuario no autenticado para obtener ventas");
    }

    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error obteniendo ventas:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error en getAllSales:", error);
      return { data: null, error };
    }
  }

  /**
   * GET - Obtener venta por ID
   */
  static async getSaleById(
    id: string
  ): Promise<{ data: Sale | null; error: unknown }> {
    if (isDemoMode) {
      // En modo demo, buscar en datos simulados
      const demoSale: Sale = {
        id: id,
        sale_number: "V-DEMO",
        product_id: "demo_1",
        product_barcode: "7790001234567",
        product_name: "Aceite Shell Helix 10W-40",
        quantity: 1,
        unit_price: 5500,
        total_amount: 5500,
        discount_amount: 0,
        final_amount: 5500,
        payment_method: "cash",
        sale_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total: undefined,
      };

      return { data: demoSale, error: null };
    }

    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error obteniendo venta por ID:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error en getSaleById:", error);
      return { data: null, error };
    }
  }

  /**
   * GET - Obtener ventas por rango de fechas
   */
  static async getSalesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<{ data: Sale[] | null; error: unknown }> {
    if (isDemoMode) {
      // Retornar datos demo filtrados
      const demoSales: Sale[] = [
        {
          id: "sale_demo_1",
          sale_number: "V-001",
          product_id: "demo_1",
          product_barcode: "7790001234567",
          product_name: "Aceite Shell Helix 10W-40",
          quantity: 2,
          unit_price: 5500,
          total_amount: 11000,
          discount_amount: 0,
          final_amount: 11000,
          payment_method: "cash",
          sale_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total: undefined,
        },
      ];

      return { data: demoSales, error: null };
    }

    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .gte("sale_date", startDate)
        .lte("sale_date", endDate)
        .order("sale_date", { ascending: false });

      if (error) {
        console.error("Error obteniendo ventas por rango de fechas:", error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error en getSalesByDateRange:", error);
      return { data: null, error };
    }
  }

  /**
   * POST - Crear nueva venta con verificación de autenticación
   */
  static async createSale(
    sale: SaleInsert
  ): Promise<{ data: Sale | null; error: unknown }> {
    console.log("=== CREATE SALE DEBUG ===");
    console.log("Sale data:", sale);

    if (isDemoMode) {
      const newSale: Sale = {
        id: `sale_demo_${Date.now()}`,
        sale_number: sale.sale_number || `V-${Date.now()}`,
        product_id: sale.product_id,
        product_barcode: sale.product_barcode,
        product_name: sale.product_name,
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total_amount: sale.total_amount,
        discount_amount: sale.discount_amount || 0,
        final_amount: sale.final_amount,
        payment_method: sale.payment_method || "cash",
        customer_name: sale.customer_name,
        customer_email: sale.customer_email,
        notes: sale.notes,
        sale_date: sale.sale_date || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total: sale.final_amount,
      };

      console.log("✅ Venta creada en modo demo:", newSale.sale_number);
      return { data: newSale, error: null };
    }

    const supabase = this.getSupabase();
    let saleData: Sale | null = null;
    let stockUpdated = false;

    try {
      // 1. Verificar autenticación
      const { user, error: authError } = await this.verifyAuth();
      if (authError || !user) {
        return { data: null, error: authError };
      }

      // 2. Verificar que el producto existe y obtener datos actuales
      const { data: product, error: productError } = await this.getProductById(
        sale.product_id
      );
      if (productError) {
        console.error("Error fetching product:", productError);
        return { data: null, error: productError };
      }

      if (!product) {
        return {
          data: null,
          error: { message: "El producto especificado no existe" },
        };
      }

      // 3. Verificar stock disponible
      if (product.stock < sale.quantity) {
        return {
          data: null,
          error: {
            message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Requerido: ${sale.quantity}`,
          },
        };
      }

      // 4. Preparar datos limpios para la venta
      const cleanSale = Object.fromEntries(
        Object.entries(sale).filter(
          ([_, value]) => value !== undefined && value !== null && value !== ""
        )
      );

      const saleId = crypto.randomUUID();
      const saleDate = sale.sale_date || new Date().toISOString();
      const saleNumber = sale.sale_number || `V-${Date.now()}`;

      // 5. Calcular nuevo stock
      const newStock = product.stock - sale.quantity;

      console.log("Transacción iniciada:", {
        saleId,
        saleNumber,
        productId: sale.product_id,
        currentStock: product.stock,
        quantity: sale.quantity,
        newStock,
      });

      // Paso 1: Crear la venta
      const { data: insertedSale, error: saleInsertError } = await supabase
        .from("sales")
        .insert([
          {
            ...cleanSale,
            id: saleId,
            sale_number: saleNumber,
            sale_date: saleDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (saleInsertError || !insertedSale) {
        console.error("Error creando venta:", saleInsertError);
        throw saleInsertError || new Error("No se pudo crear la venta");
      }

      saleData = insertedSale;
      console.log("✅ Venta creada exitosamente:", saleData?.sale_number);

      // Paso 2: Actualizar stock del producto
      const { data: updatedProduct, error: stockUpdateError } = await supabase
        .from("products")
        .update({
          stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sale.product_id)
        .select()
        .single();

      if (stockUpdateError) {
        console.error("Error actualizando stock:", stockUpdateError);

        // Si falla la actualización del stock, eliminar la venta creada
        console.log("🔄 Revirtiendo venta debido a error en stock...");
        await supabase.from("sales").delete().eq("id", saleId);

        throw new Error(
          `Error actualizando inventario: ${stockUpdateError.message}`
        );
      }

      stockUpdated = true;
      console.log("✅ Stock actualizado exitosamente:", {
        product: updatedProduct?.name || product.name,
        previousStock: product.stock,
        newStock: updatedProduct?.stock || newStock,
      });

      // Agregar el campo total para compatibilidad con el frontend
      const finalSaleData: Sale = {
        ...(saleData as Sale),
        total: saleData?.final_amount,
      };

      console.log("✅ Transacción completada exitosamente");
      return { data: finalSaleData, error: null };
    } catch (transactionError) {
      console.error("Error en transacción:", transactionError);

      // Limpiar en caso de error parcial
      if (saleData && !stockUpdated) {
        try {
          console.log(
            "🔄 Limpiando venta creada debido a error en transacción..."
          );
          await supabase.from("sales").delete().eq("id", saleData.id);
        } catch (cleanupError) {
          console.error("Error limpiando venta:", cleanupError);
        }
      }

      return { data: null, error: transactionError };
    }
  }

  /**
   * PUT - Actualizar venta existente
   */
  static async updateSale(
    id: string,
    updates: SaleUpdate
  ): Promise<{ data: Sale | null; error: unknown }> {
    console.log("=== UPDATE SALE DEBUG ===");
    console.log("Sale ID:", id);
    console.log("Updates:", updates);

    if (isDemoMode) {
      const updatedSale: Sale = {
        id: id,
        sale_number: updates.sale_number || "V-DEMO-UPDATED",
        product_id: updates.product_id || "demo_1",
        product_barcode: updates.product_barcode || "7790001234567",
        product_name: updates.product_name || "Producto Demo",
        quantity: updates.quantity || 1,
        unit_price: updates.unit_price || 1000,
        total_amount: updates.total_amount || 1000,
        discount_amount: updates.discount_amount || 0,
        final_amount: updates.final_amount || 1000,
        payment_method: updates.payment_method || "cash",
        customer_name: updates.customer_name,
        customer_email: updates.customer_email,
        notes: updates.notes,
        sale_date: updates.sale_date || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total: undefined,
      };

      console.log(
        "✅ Venta actualizada en modo demo:",
        updatedSale.sale_number
      );
      return { data: updatedSale, error: null };
    }

    try {
      const { user, error: authError } = await this.verifyAuth();
      if (authError || !user) {
        return { data: null, error: authError };
      }

      const supabase = this.getSupabase();

      // Verificar que la venta existe
      const { data: existingSale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Error fetching sale:", fetchError);
        return { data: null, error: fetchError };
      }

      if (!existingSale) {
        return {
          data: null,
          error: new Error(`Venta con ID ${id} no encontrada`),
        };
      }

      // Si se cambia la cantidad, manejar el stock
      if (updates.quantity && updates.quantity !== existingSale.quantity) {
        const { data: product } = await this.getProductById(
          existingSale.product_id
        );
        if (product) {
          const stockDifference = existingSale.quantity - updates.quantity;
          const newStock = product.stock + stockDifference;

          if (newStock < 0) {
            return {
              data: null,
              error: { message: `Stock insuficiente para la nueva cantidad` },
            };
          }

          await this.updateProduct(existingSale.product_id, {
            stock: newStock,
          });
        }
      }

      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      const { data: updateData, error: updateError } = await supabase
        .from("sales")
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();

      if (updateError) {
        console.error("Update failed:", updateError);
        return { data: null, error: updateError };
      }

      if (!updateData || updateData.length === 0) {
        return {
          data: null,
          error: new Error("Update failed: No rows returned."),
        };
      }

      console.log(
        "✅ Venta actualizada exitosamente:",
        updateData[0].sale_number
      );
      return { data: updateData[0], error: null };
    } catch (error) {
      console.error("Error en updateSale:", error);
      return { data: null, error };
    }
  }

  /**
   * DELETE - Eliminar venta (y restaurar stock)
   */
  static async deleteSale(
    id: string
  ): Promise<{ success: boolean; error: unknown }> {
    console.log("=== DELETE SALE DEBUG ===");
    console.log("Sale ID to delete:", id);

    if (isDemoMode) {
      console.log("✅ Venta eliminada en modo demo");
      return { success: true, error: null };
    }

    try {
      const { user, error: authError } = await this.verifyAuth();
      if (authError || !user) {
        return { success: false, error: authError };
      }

      const supabase = this.getSupabase();

      // Obtener la venta para restaurar el stock
      const { data: existingSale, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("Sale not found:", fetchError);
        return {
          success: false,
          error: new Error(`Venta con ID ${id} no encontrada`),
        };
      }

      // Restaurar stock del producto
      const { data: product } = await this.getProductById(
        existingSale.product_id
      );
      if (product) {
        const restoredStock = product.stock + existingSale.quantity;
        await this.updateProduct(existingSale.product_id, {
          stock: restoredStock,
        });
      }

      // Eliminar la venta
      const { error: deleteError } = await supabase
        .from("sales")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log("✅ Venta eliminada exitosamente y stock restaurado");
      return { success: true, error: null };
    } catch (error) {
      console.error("Error en deleteSale:", error);
      return { success: false, error };
    }
  }

  /**
   * DELETE - Eliminar todas las ventas de un sale_number y restaurar stock
   * Esta función maneja la eliminación de ventas múltiples que comparten el mismo sale_number
   */
  static async deleteSaleBySaleNumber(
    saleNumber: string
  ): Promise<{ success: boolean; error: unknown }> {
    console.log("=== DELETE SALE BY SALE_NUMBER DEBUG ===");
    console.log("Sale Number to delete:", saleNumber);

    if (isDemoMode) {
      console.log("✅ Venta eliminada en modo demo");
      return { success: true, error: null };
    }

    try {
      const { user, error: authError } = await this.verifyAuth();
      if (authError || !user) {
        return { success: false, error: authError };
      }

      const supabase = this.getSupabase();

      // 1. Obtener todas las ventas con ese sale_number
      const { data: salesToDelete, error: fetchError } = await supabase
        .from("sales")
        .select("*")
        .eq("sale_number", saleNumber);

      if (fetchError) {
        console.error("Error fetching sales:", fetchError);
        return {
          success: false,
          error: new Error(
            `No se encontraron ventas con el número ${saleNumber}`
          ),
        };
      }

      if (!salesToDelete || salesToDelete.length === 0) {
        return {
          success: false,
          error: new Error(
            `No se encontraron ventas con el número ${saleNumber}`
          ),
        };
      }

      console.log(`Encontradas ${salesToDelete.length} ventas para eliminar`);

      // 2. PRIMERO eliminar las ventas de la base de datos
      // Esto previene que se ejecuten triggers o se procesen duplicados
      const { error: deleteError } = await supabase
        .from("sales")
        .delete()
        .eq("sale_number", saleNumber);

      if (deleteError) {
        console.error("Error eliminando ventas:", deleteError);
        return { success: false, error: deleteError };
      }

      console.log(`✅ Ventas eliminadas de la base de datos`);

      // 3. DESPUÉS restaurar el stock de cada producto
      // Agrupar por product_id para sumar todas las cantidades
      const stockToRestore = salesToDelete.reduce((acc, sale) => {
        if (!acc[sale.product_id]) {
          acc[sale.product_id] = 0;
        }
        acc[sale.product_id] += sale.quantity;
        return acc;
      }, {} as Record<string, number>);

      console.log("Stock a restaurar por producto:", stockToRestore);

      // 4. Restaurar stock para cada producto único
      const stockRestorations = await Promise.all(
        Object.entries(stockToRestore).map(
          async ([productId, quantityToRestore]) => {
            try {
              // Obtener el stock actual del producto
              const { data: product, error: productError } =
                await this.getProductById(productId);

              if (productError || !product) {
                console.error(
                  `Producto ${productId} no encontrado:`,
                  productError
                );
                return {
                  success: false,
                  productId,
                  error: productError || "Producto no encontrado",
                };
              }

              // Calcular el nuevo stock
              const restoredStock = product.stock + quantityToRestore;

              console.log(`Restaurando stock para ${product.name}:`, {
                currentStock: product.stock,
                quantityToRestore,
                newStock: restoredStock,
              });

              // Actualizar el stock
              const { error: updateError } = await supabase
                .from("products")
                .update({
                  stock: restoredStock,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", productId);

              if (updateError) {
                console.error(
                  `Error restaurando stock para ${product.name}:`,
                  updateError
                );

                // CRÍTICO: Si falla la restauración, registrar pero continuar
                // En producción, considera implementar una cola de reintentos
                return {
                  success: false,
                  productId,
                  productName: product.name,
                  error: updateError,
                };
              }

              console.log(
                `✅ Stock restaurado para ${product.name}: ${product.stock} → ${restoredStock} (+${quantityToRestore})`
              );

              return {
                success: true,
                productId,
                productName: product.name,
                previousStock: product.stock,
                newStock: restoredStock,
                quantityRestored: quantityToRestore,
              };
            } catch (error) {
              console.error(
                `Error procesando restauración para producto ${productId}:`,
                error
              );
              return {
                success: false,
                productId,
                error,
              };
            }
          }
        )
      );

      // 5. Verificar resultados
      const failedRestorations = stockRestorations.filter((r) => !r.success);
      const successfulRestorations = stockRestorations.filter((r) => r.success);

      if (failedRestorations.length > 0) {
        console.error(
          "⚠️ Errores en restauración de stock:",
          failedRestorations
        );

        // Las ventas ya fueron eliminadas, pero algunos stocks no se restauraron
        return {
          success: false,
          error: new Error(
            `Venta eliminada pero falló la restauración de stock de ${failedRestorations.length} producto(s). Revisa el inventario manualmente.`
          ),
        };
      }

      console.log(`✅ Operación completada exitosamente:`);
      console.log(`   - Venta ${saleNumber} eliminada`);
      console.log(`   - ${salesToDelete.length} registros de venta eliminados`);
      console.log(
        `   - ${successfulRestorations.length} productos con stock restaurado`
      );

      return { success: true, error: null };
    } catch (error) {
      console.error("Error en deleteSaleBySaleNumber:", error);
      return { success: false, error };
    }
  }

  /**
   * Función auxiliar para generar sale_number único y secuencial
   */
  static generateSaleNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const timestamp = Date.now().toString().slice(-6);

    return `V-${year}${month}${day}-${timestamp}`;
  }

  /**
   * GET - Obtener estadísticas de ventas
   */
  static async getSalesStats(dateRange?: {
    start: string;
    end: string;
  }): Promise<{
    data: {
      totalSales: number;
      totalRevenue: number;
      averageTicket: number;
      topProducts: Array<{
        product_name: string;
        total_quantity: number;
        total_revenue: number;
      }>;
    } | null;
    error: unknown;
  }> {
    if (isDemoMode) {
      return {
        data: {
          totalSales: 45,
          totalRevenue: 234567,
          averageTicket: 5212,
          topProducts: [
            {
              product_name: "Aceite Shell Helix 10W-40",
              total_quantity: 15,
              total_revenue: 82500,
            },
            {
              product_name: "Filtro de Aceite Mann",
              total_quantity: 12,
              total_revenue: 33600,
            },
            {
              product_name: "Líquido de Frenos DOT 4",
              total_quantity: 8,
              total_revenue: 22400,
            },
          ],
        },
        error: null,
      };
    }

    try {
      const supabase = this.getSupabase();

      let query = supabase.from("sales").select("*");

      if (dateRange) {
        query = query
          .gte("sale_date", dateRange.start)
          .lte("sale_date", dateRange.end);
      }

      const { data: sales, error } = await query;

      if (error) {
        console.error("Error obteniendo estadísticas:", error);
        return { data: null, error };
      }

      if (!sales || sales.length === 0) {
        return {
          data: {
            totalSales: 0,
            totalRevenue: 0,
            averageTicket: 0,
            topProducts: [],
          },
          error: null,
        };
      }

      const totalSales = sales.length;
      const totalRevenue = sales.reduce(
        (sum, sale) => sum + sale.final_amount,
        0
      );
      const averageTicket = totalRevenue / totalSales;

      // Agrupar productos por ventas
      const productStats = sales.reduce((acc, sale) => {
        if (!acc[sale.product_name]) {
          acc[sale.product_name] = {
            product_name: sale.product_name,
            total_quantity: 0,
            total_revenue: 0,
          };
        }
        acc[sale.product_name].total_quantity += sale.quantity;
        acc[sale.product_name].total_revenue += sale.final_amount;
        return acc;
      }, {} as Record<string, any>);

      const topProducts = (Object.values(productStats) as ProductStats[])
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      return {
        data: {
          totalSales,
          totalRevenue,
          averageTicket: Math.round(averageTicket),
          topProducts,
        },
        error: null,
      };
    } catch (error) {
      console.error("Error en getSalesStats:", error);
      return { data: null, error };
    }
  }

  /**
   * GET - Obtener ventas del día actual
   * Útil para dashboard y resúmenes diarios
   */
  static async getSalesToday(): Promise<{
    data: Sale[] | null;
    error: unknown;
  }> {
    console.log("=== GET SALES TODAY DEBUG ===");

    // Obtener fecha actual en formato ISO (solo fecha, sin hora)
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const startDateISO = startOfDay.toISOString();
    const endDateISO = endOfDay.toISOString();

    console.log("Buscando ventas del día:", {
      date: today.toLocaleDateString(),
      startOfDay: startDateISO,
      endOfDay: endDateISO,
    });

    if (isDemoMode) {
      // Datos demo para ventas de hoy
      const todaySales: Sale[] = [
        {
          id: "sale_today_1",
          sale_number:
            "V-" + today.getDate().toString().padStart(2, "0") + "001",
          product_id: "demo_1",
          product_barcode: "7790001234567",
          product_name: "Aceite Shell Helix 10W-40",
          quantity: 1,
          unit_price: 5500,
          total_amount: 5500,
          discount_amount: 0,
          final_amount: 5500,
          payment_method: "cash",
          customer_name: "Cliente Matutino",
          sale_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total: undefined,
        },
        {
          id: "sale_today_2",
          sale_number:
            "V-" + today.getDate().toString().padStart(2, "0") + "002",
          product_id: "demo_2",
          product_barcode: "7790001234568",
          product_name: "Filtro de Aceite Mann",
          quantity: 2,
          unit_price: 2800,
          total_amount: 5600,
          discount_amount: 200,
          final_amount: 5400,
          payment_method: "card",
          customer_name: "Cliente Vespertino",
          sale_date: new Date(Date.now() - 3600000).toISOString(), // Hace 1 hora
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          total: undefined,
        },
        {
          id: "sale_today_3",
          sale_number:
            "V-" + today.getDate().toString().padStart(2, "0") + "003",
          product_id: "demo_3",
          product_barcode: "7790001234569",
          product_name: "Líquido de Frenos DOT 4",
          quantity: 1,
          unit_price: 2800,
          total_amount: 2800,
          discount_amount: 0,
          final_amount: 2800,
          payment_method: "transfer",
          customer_name: "Cliente Nocturno",
          sale_date: new Date(Date.now() - 7200000).toISOString(), // Hace 2 horas
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          total: undefined,
        },
      ];

      console.log("✅ Ventas del día en modo demo:", todaySales.length);
      return { data: todaySales, error: null };
    }

    const supabase = this.getSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user)
      console.warn("Usuario no autenticado para obtener ventas del día");

    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .gte("sale_date", startDateISO)
        .lt("sale_date", endDateISO)
        .order("sale_date", { ascending: false });

      if (error) {
        console.error("Error obteniendo ventas del día:", error);
        return { data: null, error };
      }

      console.log("✅ Ventas del día obtenidas:", data?.length || 0);
      return { data, error: null };
    } catch (error) {
      console.error("Error en getSalesToday:", error);
      return { data: null, error };
    }
  }

  /**
   * GET - Obtener estadísticas rápidas del día actual
   * Útil para mostrar métricas en tiempo real
   */
  static async getTodayStats(): Promise<{
    data: {
      totalSalesToday: number;
      revenueToday: number;
      averageTicketToday: number;
      lastSaleTime: string | null;
    } | null;
    error: unknown;
  }> {
    console.log("=== GET TODAY STATS DEBUG ===");

    try {
      const { data: todaySales, error } = await this.getSalesToday();

      if (error || !todaySales) {
        return { data: null, error };
      }

      const totalSalesToday = todaySales.length;
      const revenueToday = todaySales.reduce(
        (sum, sale) => sum + sale.final_amount,
        0
      );
      const averageTicketToday =
        totalSalesToday > 0 ? Math.round(revenueToday / totalSalesToday) : 0;

      // Obtener la hora de la última venta
      const lastSaleTime =
        todaySales.length > 0 && todaySales[0].sale_date
          ? todaySales[0].sale_date // Ya están ordenadas por fecha descendente
          : null;

      const stats = {
        totalSalesToday,
        revenueToday,
        averageTicketToday,
        lastSaleTime,
      };

      console.log("✅ Estadísticas del día:", stats);
      return { data: stats, error: null };
    } catch (error) {
      console.error("Error en getTodayStats:", error);
      return { data: null, error };
    }
  }

  /**
   * GET - Comparar ventas de hoy vs ayer
   * Útil para mostrar tendencias y crecimiento
   */
  static async getTodayVsYesterdayComparison(): Promise<{
    data: {
      today: {
        sales: number;
        revenue: number;
      };
      yesterday: {
        sales: number;
        revenue: number;
      };
      growth: {
        salesPercentage: number;
        revenuePercentage: number;
      };
    } | null;
    error: unknown;
  }> {
    console.log("=== GET TODAY VS YESTERDAY COMPARISON DEBUG ===");

    try {
      // Obtener ventas de hoy
      const { data: todaySales, error: todayError } =
        await this.getSalesToday();
      if (todayError) {
        return { data: null, error: todayError };
      }

      // Obtener ventas de ayer
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfYesterday = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate()
      );
      const endOfYesterday = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate() + 1
      );

      const { data: yesterdaySales, error: yesterdayError } =
        await this.getSalesByDateRange(
          startOfYesterday.toISOString(),
          endOfYesterday.toISOString()
        );

      if (yesterdayError) {
        return { data: null, error: yesterdayError };
      }

      // Calcular estadísticas
      const todayStats = {
        sales: todaySales?.length || 0,
        revenue:
          todaySales?.reduce((sum, sale) => sum + sale.final_amount, 0) || 0,
      };

      const yesterdayStats = {
        sales: yesterdaySales?.length || 0,
        revenue:
          yesterdaySales?.reduce((sum, sale) => sum + sale.final_amount, 0) ||
          0,
      };

      // Calcular porcentajes de crecimiento
      const salesGrowth =
        yesterdayStats.sales > 0
          ? ((todayStats.sales - yesterdayStats.sales) / yesterdayStats.sales) *
          100
          : todayStats.sales > 0
            ? 100
            : 0;

      const revenueGrowth =
        yesterdayStats.revenue > 0
          ? ((todayStats.revenue - yesterdayStats.revenue) /
            yesterdayStats.revenue) *
          100
          : todayStats.revenue > 0
            ? 100
            : 0;

      const comparison = {
        today: todayStats,
        yesterday: yesterdayStats,
        growth: {
          salesPercentage: Math.round(salesGrowth * 100) / 100, // 2 decimales
          revenuePercentage: Math.round(revenueGrowth * 100) / 100,
        },
      };

      console.log("✅ Comparación hoy vs ayer:", comparison);
      return { data: comparison, error: null };
    } catch (error) {
      console.error("Error en getTodayVsYesterdayComparison:", error);
      return { data: null, error };
    }
  }

  // ======================
  // CATEGORIES
  // ======================

  static async getAllCategories() {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      console.log("getAllCategories", data);
      if (error) {
        console.error("Error obteniendo las categorías:", error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error en getAllCategories:", error);
      return { data: null, error };
    }
  }

  static async getCategoryById(id: string) {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error obteniendo la categoría por id:", error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error en getCategoryById:", error);
      return { data: null, error };
    }
  }

  static async createCategory(category: { name: string }) {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("categories")
        .insert([category])
        .select()
        .single();
      if (error) {
        console.error("Error creando la categoría:", error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error en createCategory:", error);
      return { data: null, error };
    }
  }

  static async updateCategory(id: string, updates: { name?: string }) {
    try {
      const supabase = this.getSupabase();
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("Error actualizando la categoría:", error);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error en updateCategory:", error);
      return { data: null, error };
    }
  }

  static async deleteCategory(id: string) {
    try {
      const supabase = this.getSupabase();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) {
        console.error("Error borrando la categoría:", error);
        return { data: null, error };
      }
      return { data: null, error: null };
    } catch (error) {
      console.error("Error en deleteCategory:", error);
      return { data: null, error };
    }
  }
}
