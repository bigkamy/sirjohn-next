"use client";

import { ArrowRight, Eye } from "lucide-react";
import { useId, useRef } from "react";
import { buttonClass } from "@/components/admin/ui/styles";
import type { AdminHeroSlide } from "@/lib/admin-home-hero";
import { isExternalLink } from "@/lib/validation";

/** Shows the slide the way the home page draws it, without leaving the admin panel. */
export function HeroSlidePreview({ slide }: { slide: AdminHeroSlide }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        aria-label={`Preview slide ${slide.sortOrder}`}
        onClick={() => dialog.current?.showModal()}
        className={buttonClass("secondary", "sm")}
      >
        <Eye size={13} aria-hidden /> Preview
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(56rem,calc(100%-2rem))] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold">Slide {slide.sortOrder} preview</h2>
          <button type="button" onClick={() => dialog.current?.close()} className={buttonClass("secondary", "sm")}>Close</button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto bg-[#f6f9f4] p-5">
          <div className="overflow-hidden rounded-[24px] border border-[#e4ebdf] bg-white shadow-sm">
            <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="order-2 px-6 py-7 lg:order-1 lg:px-10">
                <p className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">{slide.title}</p>
                {slide.subtitle && <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">{slide.subtitle}</p>}
                <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white">
                  {slide.buttonText} <ArrowRight size={15} aria-hidden />
                </span>
                <p className="mt-4 break-all text-xs text-slate-500">
                  Links to {slide.buttonUrl}
                  {isExternalLink(slide.buttonUrl) && " (opens in a new tab)"}
                </p>
              </div>
              <div className="relative order-1 min-h-[180px] overflow-hidden sm:min-h-[240px] lg:order-2 lg:h-full">
                <img src={slide.imageUrl} alt={slide.imageAlt} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09111b]/70 via-[#09111b]/10 to-transparent" />
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            A close approximation. The live hero is taller and, with more than one active slide, adds arrows and dots.
          </p>
        </div>
      </dialog>
    </>
  );
}
