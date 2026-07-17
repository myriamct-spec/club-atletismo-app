import { Routes, Route } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Atletas from "./pages/Atletas";
import Ajustes from "./pages/Ajustes";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/atletas" element={<Atletas />} />

          <Route element={<AdminRoute />}>
            <Route path="/ajustes" element={<Ajustes />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
