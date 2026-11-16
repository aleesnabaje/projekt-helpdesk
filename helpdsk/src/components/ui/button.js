import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const styles = cva("inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      primary: "bg-blue-700 text-white shadow-sm hover:bg-blue-800",
      secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      danger: "bg-rose-600 text-white hover:bg-rose-700",
    },
    size: { default: "h-11 px-4", sm: "h-9 px-3 text-xs", icon: "size-10" },
  },
  defaultVariants: { variant: "primary", size: "default" },
});

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(styles({ variant, size }), className)} {...props} />;
}
