import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { inputClass, labelClass } from "./styles";

type Common = { label: string; name: string; errors?: string[]; hint?: ReactNode; className?: string };

function Wrapper({ id, label, errors, hint, className, children }: { id: string; label: string; errors?: string[]; hint?: ReactNode; className?: string; children: ReactNode }) {
  const error = errors?.[0];
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// Pass an id when several forms on one page share field names.
const describedBy = (id: string, errors?: string[], hint?: ReactNode) =>
  errors?.[0] ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function Field({ label, name, id, errors, hint, className, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? name;
  return (
    <Wrapper id={fieldId} label={label} errors={errors} hint={hint} className={className}>
      <input id={fieldId} name={name} aria-invalid={Boolean(errors?.[0])} aria-describedby={describedBy(fieldId, errors, hint)} className={inputClass} {...props} />
    </Wrapper>
  );
}

export function TextArea({ label, name, id, errors, hint, className, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id ?? name;
  return (
    <Wrapper id={fieldId} label={label} errors={errors} hint={hint} className={className}>
      <textarea id={fieldId} name={name} aria-invalid={Boolean(errors?.[0])} aria-describedby={describedBy(fieldId, errors, hint)} className={inputClass} {...props} />
    </Wrapper>
  );
}

export function Select({
  label,
  name,
  id,
  errors,
  hint,
  className,
  children,
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const fieldId = id ?? name;
  return (
    <Wrapper id={fieldId} label={label} errors={errors} hint={hint} className={className}>
      <select id={fieldId} name={name} aria-invalid={Boolean(errors?.[0])} aria-describedby={describedBy(fieldId, errors, hint)} className={inputClass} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function Checkbox({ label, description, ...props }: { label: string; description?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" {...props} />
      <span>
        <span className="font-medium text-slate-800">{label}</span>
        {description && <span className="block text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}
