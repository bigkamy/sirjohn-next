import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
};

export function FormField({ label, name, id, errors, className, ...inputProps }: FormFieldProps) {
  // Pass an id when several forms on one page share field names.
  const inputId = id ?? name;
  const error = errors?.[0];
  const errorId = `${inputId}-error`;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-2xl border border-slate-200 bg-[#f7f9f7] px-4 py-3 text-sm outline-none focus:border-emerald-500 aria-invalid:border-red-300"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  errors?: string[];
};

export function TextAreaField({ label, name, id, errors, className, ...textareaProps }: TextAreaFieldProps) {
  const inputId = id ?? name;
  const error = errors?.[0];
  const errorId = `${inputId}-error`;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={inputId}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="w-full rounded-2xl border border-slate-200 bg-[#f7f9f7] px-4 py-3 text-sm outline-none focus:border-emerald-500 aria-invalid:border-red-300"
        {...textareaProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormAlert({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (message) {
    return (
      <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {message}
      </p>
    );
  }

  return null;
}

export function SubmitButton({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
