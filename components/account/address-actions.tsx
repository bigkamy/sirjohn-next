"use client";

import { useState, useTransition } from "react";
import { deleteAddress, setDefaultAddress } from "@/lib/address-actions";
import { NETWORK_ERROR } from "@/lib/messages";

const buttonClass =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:opacity-60";

export function AddressActions({ id, label, isDefault }: { id: string; label: string; isDefault: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: (addressId: string) => Promise<void>) =>
    startTransition(async () => {
      setError(null);
      try {
        await action(id);
      } catch {
        setError(NETWORK_ERROR);
      }
    });

  return (
    <>
      {!isDefault && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(setDefaultAddress)}
          className={`${buttonClass} hover:border-brand-300 hover:text-brand-700`}
        >
          Set as Default
        </button>
      )}
      <button
        type="button"
        aria-label={`Delete ${label} address`}
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Delete the "${label}" address?`)) {
            run(deleteAddress);
          }
        }}
        className={`${buttonClass} hover:border-red-200 hover:text-red-600`}
      >
        Delete
      </button>
      {error && (
        <p role="alert" className="basis-full text-xs text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
