import Header from "./Header";
import Footer from "./Footer";

/**
 * Standard page layout wrapper: Header + main content + Footer.
 * Use this for all public-facing pages (courses, profile, etc.).
 */
export default function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-64px-128px)]">{children}</main>
      <Footer />
    </>
  );
}
