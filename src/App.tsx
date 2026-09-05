import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Atletas from "./pages/Atletas";
import AtletaForm from "./pages/AtletaForm";
import AtletaDetalle from "./pages/AtletaDetalle";
import Competiciones from "./pages/Competiciones";
import CompeticionForm from "./pages/CompeticionForm";
import CompeticionDetalle from "./pages/CompeticionDetalle";
import Usuarios from "./pages/Usuarios";
import Grupos from "./pages/Grupos";
import GrupoDetalle from "./pages/GrupoDetalle";
import Ajustes from "./pages/Ajustes";

const ImportarAtletas = lazy(() => import("./pages/ImportarAtletas"));
const ImportarResultados = lazy(() => import("./pages/ImportarResultados"));
const InformeEvolucion = lazy(() => import("./pages/InformeEvolucion"));

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
          <Route
            path="/atletas/:id/informe"
            element={
              <Suspense fallback={<p className="text-sm text-navy-800/60">Cargando…</p>}>
                <InformeEvolucion />
              </Suspense>
            }
          />

          <Route path="/competiciones" element={<Competiciones />} />
          <Route path="/competiciones/nueva" element={<CompeticionForm />} />
          <Route path="/competiciones/:id" element={<CompeticionDetalle />} />
          <Route
            path="/competiciones/:id/importar-resultados"
            element={
              <Suspense fallback={<p className="text-sm text-navy-800/60">Cargando…</p>}>
                <ImportarResultados />
              </Suspense>
            }
          />

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
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/grupos" element={<Grupos />} />
            <Route path="/grupos/:id" element={<GrupoDetalle />} />
            <Route path="/ajustes" element={<Ajustes />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
