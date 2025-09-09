import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"outline"|"ghost"; size?: "sm"|"md"|"lg" };
export default function Button({ className, variant="default", size="md", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium transition hover:opacity-90 disabled:opacity-50";
  const variants = {
    default: "bg-brand-600 text-white",
    outline: "border border-border text-foreground",
    ghost: "text-foreground"
  } as const;
  const sizes = { sm:"h-9 text-sm", md:"h-10", lg:"h-11 text-lg" } as const;
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
