// Avatar redondo con inicial del usuario en su color de perfil.
interface AvatarProps {
  name: string;
  color?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, color, size = 44, className = "" }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  // Fallback al token --accent si no hay color de perfil
  const bg = color ?? "var(--accent)";

  return (
    <span
      aria-label={name}
      className={`rounded-full inline-flex items-center justify-center font-semibold text-paper select-none shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: Math.round(size * 0.42),
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}
