"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { refreshShopperState } from "@/components/shopper/shopper-state";
import { removeFromCart, updateCartQuantity } from "@/lib/cart-actions";
import { NETWORK_ERROR } from "@/lib/messages";

type CartResult = { ok: boolean; message: string };

// Runs a cart action and returns a message to show (limits, failures, expired sessions).
async function runCartAction(action: () => Promise<CartResult>) {
  const result = await action().catch(() => ({ ok: false, message: NETWORK_ERROR }));
  await refreshShopperState();
  return result.message || null;
}

export function QuantityStepper({ lineKey, quantity, max }: { lineKey: string; quantity: number; max: number }) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const change = (next: number) =>
    startTransition(async () => {
      setNotice(null);
      setNotice(await runCartAction(() => updateCartQuantity(lineKey, next)));
    });

  return (
    <div>
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-[#faf8f5] px-2 py-2" aria-busy={pending}>
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={pending || quantity <= 1}
          onClick={() => change(quantity - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 disabled:opacity-50"
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-slate-900">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={pending || quantity >= max}
          onClick={() => change(quantity + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 disabled:opacity-50"
        >
          <Plus size={14} />
        </button>
      </div>
      {notice && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {notice}
        </p>
      )}
    </div>
  );
}

export function RemoveFromCartButton({ lineKey, name }: { lineKey: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        aria-label={`Remove ${name} from cart`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setNotice(null);
            setNotice(await runCartAction(() => removeFromCart(lineKey)));
          })
        }
        className="text-slate-400 hover:text-red-500 disabled:opacity-50"
      >
        <Trash2 size={18} />
      </button>
      {notice && (
        <p role="alert" className="mt-1 max-w-[12rem] text-right text-xs text-red-600">
          {notice}
        </p>
      )}
    </div>
  );
}
