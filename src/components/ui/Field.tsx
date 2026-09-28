import { ChevronDown } from "lucide-react";
import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

const control =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint " +
  "transition-colors focus:border-ink focus:outline-none focus:ring-4 focus:ring-ink/5 " +
  "disabled:bg-subtle disabled:text-muted";

interface FieldProps {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  className?: string;
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
}

/** Label + control + hint/error, wired up for screen readers. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children(id, hint || error ? hintId : undefined)}
      {(error || hint) && (
        <p id={hintId} className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(control, "h-11", className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(control, "py-2.5 leading-relaxed", className)} {...props} />;
  },
);

/** `className` sizes the wrapper (width etc.); the native select fills it. */
export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <div className={cn("relative w-full", className)}>
        <select ref={ref} className={cn(control, "h-11 appearance-none pr-10")} {...props}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    );
  },
);
