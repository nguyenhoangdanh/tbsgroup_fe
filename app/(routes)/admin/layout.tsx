import AdminLayout from "@/components/common/layouts/admin/AdminLayout";

const RootLayout: React.FC<{ children: React.ReactNode }> = async ({ children }) => {
    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    );
};

export default RootLayout;