const KEY = "peek:session-hint";

export type SessionHint = {
  name: string;
  showDocker: boolean;
  appsCompactView: boolean;
};

export function readSessionHint(): SessionHint | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionHint;
  } catch {
    return null;
  }
}

export function writeSessionHint(hint: SessionHint): void {
  localStorage.setItem(KEY, JSON.stringify(hint));
}

export function clearSessionHint(): void {
  localStorage.removeItem(KEY);
}
