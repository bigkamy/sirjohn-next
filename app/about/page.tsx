import { AboutPage } from "@/components/about/about-page";

export const metadata = {
  title: "About Us",
  description: "Sir John Golf Co. curates premium golf equipment and apparel for players who take their game seriously.",
  alternates: { canonical: "/about" },
};

export default function Page() {
  return <AboutPage />;
}
