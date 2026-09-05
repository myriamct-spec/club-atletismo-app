import { useAuth } from "../context/AuthContext";

export function ClubLogo({
  size = 40,
  variant = "icon",
}: {
  size?: number;
  variant?: "icon" | "full";
}) {
  const { club } = useAuth();

  if (club?.logo_url) {
    if (variant === "full") {
      return (
        <img
          src={club.logo_url}
          alt={club.nombre}
          className="w-full rounded-2xl bg-white object-contain p-3"
        />
      );
    }
    return (
      <img
        src={club.logo_url}
        alt={club.nombre}
        style={{ width: size, height: size }}
        className="rounded-lg bg-white object-contain p-0.5"
      />
    );
  }

  const inicial = club?.nombre?.trim().charAt(0).toUpperCase() || "A";

  if (variant === "full") {
    return (
      <div
        className="flex aspect-square w-full items-center justify-center rounded-2xl bg-navy-800 font-display text-gold-300"
        aria-label={club?.nombre ?? "Club"}
      >
        <span className="text-5xl">{inicial}</span>
      </div>
    );
  }

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
