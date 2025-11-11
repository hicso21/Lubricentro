import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  /** Texto a mostrar debajo del spinner */
  text?: string;
  /** Tamaño del spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Variant del loader */
  variant?: "default" | "overlay" | "inline" | "card";
  /** Clase CSS adicional */
  className?: string;
  /** Si debe ocupar toda la pantalla */
  fullscreen?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const Loader: React.FC<LoaderProps> = ({
  text,
  size = "lg",
  variant = "default",
  className,
  fullscreen = false,
}) => {
  const baseClasses = "flex flex-col items-center justify-center gap-3";

  const variantClasses = {
    default: "text-slate-200",
    overlay: "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 text-white",
    inline: "text-slate-400",
    card: "bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-slate-200",
  };

  const containerClasses = cn(
    baseClasses,
    variantClasses[variant],
    fullscreen && "min-h-screen",
    className
  );

  return (
    <div className={containerClasses}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
      {text && <p className="text-sm font-large animate-pulse">{text}</p>}
    </div>
  );
};

// Componente específico para páginas completas
export const PageLoader: React.FC<{ text?: string }> = ({
  text = "Cargando...",
}) => (
  <Loader
    text={text}
    size="lg"
    variant="default"
    fullscreen
    className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
  />
);

// Componente para overlays
export const OverlayLoader: React.FC<{ text?: string }> = ({
  text = "Procesando...",
}) => <Loader text={text} size="lg" variant="overlay" />;

// Componente inline pequeño
export const InlineLoader: React.FC<{ text?: string; size?: "sm" | "md" }> = ({
  text,
  size = "sm",
}) => (
  <Loader text={text} size={size} variant="inline" className="flex-row gap-2" />
);

// Componente para cards/contenedores
export const CardLoader: React.FC<{ text?: string }> = ({
  text = "Cargando datos...",
}) => <Loader text={text} size="md" variant="card" />;

// Exportar todos los componentes
export { Loader };
export default Loader;
