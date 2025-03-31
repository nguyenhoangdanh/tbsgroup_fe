import MainLayout from "@/components/common/layouts/client/MainLayout";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPageLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { isAuthenticated } = getKindeServerSession();
    const isUserAuthenticated = await isAuthenticated();

    if (isUserAuthenticated) {
        redirect("/dashboard");
    }

    return (
        <MainLayout>
            {children}
        </MainLayout>
    )
}
