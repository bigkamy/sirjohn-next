import { siteConfig } from "@/lib/site-config";
import { siteImages } from "@/lib/site-images";

const values = [
  { title: "Quality", text: "Only authentic, performance-first gear for real games." },
  { title: "Performance", text: "Every product is selected to improve consistency and confidence." },
  { title: "Trust", text: "Transparent service, secure checkout, and dependable support." },
  { title: "Passion", text: "We live and breathe golf, from tee box to final putt." },
];

export function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_1.1fr]">
          <div
            className="bg-cover bg-center p-8 text-white sm:p-10"
            style={{ backgroundImage: `linear-gradient(rgba(15,23,42,0.54),rgba(15,23,42,0.48)),url('${siteImages.about}')` }}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-300">About our brand</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">For the love of golf</h1>
          </div>
          <div className="p-8 sm:p-10">
            <p className="text-base leading-8 text-slate-600">
              {siteConfig.name} was created for golfers who value precision, craftsmanship, and premium performance. We curate equipment and apparel that help players play with more confidence, consistency, and style.
            </p>
            <p className="mt-5 text-base leading-8 text-slate-600">
              From drivers and fairway woods to premium bags and performance apparel, our mission is simple: make elite golf gear accessible to players who are serious about the game.
            </p>
          </div>
        </div>
      </section>

      {siteConfig.aboutStats.length > 0 && (
        <section className="mt-12 grid gap-5 md:grid-cols-4">
          {siteConfig.aboutStats.map((stat) => (
            <div key={stat.label} className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="text-3xl font-black text-slate-900">{stat.value}</div>
              <div className="mt-2 text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </section>
      )}

      <section className="mt-12">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Our values</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Built on trust and performance</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => (
            <div key={value.title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-xl font-bold text-slate-900">{value.title}</div>
              <p className="text-base leading-7 text-slate-600">{value.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
