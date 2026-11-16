import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return <input className={cn("field-control", className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn("field-control min-h-32 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return <select className={cn("field-control", className)} {...props}>{children}</select>;
}

export function Field({ label, error, hint, children, className }) {
  return <label className={cn("field-wrap", className)}>
    <span className="field-label">{label}</span>
    {children}
    {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
  </label>;
}
