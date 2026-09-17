// Class names shared across the admin panel, so every screen uses the same controls.

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60";

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
} as const;

const buttonVariants = {
  primary: "bg-[#0f172a] text-white shadow-sm hover:bg-brand-800",
  secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-800",
  danger: "border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50",
  dangerSolid: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof buttonSizes = "md") {
  return `${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]}`;
}

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 aria-invalid:border-red-300 disabled:bg-slate-50 disabled:text-slate-500";

export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export const cardClass = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]";
