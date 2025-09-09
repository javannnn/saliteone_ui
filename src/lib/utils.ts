export function cn(...a: Array<string | undefined | false>) {
  return a.filter(Boolean).join(" ");
}
