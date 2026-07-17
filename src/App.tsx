import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Atletas from "./pages/Atletas";
import AtletaForm from "./pages/AtletaForm";
import AtletaDetalle from "./pages/AtletaDetalle";
import Ajustes from "./pages/Ajustes";

const ImportarAtletas = lazy(() => import("./pages/ImportarAtletas"));

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/atletas" element={<Atletas />} />
          <Route path="/atletas/:id" element={<AtletaDetalle />} />
          <Route path="/atletas/:id/editar" element={<AtletaForm />} />

          <Route element={<AdminRoute />}>
            <Route path="/atletas/nuevo" element={<AtletaForm />} />
            <Route
              path="/atletas/importar"
              element={
                <Suspense fallback={<p className="text-sm text-navy-800/60">Cargando…</p>}>
                  <ImportarAtletas />
                </Suspense>
              }
            />
            <Route path="/ajustes" element={<Ajustes />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
