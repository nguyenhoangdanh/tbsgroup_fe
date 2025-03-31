// layout.tsx - Nên tách thành file riêng để Next.js có thể tối ưu

import React from "react";
import { SidebarStateProvider } from "@/components/common/layouts/admin/SidebarStateProvider";
import RootLayoutWrapper from "@/components/common/layouts/admin/RootLayoutWrapper";
import AdminLayoutWrapper from "@/components/common/layouts/admin/AdminLayoutWrapper";

// Gói gọn layout trong các Providers
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <RootLayoutWrapper>
            <SidebarStateProvider>
                <AdminLayoutWrapper>
                    {children}
                </AdminLayoutWrapper>
            </SidebarStateProvider>
        </RootLayoutWrapper>
    );
}