import { MobileSidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw, Scan } from "lucide-react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";

export function Header() {
  const { isOnline, isHydrated, syncing, pendingItems, lastSync, syncData } =
    useOfflineSync();
  const { isConnected: scannerConnected, isScanning } = useBarcodeScanner();

  const handleSync = async () => {
    const success = await syncData();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="ml-4 hidden md:flex">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-sm font-bold text-primary">Lubricentro</h1>
              <p className="text-xs text-muted-foreground">
                Sistema de Gestión
              </p>
            </div>
          </div>
        </div>
        <MobileSidebar />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search could go here */}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                scannerConnected
                  ? isScanning
                    ? "default"
                    : "secondary"
                  : "outline"
              }
              className="gap-1"
            >
              <Scan
                className={`w-3 h-3 ${isScanning ? "animate-pulse" : ""}`}
              />
              {scannerConnected
                ? isScanning
                  ? "Escaneando"
                  : "Escáner OK"
                : "Sin escáner"}
            </Badge>

            {/* Connection Status - ✅ FIX AQUÍ */}
            <div className="flex items-center gap-2">
              {!isHydrated ? (
                // ✅ Placeholder durante hidratación
                <Badge variant="secondary" className="gap-1">
                  <Wifi className="w-3 h-3" />
                  ...
                </Badge>
              ) : isOnline ? (
                <Badge variant="secondary" className="gap-1">
                  <Wifi className="w-3 h-3" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </Badge>
              )}

              {pendingItems > 0 && (
                <Badge variant="outline" className="gap-1">
                  <RefreshCw className="w-3 h-3" />
                  {pendingItems} pendiente{pendingItems !== 1 ? "s" : ""}
                </Badge>
              )}

              {isOnline && pendingItems > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  disabled={syncing}
                  className="gap-1 bg-transparent"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`}
                  />
                  {syncing ? "Sync..." : "Sync"}
                </Button>
              )}
            </div>

            {lastSync && (
              <div className="text-xs text-muted-foreground hidden sm:block mr-4">
                Última sync: {lastSync.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}