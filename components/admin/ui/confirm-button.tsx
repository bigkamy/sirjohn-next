"use client";

import { useId, useRef, useTransition, type ReactNode } from "react";
import { buttonClass } from "./styles";

type ConfirmButtonProps = {
  /** The button that opens the dialog. */
  label: ReactNode;
  /** Accessible name when the label is only an icon. */
  ariaLabel?: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  className?: string;
  disabled?: boolean;
  /** Extra controls inside the dialog (e.g. a checkbox); their values arrive in the FormData. */
  children?: ReactNode;
  onConfirm: (formData: FormData) => Promise<unknown> | unknown;
};

/** A button that asks for confirmation in a modal dialog before a destructive action. */
export function ConfirmButton({
  label,
  ariaLabel,
  title,
  description,
  confirmLabel,
  tone = "danger",
  className = buttonClass("danger", "sm"),
  disabled,
  children,
  onConfirm,
}: ConfirmButtonProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button type="button" aria-label={ariaLabel} className={className} disabled={disabled} onClick={() => dialog.current?.showModal()}>
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => {
          if (event.target === dialog.current && !pending) dialog.current.close();
        }}
      >
        <form
          className="p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              await onConfirm(formData);
              dialog.current?.close();
            });
          }}
        >
          <h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>
          <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>
          {children && <div className="mt-4">{children}</div>}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" disabled={pending} onClick={() => dialog.current?.close()} className={buttonClass("secondary")}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={buttonClass(tone === "danger" ? "dangerSolid" : "primary")}>
              {pending ? "Working…" : confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
