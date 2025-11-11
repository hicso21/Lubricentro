import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createClient } from "@/lib/supabase/client"; // Asegúrate que este exporta tu cliente de supabase
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await createClient().auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    checkSession();

    // Escucha cambios en el estado de sesión
    const { data: listener } = createClient().auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(!!session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null)
    return (
      <div className="text-center text-white p-8">Verificando sesión...</div>
    );

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return <DashboardLayout>{children}</DashboardLayout>;
}
