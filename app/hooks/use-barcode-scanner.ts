import { useState, useEffect, useCallback } from "react"

interface BarcodeScannerState {
  isConnected: boolean
  isScanning: boolean
  lastScannedCode: string | null
  error: string | null
}

interface BarcodeScannerHook extends BarcodeScannerState {
  connectScanner: () => Promise<void>
  disconnectScanner: () => void
  startScanning: () => void
  stopScanning: () => void
  clearLastScanned: () => void
}

export function useBarcodeScanner(): BarcodeScannerHook {
  const [state, setState] = useState<BarcodeScannerState>({
    isConnected: false,
    isScanning: false,
    lastScannedCode: null,
    error: null,
  })

  const [port, setPort] = useState<SerialPort | null>(null)
  const [reader, setReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  // Check if Web Serial API is supported
  const isWebSerialSupported = typeof navigator !== "undefined" && "serial" in navigator

  const connectScanner = useCallback(async () => {
    if (!isWebSerialSupported) {
      setState((prev) => ({ ...prev, error: "Web Serial API no soportada en este navegador" }))
      return
    }

    try {
      // Request a port and open a connection
      const selectedPort = await (navigator as any).serial.requestPort()
      await selectedPort.open({ baudRate: 9600 })

      setPort(selectedPort)
      setState((prev) => ({
        ...prev,
        isConnected: true,
        error: null,
      }))
    } catch (error) {
      console.error("Error connecting to scanner:", error)
      setState((prev) => ({
        ...prev,
        error: "Error al conectar el escáner. Asegúrate de que esté conectado.",
      }))
    }
  }, [isWebSerialSupported])

  const disconnectScanner = useCallback(() => {
    if (reader) {
      reader.cancel()
      setReader(null)
    }

    if (port) {
      port.close()
      setPort(null)
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isScanning: false,
      error: null,
    }))
  }, [port, reader])

  const startScanning = useCallback(async () => {
    if (!port || !port.readable) {
      setState((prev) => ({ ...prev, error: "Escáner no conectado" }))
      return
    }

    try {
      const textDecoder = new TextDecoder()
      const newReader = port.readable.getReader()
      setReader(newReader)

      setState((prev) => ({ ...prev, isScanning: true, error: null }))

      let buffer = ""

      while (true) {
        const { value, done } = await newReader.read()
        if (done) break

        // Decode the data and add to buffer
        const chunk = textDecoder.decode(value, { stream: true })
        buffer += chunk

        // Look for complete barcode (usually ends with Enter/newline)
        const lines = buffer.split(/[\r\n]+/)
        buffer = lines.pop() || "" // Keep incomplete line in buffer

        for (const line of lines) {
          const barcode = line.trim()
          if (barcode.length > 0) {
            setState((prev) => ({
              ...prev,
              lastScannedCode: barcode,
            }))

            // Dispatch custom event for components to listen to
            window.dispatchEvent(
              new CustomEvent("barcodeScanned", {
                detail: { barcode },
              }),
            )
          }
        }
      }
    } catch (error) {
      console.error("Error reading from scanner:", error)
      setState((prev) => ({
        ...prev,
        isScanning: false,
        error: "Error al leer del escáner",
      }))
    }
  }, [port])

  const stopScanning = useCallback(() => {
    if (reader) {
      reader.cancel()
      setReader(null)
    }
    setState((prev) => ({ ...prev, isScanning: false }))
  }, [reader])

  const clearLastScanned = useCallback(() => {
    setState((prev) => ({ ...prev, lastScannedCode: null }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectScanner()
    }
  }, [disconnectScanner])

  return {
    ...state,
    connectScanner,
    disconnectScanner,
    startScanning,
    stopScanning,
    clearLastScanned,
  }
}
