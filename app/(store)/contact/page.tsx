import { ContactPage } from "@/components/contact/contact-page";

export const metadata = {
  title: "Contact Us",
  description: "Questions about golf equipment, orders, or delivery? Get in touch with Sir John Golf Co.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <ContactPage />;
}
