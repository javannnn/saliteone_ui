import { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export default function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200", props.className)} />;
}
