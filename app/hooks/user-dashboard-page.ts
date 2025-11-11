// hooks/use-dashboard.ts
import { ProductService } from "@/lib/product-service";
import { useEffect, useState } from "react";

// Tipos básicos para evitar problemas de importación
export interface Product {
    id: string | number;
    name: string;
    price: number;
    stock: number;
    min_stock: number;
}

export interface Sale {
    id?: string | number;
    total: number;
    created_at?: string;
}


export const useDashboard = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Valores calculados
    const lowStock = products.filter(p => p.stock < p.min_stock).length;
    const inventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const todaysSales = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Fetching dashboard data...');

                // Ejecutar ambas promesas en paralelo
                const [productsResult, salesResult] = await Promise.allSettled([
                    ProductService.getAllProducts(),
                    ProductService.getSalesToday()
                ]);

                if (!isMounted) return;

                // Manejar resultado de productos
                if (productsResult.status === 'fulfilled') {
                    const { data: productsData, error: productsError } = productsResult.value;
                    if (!productsError && productsData) {
                        setProducts(productsData);
                        console.log('Products loaded:', productsData.length);
                    } else {
                        console.warn('Products error:', productsError);
                        setProducts([]);
                    }
                } else {
                    console.error('Products promise rejected:', productsResult.reason);
                    setProducts([]);
                }

                console.log('salesResult:', salesResult);
                // Manejar resultado de ventas
                if (salesResult.status === 'fulfilled') {
                    const { data: salesData, error: salesError } = salesResult.value;
                    if (!salesError && salesData) {
                        setSales(salesData);
                        console.log('Sales loaded:', salesData.length);
                    } else {
                        console.warn('Sales error:', salesError);
                        setSales([]);
                    }
                } else {
                    console.error('Sales promise rejected:', salesResult.reason);
                    setSales([]);
                }

            } catch (err) {
                console.error('Unexpected error in fetchData:', err);
                if (isMounted) {
                    setError('Error inesperado al cargar los datos');
                    setProducts([]);
                    setSales([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [ProductService.getAllProducts, ProductService.getSalesToday]);

    return {
        products,
        sales,
        lowStock,
        inventoryValue,
        todaysSales,
        loading,
        error,
        // Datos adicionales
        totalProducts: products.length,
        totalSales: sales.length
    };
};