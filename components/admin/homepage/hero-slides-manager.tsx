"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, ImageIcon, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { HeroSlideForm } from "@/components/admin/homepage/hero-slide-form";
import { HeroSlidePreview } from "@/components/admin/homepage/hero-slide-preview";
import { Badge } from "@/components/admin/ui/badge";
import { ConfirmButton } from "@/components/admin/ui/confirm-button";
import { buttonClass } from "@/components/admin/ui/styles";
import { useToast } from "@/components/admin/ui/toast";
import type { AdminHeroSlide } from "@/lib/admin-home-hero";
import { deleteHeroSlide, moveHeroSlide, setHeroSlideActive } from "@/lib/admin-home-hero-actions";
import { NETWORK_ERROR } from "@/lib/messages";

export function HeroSlideRow({ slide, isFirst, isLast }: { slide: AdminHeroSlide; isFirst: boolean; isLast: boolean }) {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const result = await action().catch(() => ({ ok: false, message: NETWORK_ERROR }));
      toast({ tone: result.ok ? "success" : "error", message: result.message });
    });

  return (
    <li aria-label={`Hero slide ${slide.sortOrder}`} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700" aria-hidden>
            {slide.sortOrder}
          </span>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={pending || isFirst}
              aria-label={`Move slide ${slide.sortOrder} up`}
              onClick={() => run(() => moveHeroSlide(slide.id, "up"))}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowUp size={15} aria-hidden />
            </button>
            <button
              type="button"
              disabled={pending || isLast}
              aria-label={`Move slide ${slide.sortOrder} down`}
              onClick={() => run(() => moveHeroSlide(slide.id, "down"))}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowDown size={15} aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex h-20 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
          {slide.imageUrl ? (
            <img src={slide.imageUrl} alt={slide.imageAlt} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon size={22} aria-hidden />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{slide.title}</p>
          {slide.isActive ? <Badge tone="success">Showing</Badge> : <Badge>Hidden</Badge>}
        </div>
        {slide.subtitle && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{slide.subtitle}</p>}
        <p className="mt-2 text-xs text-slate-500">
          Button: <span className="font-medium text-slate-700">{slide.buttonText}</span> → <span className="break-all">{slide.buttonUrl}</span>
        </p>
        {!slide.imageAlt && (
          <p className="mt-1 text-xs text-amber-700">No alt text — add a description unless the image is purely decorative.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <HeroSlideForm slide={slide} />
        <HeroSlidePreview slide={slide} />
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setHeroSlideActive(slide.id, !slide.isActive))}
          className={buttonClass("secondary", "sm")}
        >
          {slide.isActive ? <><EyeOff size={13} aria-hidden /> Hide</> : <><Eye size={13} aria-hidden /> Show</>}
        </button>
        <ConfirmButton
          label={<Trash2 size={14} aria-hidden />}
          ariaLabel={`Delete slide ${slide.sortOrder}`}
          title={`Delete slide ${slide.sortOrder}?`}
          description={
            <>
              “{slide.title}” is removed from the home page and the remaining slides move up to close the gap. The image stays
              in your media library.
            </>
          }
          confirmLabel="Delete slide"
          onConfirm={async () => {
            const result = await deleteHeroSlide(slide.id).catch(() => ({ ok: false, message: NETWORK_ERROR }));
            toast({ tone: result.ok ? "success" : "error", message: result.message });
          }}
        />
      </div>
    </li>
  );
}
