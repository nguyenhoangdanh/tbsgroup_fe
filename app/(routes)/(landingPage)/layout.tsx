import LandingHeader from '@/components/common/layouts/landing/LandingHeader';
import LandingFooter from '@/components/common/layouts/landing/LandingFooter';
import ScrollToTop from '@/components/common/ui/ScrollToTop';

export default async function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1 pt-16 lg:pt-20">{children}</main>
      <LandingFooter />
      <ScrollToTop />
    </div>
  );
}
