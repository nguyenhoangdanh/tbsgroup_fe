import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminLayoutContent from "@/components/common/layouts/admin/AdminLayout";

const AdminRootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <SidebarProvider>
            <AdminLayoutContent>
                {children}
            </AdminLayoutContent>
        </SidebarProvider>
    );
};

export default AdminRootLayout;