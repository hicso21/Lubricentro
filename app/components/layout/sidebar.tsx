import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ChartBarStacked,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
import logo_source from "@/assets/logo.png";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Inventario",
    href: "/inventory",
    icon: Package,
  },
  {
    name: "Ventas",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    name: "Categorías",
    href: "/categories",
    icon: ChartBarStacked,
  },
  {
    name: "Alertas",
    href: "/alerts",
    icon: AlertTriangle,
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { pathname } = useLocation();

  return (
    <aside className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-8">
            <img
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
              src={logo_source}
              alt="Logo"
            />
            <div>
              <h2 className="text-lg font-bold text-primary">Cinalli</h2>
              <p className="text-xs text-muted-foreground">Racing Team</p>
            </div>
          </div>
          <div className="space-y-1 flex flex-col">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 text-sidebar-foreground hover:text-sidebar-foreground cursor-pointer",
                    pathname === item.href &&
                      "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground cursor-pointer"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden bg-transparent"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}
