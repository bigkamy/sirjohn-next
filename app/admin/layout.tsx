// Every admin page checks the role itself (requireAdmin); this layout only sets metadata.
export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminSegmentLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
