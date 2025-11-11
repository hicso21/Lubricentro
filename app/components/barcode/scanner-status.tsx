"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Scan, Wifi, WifiOff, Play, Square } from "lucide-react"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"

export function ScannerStatus() {
  const {
    isConnected,
    isScanning,
    lastScannedCode,
    error,
    connectScanner,
    disconnectScanner,
    startScanning,
    stopScanning,
    clearLastScanned,
  } = useBarcodeScanner()

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Escáner de Código de Barras</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Conectado
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Desconectado
                </>
              )}
            </Badge>
            {isScanning && (
              <Badge variant="outline" className="text-xs animate-pulse">
                Escaneando...
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {!isConnected ? (
            <Button size="sm" onClick={connectScanner} className="racing-shadow cursor-pointer">
              Conectar Escáner
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={disconnectScanner}>
                Desconectar
              </Button>
              {!isScanning ? (
                <Button size="sm" onClick={startScanning} className="racing-shadow">
                  <Play className="w-3 h-3 mr-1" />
                  Iniciar Escaneo
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={stopScanning}>
                  <Square className="w-3 h-3 mr-1" />
                  Detener Escaneo
                </Button>
              )}
            </>
          )}
        </div>

        {lastScannedCode && (
          <div className="flex items-center justify-between p-2 bg-primary/10 rounded text-sm">
            <span>
              Último código: <strong>{lastScannedCode}</strong>
            </span>
            <Button size="sm" variant="ghost" onClick={clearLastScanned}>
              Limpiar
            </Button>
          </div>
        )}

        {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
      </CardContent>
    </Card>
  )
}
