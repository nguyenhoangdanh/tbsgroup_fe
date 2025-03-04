"use client";
import { useState, useEffect, useTransition } from "react";
import { usePathname } from "next/navigation";
import LazyLoader from "@/components/common/LazyLoader";

const PageLoader = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true); // Hiển thị Loader ngay khi đường dẫn thay đổi
        startTransition(() => {
            setTimeout(() => setLoading(false), 2000); // Đợi trang load xong mới tắt loader
        });
    }, [pathname]);

    return loading ? <LazyLoader /> : <>{children}</>;
};

export default PageLoader;
