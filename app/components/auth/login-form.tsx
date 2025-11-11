import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthService } from "@/lib/auth-service";
import { Loader2, LogIn } from "lucide-react";
import { isPasswordPwned } from "@/lib/security";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting login...");
      const isLeaked = await isPasswordPwned(password);
      if (isLeaked) {
        setError(
          "⚠️ Esta contraseña fue filtrada en brechas de datos. Por favor, cambia tu contraseña antes de continuar."
        );
        setIsLoading(false);
        return;
      }
      const { data, error } = await AuthService.signIn(email, password);

      if (error) {
        console.error("Login error:", error);
        setError(error instanceof Error ? error.message : String(error));
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        console.log("Login successful for user:", data.user.email);

        // Luego redirigir
        navigate("/dashboard");
      } else {
        setError("No se pudo autenticar el usuario");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login exception:", err);
      setError("Error inesperado al iniciar sesión");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-black drop-shadow-md">
              C
            </span>
          </div>

          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Cinalli Racing Team
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Ingresa tus credenciales para acceder al sistema de gestión
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert
                variant="destructive"
                className="bg-red-900/20 border-red-800 text-red-200"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Sistema de gestión para lubricentro
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
