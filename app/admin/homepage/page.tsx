import Link from "next/link";
import { GalleryHorizontal } from "lucide-react";
import { HeroSlideForm, RECOMMENDED_HERO_SIZE } from "@/components/admin/homepage/hero-slide-form";
import { HeroSlideRow } from "@/components/admin/homepage/hero-slides-manager";
import { Card, CardHeader, EmptyState, Notice, PageHeader } from "@/components/admin/ui/primitives";
import { listHeroSlides } from "@/lib/admin-home-hero";
import { requirePermission } from "@/lib/auth/dal";
import { MAX_HERO_SLIDES } from "@/lib/home-hero";

export const metadata = { title: "Homepage Hero" };

export default async function Page() {
  await requirePermission("content.manage", "/admin/homepage");
  const slides = await listHeroSlides();
  const full = slides.length >= MAX_HERO_SLIDES;
  const showing = slides.filter((slide) => slide.isActive).length;

  return (
    <>
      <PageHeader
        title="Homepage Hero"
        description={`The slider at the top of the home page. Maximum ${MAX_HERO_SLIDES} hero slides allowed, counting hidden ones. Changes appear on the home page straight away.`}
        actions={<HeroSlideForm disabled={full} />}
      />

      {full && (
        <div className="mb-6">
          <Notice tone="warning">
            You can have a maximum of {MAX_HERO_SLIDES} hero slides. Delete an existing slide before adding another.
          </Notice>
        </div>
      )}

      <Card>
        <CardHeader
          title={`${slides.length} of ${MAX_HERO_SLIDES} slides`}
          description={
            slides.length === 0 ? undefined : showing === 0 ? (
              <>
                None are showing, so the home page falls back to its built-in hero. Choose <strong>Show</strong> on a slide to
                publish it.
              </>
            ) : (
              `${showing} showing on the home page, in the order below.`
            )
          }
        />

        {slides.length === 0 ? (
          <EmptyState
            icon={<GalleryHorizontal size={22} />}
            title="No hero slides yet"
            description={
              <>
                The home page is showing its built-in hero. Add your first slide to take over that space — landscape images
                around {RECOMMENDED_HERO_SIZE} work best.
              </>
            }
            action={<HeroSlideForm />}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {slides.map((slide, index) => (
              <HeroSlideRow key={slide.id} slide={slide} isFirst={index === 0} isLast={index === slides.length - 1} />
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="How the slider behaves" />
          <ul className="space-y-2 px-5 py-4 text-sm text-slate-600">
            <li>Only slides marked <strong>Showing</strong> appear publicly; hidden ones still count towards the {MAX_HERO_SLIDES}.</li>
            <li>With one slide showing, the arrows, dots and autoplay are switched off.</li>
            <li>With none showing, the home page uses its built-in hero instead.</li>
            <li>Slides advance every 5 seconds and pause while a visitor hovers or tabs through them.</li>
            <li>Deleting a slide never deletes the picture — manage files in <Link href="/admin/media" className="text-emerald-700">Media</Link>.</li>
          </ul>
        </Card>

        <Card>
          <CardHeader title="Image guidance" />
          <ul className="space-y-2 px-5 py-4 text-sm text-slate-600">
            <li>Recommended size: <strong>{RECOMMENDED_HERO_SIZE}</strong>, landscape.</li>
            <li>Images are cropped to fit, centred, so keep the subject away from the edges.</li>
            <li>JPG, PNG, WebP, AVIF or GIF, up to 5 MB — the same limits as the media library.</li>
            <li>Alt text describes the picture for screen readers; leave it empty only for purely decorative images.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
