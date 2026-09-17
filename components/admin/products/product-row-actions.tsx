"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { useToast } from "@/components/admin/ui/toast";
import { deleteProduct, setProductActive } from "@/lib/admin-product-actions";
import { NETWORK_ERROR } from "@/lib/messages";

/** Shows or hides a product in the store. */
export function VisibilitySwitch({ productId, name, isActive }: { productId: number; name: string; isActive: boolean }) {
  const toast = useToast();
  const [on, setOn] = useState(isActive);
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      const next = !on;
      const result = await setProductActive(productId, next).catch(() => ({ ok: false, message: NETWORK_ERROR }));
      if (result.ok) setOn(next);
      toast({ tone: result.ok ? "success" : "error", message: result.ok ? `${name}: ${result.message}` : result.message });
    });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Show ${name} in the store`}
      disabled={pending}
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-60 ${on ? "bg-brand-600" : "bg-slate-300"}`}
    >
      <span aria-hidden className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export function DeleteProductButton({ productId, name }: { productId: number; name: string }) {
  const toast = useToast();

  return (
    <ConfirmButton
      label={<Trash2 size={14} aria-hidden />}
      ariaLabel={`Delete ${name}`}
      title={`Delete “${name}”?`}
      description="The product is removed from the store, carts, and wishlists. Past orders keep its name and price. This can't be undone — hide the product instead if you may sell it again."
      confirmLabel="Delete product"
      onConfirm={async () => {
        const result = await deleteProduct(productId).catch(() => ({ ok: false, message: NETWORK_ERROR }));
        toast({ tone: result.ok ? "success" : "error", message: result.message });
      }}
    />
  );
}
