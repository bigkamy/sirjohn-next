// Business details shown across the storefront, kept in one place.
//
// Leave a value as null until you have the real detail. The site then hides it — or, on the
// policy pages, shows a highlighted placeholder — instead of displaying something made up,
// and the admin dashboard's launch checklist lists whatever is still missing.

export type Testimonial = { name: string; review: string; product: string };
export type SocialLink = { label: string; href: string };
export type Stat = { value: string; label: string };

export const siteConfig = {
  /** Store name used in page titles, the footer, and the policies. */
  name: "Sir John Golf Co.",
  description: "Premium golf equipment, apparel, footwear, and accessories for modern golfers.",
  locale: "en_IN",
  /** Shown in the header. Checkout currently accepts Indian delivery addresses only. */
  country: "India",

  brand: {
    /** Text logo shown in the header and footer. */
    wordmark: "SIR JOHN",
    tagline: "Golf Co.",
    /** Letters drawn on the generated favicon and app icon (app/icon.tsx, app/apple-icon.tsx). */
    monogram: "SJ",
    shortName: "Sir John Golf",
    /** A logo file to show instead of the text wordmark, e.g. "/images/logo.svg" in /public. */
    logoSrc: null as string | null,
    /** Colours used for the generated icons and the browser theme colour. */
    primaryColor: "#0f172a",
    accentColor: "#34d399",
  },

  /** Registered legal name of the business, used in the policies and footer. */
  legalName: null as string | null,

  contact: {
    /** Full postal address. */
    address: null as string | null,
    /** Customer phone number, including country code. */
    phone: null as string | null,
    /** Customer support email address. */
    email: null as string | null,
    /** Opening or support hours. */
    hours: null as string | null,
  },

  /** Social profiles, e.g. { label: "Instagram", href: "https://instagram.com/…" }. Icons are hidden while empty. */
  social: [] as SocialLink[],

  /** Genuine, attributable customer reviews for the home page. The section is hidden while empty. */
  testimonials: [] as Testimonial[],

  /** Headline figures for the About page, e.g. { value: "500+", label: "Products" }. Hidden while empty. */
  aboutStats: [] as Stat[],
};

/** Business details still left empty, for the admin launch checklist. */
export function missingBusinessDetails() {
  const fields: [string, string | null][] = [
    ["legal business name", siteConfig.legalName],
    ["address", siteConfig.contact.address],
    ["phone", siteConfig.contact.phone],
    ["email", siteConfig.contact.email],
    ["business hours", siteConfig.contact.hours],
  ];
  return fields.filter(([, value]) => !value).map(([label]) => label);
}
