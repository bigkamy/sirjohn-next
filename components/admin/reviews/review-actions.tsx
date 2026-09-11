"use client";

import { Check, Trash2, X } from "lucide-react";
import { useTransition } from "react";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import { deleteReview, moderateReview } from "@/lib/admin-review-actions";
import { NETWORK_ERROR } from "@/lib/messages";

export function ReviewActions({ id, status, author }: { id: number; status: string; author: string }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const moderate = (next: "approved" | "rejected") =>
    startTransition(async () => {
      const result = await moderateReview(id, next).catch(() => ({ ok: false, message: NETWORK_ERROR }));
      toast({ tone: result.ok ? "success" : "error", message: result.message });
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && (
        <button type="button" disabled={pending} onClick={() => moderate("approved")} aria-label={`Publish review by ${author}`} className={buttonClass("primary", "sm")}>
          <Check size={13} aria-hidden /> Publish
        </button>
      )}
      {status !== "rejected" && (
        <button type="button" disabled={pending} onClick={() => moderate("rejected")} aria-label={`Reject review by ${author}`} className={buttonClass("secondary", "sm")}>
          <X size={13} aria-hidden /> {status === "approved" ? "Unpublish" : "Reject"}
        </button>
      )}
      <ConfirmButton
        label={<Trash2 size={14} aria-hidden />}
        ariaLabel={`Delete review by ${author}`}
        title="Delete this review?"
        description="It's removed permanently. The customer can write a new one."
        confirmLabel="Delete review"
        onConfirm={async () => {
          const result = await deleteReview(id).catch(() => ({ ok: false, message: NETWORK_ERROR }));
          toast({ tone: result.ok ? "success" : "error", message: result.message });
        }}
      />
    </div>
  );
}
