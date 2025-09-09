import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-2xl border bg-white/60 dark:bg-zinc-900/60 p-4 shadow-sm backdrop-blur", props.className)} />;
}
