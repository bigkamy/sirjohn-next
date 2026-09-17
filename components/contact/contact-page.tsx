import type { ReactNode } from "react";
import { Mail, MapPin, Phone, Clock3 } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig } from "@/lib/site-config";

const faqs = [
  {
    question: "How long is delivery?",
    answer: "Each delivery option shows its expected delivery time and charge at checkout, before you place your order.",
  },
  {
    question: "How do I track my order?",
    answer: "Log in and open My Orders to see the status of every order you've placed.",
  },
];

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">{icon}</div>
      <div>
        <div className="font-bold text-slate-900">{label}</div>
        <div className="text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { contact } = siteConfig;
  const hasDetails = Boolean(contact.address || contact.phone || contact.email || contact.hours);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Contact us</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Let’s talk golf</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5 self-start rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {contact.address && (
            <Detail icon={<MapPin size={18} />} label="Address">{contact.address}</Detail>
          )}
          {contact.phone && (
            <Detail icon={<Phone size={18} />} label="Phone">
              <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hover:text-brand-700">{contact.phone}</a>
            </Detail>
          )}
          {contact.email && (
            <Detail icon={<Mail size={18} />} label="Email">
              <a href={`mailto:${contact.email}`} className="hover:text-brand-700">{contact.email}</a>
            </Detail>
          )}
          {contact.hours && (
            <Detail icon={<Clock3 size={18} />} label="Business Hours">{contact.hours}</Detail>
          )}
          {!hasDetails && (
            <Detail icon={<Mail size={18} />} label="Get in touch">
              Send us a message using the form and we’ll get back to you.
            </Detail>
          )}
        </div>

        <div id="send-message" className="scroll-mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-2xl font-bold text-slate-900">Send a message</h2>
          <ContactForm />
        </div>
      </div>

      <section id="faq" className="mt-10 scroll-mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-2xl font-bold text-slate-900">FAQ</h2>
        <div className="space-y-4 text-sm text-slate-600">
          {faqs.map((faq) => (
            <details key={faq.question} className="group rounded-2xl border border-slate-200 bg-[#faf8f5] p-4">
              <summary className="cursor-pointer font-medium text-slate-700">{faq.question}</summary>
              <p className="mt-3 leading-6">{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-5 text-sm text-slate-600">
          Something else? <a href="#send-message" className="font-semibold text-brand-700">Send us a message</a> and we’ll get back to you.
        </p>
      </section>
    </main>
  );
}
