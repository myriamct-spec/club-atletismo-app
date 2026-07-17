import { useAuth } from "../context/AuthContext";

export function ClubLogo({ size = 40 }: { size?: number }) {
  const { club } = useAuth();

  if (club?.logo_url) {
    return (
      <img
        src={club.logo_url}
        alt={club.nombre}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    );
  }

  const inicial = club?.nombre?.trim().charAt(0).toUpperCase() || "A";

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-navy-900 font-display text-gold-300"
      aria-label={club?.nombre ?? "Club"}
    >
      <span style={{ fontSize: size * 0.45 }}>{inicial}</span>
    </div>
  );
}
