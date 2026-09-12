"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/lib/home-hero";
import { siteConfig } from "@/lib/site-config";
import { isExternalLink } from "@/lib/validation";

const AUTOPLAY_MS = 5000;
/** Enough of a drag to count as a swipe rather than a tap. */
const SWIPE_PX = 50;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

/**
 * The home page hero. Slides come from /admin/homepage; one slide renders as a still panel
 * with no controls and no autoplay.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const many = slides.length > 1;
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  // Autoplay is off under prefers-reduced-motion and can always be stopped by hand.
  const [playing, setPlaying] = useState(true);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => setIndex((current) => (next + slides.length) % slides.length),
    [slides.length],
  );

  const autoplay = many && playing && !paused && !reducedMotion;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, slides.length]);

  // Never advance behind the viewer's back while the tab is in the background.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!many) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  return (
    <section
      className="relative overflow-hidden bg-[#f6f9f4]"
      aria-roledescription={many ? "carousel" : undefined}
      aria-label={many ? `${siteConfig.name} highlights` : undefined}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.06),transparent_45%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-[32px] border border-[#e4ebdf] bg-white shadow-[0_25px_70px_rgba(15,23,42,0.08)]"
          style={{ touchAction: "pan-y" }}
          onPointerDown={(event) => {
            startX.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (!many || startX.current === null) return;
            const moved = event.clientX - startX.current;
            startX.current = null;
            if (Math.abs(moved) >= SWIPE_PX) go(index + (moved < 0 ? 1 : -1));
          }}
          onPointerCancel={() => {
            startX.current = null;
          }}
        >
          {/* One grid cell holds every slide, so the card keeps its height and nothing shifts. */}
          <div className="grid">
            {slides.map((slide, position) => {
              const current = position === index;
              const Heading = position === 0 ? "h1" : "h2";
              const external = isExternalLink(slide.buttonUrl);
              return (
                <div
                  key={slide.id}
                  // Every slide sits in the same cell; only the current one is visible.
                  className={`col-start-1 row-start-1 grid min-h-[560px] min-w-0 items-center gap-8 lg:min-h-[620px] lg:grid-cols-[1.1fr_0.9fr] ${
                    reducedMotion ? "" : "transition-opacity duration-700 ease-out"
                  } ${current ? "opacity-100" : "pointer-events-none opacity-0"}`}
                  aria-hidden={current ? undefined : true}
                  // Keeps hidden slides out of the tab order and off screen readers.
                  inert={!current}
                  aria-roledescription={many ? "slide" : undefined}
                  aria-label={many ? `${position + 1} of ${slides.length}` : undefined}
                >
                  <div className="order-2 min-w-0 px-6 py-8 sm:px-10 lg:order-1 lg:px-14 lg:py-12">
                    <Heading className="max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                      {slide.title}
                    </Heading>
                    {slide.subtitle && <p className="mt-5 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">{slide.subtitle}</p>}
                    <div className="mt-8">
                      {external ? (
                        <a
                          href={slide.buttonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          {slide.buttonText} <ArrowRight size={16} aria-hidden />
                        </a>
                      ) : (
                        <Link
                          href={slide.buttonUrl}
                          className="inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          {slide.buttonText} <ArrowRight size={16} aria-hidden />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="relative order-1 h-full min-h-[240px] min-w-0 overflow-hidden sm:min-h-[320px] lg:order-2 lg:min-h-[400px]">
                    <img
                      src={slide.imageUrl}
                      alt={slide.imageAlt}
                      width={1920}
                      height={800}
                      // The first slide is the largest paint on the page; the rest can wait.
                      loading={position === 0 ? "eager" : "lazy"}
                      fetchPriority={position === 0 ? "high" : "low"}
                      decoding="async"
                      className="h-full w-full max-w-full object-cover"
                    />
                    {/* Overlay only, so the uploaded image itself is never altered. */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09111b]/70 via-[#09111b]/10 to-transparent" />
                  </div>
                </div>
              );
            })}

            {many && (
              <div className="z-10 col-start-1 row-start-1 flex min-w-0 items-end justify-center self-end p-4 lg:justify-end lg:p-8">
                <div className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/20 bg-slate-900/45 p-2 backdrop-blur-sm">
                  <button
                    type="button"
                    aria-label="Previous slide"
                    onClick={() => go(index - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/20"
                  >
                    <ChevronLeft size={18} aria-hidden />
                  </button>

                  <div className="flex items-center gap-1.5 px-1" role="tablist" aria-label="Choose a slide">
                    {slides.map((slide, position) => (
                      <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={position === index}
                        aria-label={`Slide ${position + 1}: ${slide.title}`}
                        onClick={() => setIndex(position)}
                        // The hit area is 32px tall; only the bar inside it is visible.
                        className="flex h-8 items-center px-1"
                      >
                        <span
                          className={`block h-1.5 rounded-full transition-all ${position === index ? "w-6 bg-white" : "w-2.5 bg-white/50"}`}
                        />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    aria-label="Next slide"
                    onClick={() => go(index + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/20"
                  >
                    <ChevronRight size={18} aria-hidden />
                  </button>

                  {!reducedMotion && (
                    <button
                      type="button"
                      aria-label={playing ? "Stop the slideshow" : "Start the slideshow"}
                      onClick={() => setPlaying((value) => !value)}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/20"
                    >
                      {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
