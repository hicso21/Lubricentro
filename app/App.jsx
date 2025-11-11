import "./globals.css";
import DashboardLayout from "./components/layout/dashboard-layout";
import { StorageProvider } from "@/context/storage-context";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";

export default function App() {
  return (
    <StorageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StorageProvider>
  );
}
