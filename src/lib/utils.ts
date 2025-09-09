export function cn(...a: Array<string | undefined | false>) {
  return a.filter(Boolean).join(" ");
}

export const fmt = (s: string) => new Date(s).toLocaleString();
