"use client";

import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { removeSampleProducts } from "@/lib/admin-product-actions";
import { NETWORK_ERROR } from "@/lib/messages";

export function RemoveSamplesButton({ count }: { count: number }) {
  const toast = useToast();

  return (
    <ConfirmButton
      label="Remove sample products"
      title="Remove sample products?"
      description={
        <>
          This deletes {count === 1 ? "the sample product" : `all ${count} sample products`}. Past orders keep their item names and
          prices.
        </>
      }
      confirmLabel="Remove samples"
      className={buttonClass("danger", "sm")}
      onConfirm={async () => {
        const result = await removeSampleProducts().catch(() => ({ ok: false, message: NETWORK_ERROR }));
        toast({ message: result.message, tone: result.ok ? "success" : "error" });
      }}
    />
  );
}
