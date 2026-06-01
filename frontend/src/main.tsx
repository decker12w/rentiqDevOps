import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";
import App from "./App";
import { ComoFunciona } from "./pages/ComoFunciona";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Historico } from "./pages/Historico";
import { Anunciar } from "./pages/Anunciar";
import { MeusImoveis } from "./pages/MeusImoveis";
import { AuthProvider, useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route
            path="/historico"
            element={
              <ProtectedRoute>
                <Historico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/anunciar"
            element={
              <ProtectedRoute>
                <Anunciar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-imoveis"
            element={
              <ProtectedRoute>
                <MeusImoveis />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
