import MainLayout from '@/components/common/layouts/client/MainLayout';

export default async function LandingPageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const { isAuthenticated } = useAuthManager();

  // if (isAuthenticated) {
  //     redirect("/dashboard");
  // }

  return <MainLayout>{children}</MainLayout>;
}
