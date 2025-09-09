import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("h-10 w-full rounded-xl border px-3 outline-none focus:ring-2 focus:ring-brand-400", className)} {...props} />;
});
