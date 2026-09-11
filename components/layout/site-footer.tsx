import Link from "next/link";
import { Globe, Mail, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { freeShippingLabel } from "@/lib/shipping-copy";
import { siteConfig } from "@/lib/site-config";

const supportLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping Policy", href: "/policies/shipping" },
  { label: "Returns & Refunds", href: "/policies/returns" },
  { label: "FAQs", href: "/contact#faq" },
  { label: "Track Order", href: "/account/orders" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
];

type SiteFooterProps = { freeShippingOver: number | null; categories: string[] };

export function SiteFooter({ freeShippingOver, categories }: SiteFooterProps) {
  const { contact, social } = siteConfig;
  const hasContactDetails = Boolean(contact.address || contact.phone || contact.email);

  return (
    <footer className="bg-[#0d1b1d] text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-5 xl:col-span-2">
            <BrandLogo tone="dark" />
            <p className="max-w-md text-sm leading-7 text-slate-300">
              Premium performance gear for golfers who refuse to compromise on precision, comfort, and confidence on every fairway.
            </p>
            {social.length > 0 && (
              <div className="flex gap-3 text-slate-200">
                {social.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    aria-label={link.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800/80 transition hover:border-emerald-500 hover:text-emerald-400"
                  >
                    <Globe size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-white">Shop</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><Link href="/shop" className="hover:text-emerald-400">All Products</Link></li>
              {categories.slice(0, 5).map((category) => (
                <li key={category}>
                  <Link href={`/shop?category=${encodeURIComponent(category)}`} className="hover:text-emerald-400">{category}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-white">Customer Service</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-emerald-400">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-white">Contact</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {contact.address && (
                <li className="flex items-start gap-3"><MapPin size={16} className="mt-1 shrink-0 text-emerald-400" /> {contact.address}</li>
              )}
              {contact.phone && (
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-emerald-400" />
                  <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hover:text-emerald-400">{contact.phone}</a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center gap-3">
                  <Mail size={16} className="text-emerald-400" />
                  <a href={`mailto:${contact.email}`} className="hover:text-emerald-400">{contact.email}</a>
                </li>
              )}
              {!hasContactDetails && (
                <li>
                  Reach us through our <Link href="/contact" className="text-emerald-400 hover:text-emerald-300">contact form</Link>.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8">
          <div className="flex flex-col gap-4 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <p>© {new Date().getFullYear()} {siteConfig.legalName ?? siteConfig.name}. All Rights Reserved.</p>
              {legalLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-emerald-400">{link.label}</Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <span className="inline-flex items-center gap-2"><Truck size={16} className="text-emerald-400" /> {freeShippingLabel(freeShippingOver)}</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-400" /> Secure checkout</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
