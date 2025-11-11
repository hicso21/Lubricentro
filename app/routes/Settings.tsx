import type React from "react";

import { useState, useEffect } from "react";
import {} from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OfflineSync } from "@/lib/offline-sync";
import {
  Settings,
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStorage } from "@/hooks/use-storage";

export default function SettingsPage() {
  const storage = useStorage();
  const [settings, setSettings] = useState({
    autoSync: true,
    lowStockThreshold: 5,
    backupFrequency: "daily",
    notifications: true,
    markupPercentage: 0.3,
  });
  const [storageInfo, setStorageInfo] = useState({
    products: 0,
    sales: 0,
    orders: 0,
    lastBackup: null as Date | null,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadStorageInfo();
  }, []);

  const loadSettings = () => {
    // Load settings from localStorage
    const savedSettings = storage.getItem("lubricentro_settings");
    if (savedSettings) {
      setSettings({
        ...JSON.parse(savedSettings),
        markupPercentage:
          JSON.parse(savedSettings).markupPercentage * 100 || 0.3,
      });
    }
  };

  const loadStorageInfo = () => {
    const products = OfflineSync.getProductsFromLocal();
    const sales = OfflineSync.getPendingSales();
    const orders = OfflineSync.getPendingPurchaseOrders();
    const lastBackup = storage.getItem("lubricentro_last_backup");

    setStorageInfo({
      products: products.length,
      sales: sales.length,
      orders: orders.length,
      lastBackup: lastBackup ? new Date(lastBackup) : null,
    });
  };

  const saveSettings = () => {
    storage.setItem(
      "lubricentro_settings",
      JSON.stringify({
        ...settings,
        markupPercentage: settings.markupPercentage / 100,
      })
    );
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han aplicado correctamente",
    });
  };

  const exportData = () => {
    try {
      const data = {
        products: OfflineSync.getProductsFromLocal(),
        sales: OfflineSync.getPendingSales(),
        orders: OfflineSync.getPendingPurchaseOrders(),
        settings,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lubricentro-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      storage.setItem("lubricentro_last_backup", new Date().toISOString());
      loadStorageInfo();

      toast({
        title: "Datos exportados",
        description: "El archivo de respaldo se ha descargado correctamente",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos",
        variant: "destructive",
      });
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.products) {
          OfflineSync.saveProductsToLocal(data.products);
        }
        if (data.settings) {
          setSettings(data.settings);
          storage.setItem(
            "lubricentro_settings",
            JSON.stringify(data.settings)
          );
        }

        loadStorageInfo();

        toast({
          title: "Datos importados",
          description: "Los datos se han restaurado correctamente",
        });
      } catch (error) {
        console.error("Error importing data:", error);
        toast({
          title: "Error",
          description: "El archivo no es válido o está corrupto",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (
      !confirm(
        "¿Estás seguro de eliminar todos los datos locales? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      storage.removeItem("lubricentro_products");
      storage.removeItem("lubricentro_sales");
      storage.removeItem("lubricentro_purchase_orders");
      storage.removeItem("lubricentro_last_sync");
      storage.removeItem("lubricentro_settings");
      storage.removeItem("lubricentro_last_backup");

      loadStorageInfo();
      loadSettings();

      toast({
        title: "Datos eliminados",
        description: "Todos los datos locales han sido eliminados",
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      toast({
        title: "Error",
        description: "No se pudieron eliminar todos los datos",
        variant: "destructive",
      });
    }
  };

  const getStorageSize = () => {
    let totalSize = 0;
    for (const key in storage) {
      if (key.startsWith("lubricentro_")) {
        totalSize += storage[key].length;
      }
    }
    return (totalSize / 1024).toFixed(2); // KB
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            Configuración
          </h2>
          <p className="text-muted-foreground">
            Ajustes del sistema y gestión de datos locales
          </p>
        </div>
      </div>

      {/* General Settings */}
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración General
          </CardTitle>
          <CardDescription>
            Ajustes básicos de funcionamiento de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sincronización Automática</Label>
              <div className="text-sm text-muted-foreground">
                Sincronizar datos automáticamente cuando hay conexión
              </div>
            </div>
            <Switch
              checked={settings.autoSync}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, autoSync: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones</Label>
              <div className="text-sm text-muted-foreground">
                Mostrar alertas de stock bajo y sincronización
              </div>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, notifications: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Umbral de Stock Bajo</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              value={settings.lowStockThreshold}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  lowStockThreshold: Number.parseInt(e.target.value) || 0,
                }))
              }
              className="w-32"
            />
            <div className="text-sm text-muted-foreground">
              Cantidad mínima para considerar stock bajo
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Porcentaje de Marcado</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              value={settings.markupPercentage}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  markupPercentage: Number.parseFloat(e.target.value) || 0,
                }))
              }
              className="w-32"
            />
            <div className="text-sm text-muted-foreground">
              Porcentaje aplicado al costo del producto
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup">Frecuencia de Respaldo</Label>
            <select
              id="backup"
              value={settings.backupFrequency}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  backupFrequency: e.target.value,
                }))
              }
              className="w-48 h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <Button
            onClick={saveSettings}
            className="racing-shadow cursor-pointer"
          >
            Guardar Configuración
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Gestión de Datos
          </CardTitle>
          <CardDescription>
            Información sobre almacenamiento local y opciones de respaldo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Info */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {storageInfo.products}
              </div>
              <div className="text-sm text-muted-foreground">Productos</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {storageInfo.sales}
              </div>
              <div className="text-sm text-muted-foreground">
                Ventas Pendientes
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-accent">
                {storageInfo.orders}
              </div>
              <div className="text-sm text-muted-foreground">
                Pedidos Pendientes
              </div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {getStorageSize()}
              </div>
              <div className="text-sm text-muted-foreground">KB Utilizados</div>
            </div>
          </div>

          {/* Last Backup */}
          {storageInfo.lastBackup && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">Último Respaldo</div>
              <div className="text-sm text-muted-foreground">
                {storageInfo.lastBackup.toLocaleString()}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={exportData}
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <Download className="w-4 h-4" />
              Exportar Datos
            </Button>

            <Button variant="outline" className="gap-2 bg-transparent" asChild>
              <label htmlFor="import-file" className="cursor-pointer">
                <Upload className="w-4 h-4" />
                Importar Datos
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </Button>

            <Button
              onClick={loadStorageInfo}
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar Info
            </Button>

            <Button
              onClick={clearAllData}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar Todo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="racing-shadow">
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
          <CardDescription>
            Detalles técnicos sobre la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm font-medium">
                Versión de la Aplicación
              </div>
              <div className="text-sm text-muted-foreground">1.0.0</div>
            </div>
            <div>
              <div className="text-sm font-medium">Navegador</div>
              <div className="text-sm text-muted-foreground">
                {navigator.userAgent.split(" ")[0]}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Soporte de LocalStorage</div>
              <div className="text-sm text-muted-foreground">
                {typeof Storage !== "undefined"
                  ? "Disponible"
                  : "No disponible"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Estado de Conexión</div>
              <div className="text-sm text-muted-foreground">
                {navigator.onLine ? "Conectado" : "Sin conexión"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
