import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ClubLogo } from "./ClubLogo";

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-navy-800 text-gold-300" : "text-navy-100/80 hover:bg-navy-800/60 hover:text-white"
  }`;

export function AppLayout() {
  const { usuario, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-ground">
      <aside className="flex w-60 flex-shrink-0 flex-col gap-6 bg-navy-900 p-5 text-white print:hidden">
        <div className="flex flex-col gap-2">
          <ClubLogo variant="full" />
          <p className="text-center text-xs text-navy-100/60">Panel del entrenador</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink to="/" end className={linkClasses}>
            Panel
          </NavLink>
          <NavLink to="/atletas" className={linkClasses}>
            Atletas
          </NavLink>
          <NavLink to="/competiciones" className={linkClasses}>
            Competiciones
          </NavLink>
          {usuario?.rol === "admin" && (
            <>
              <NavLink to="/usuarios" className={linkClasses}>
                Usuarios
              </NavLink>
              <NavLink to="/grupos" className={linkClasses}>
                Grupos
              </NavLink>
              <NavLink to="/ajustes" className={linkClasses}>
                Ajustes del club
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-white/10 pt-4 text-sm">
          <p className="font-medium">{usuario?.nombre}</p>
          <p className="text-xs capitalize text-navy-100/60">{usuario?.rol}</p>
          <div className="mt-3 flex items-center gap-3">
            <NavLink
              to="/mi-cuenta"
              className="text-xs font-semibold uppercase tracking-wide text-navy-100/80 hover:text-white"
            >
              Mi cuenta
            </NavLink>
            <button
              onClick={() => signOut()}
              className="text-xs font-semibold uppercase tracking-wide text-gold-300 hover:text-gold-500"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 print:p-0">
        <Outlet />
      </main>
    </div>
  );
}
