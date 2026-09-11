// Account pages are private to each customer, so keep them out of search results.
export const metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default function AccountSegmentLayout({ children }: LayoutProps<"/account">) {
  return children;
}
