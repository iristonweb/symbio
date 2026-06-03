import { cn } from "@/lib/cn";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-fg-muted",
        className
      )}
      {...props}
    />
  );
}
