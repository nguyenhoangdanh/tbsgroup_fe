"use client";

import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminLayout from "@/components/common/layouts/admin/AdminLayout";

// Tách AdminLayoutWrapper thành component riêng biệt và memo
const AdminLayoutWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider>
            <AdminLayout>
                {children}
            </AdminLayout>
        </SidebarProvider>
    );
});

AdminLayoutWrapper.displayName = "AdminLayoutWrapper";

export default AdminLayoutWrapper;