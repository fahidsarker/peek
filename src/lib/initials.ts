export function getInitials(name: string): string {
  const cleaned = name.replace(/^\/+/, "").trim();
  if (!cleaned) return "??";

  const parts = cleaned.split(/[\s\-_]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return cleaned.slice(0, 2).toUpperCase();
}

export function dockerAvatarRingClass(state: string): string {
  if (state === "running") return "ring-2 ring-status-up/40";
  if (state === "paused") return "ring-2 ring-status-unknown/40";
  return "";
}
