"use client";

import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider } from "@/components/ui/sidebar";
import ThemeSwitcher from "./ThemeSwitcher";
import dynamic from "next/dynamic";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// Sử dụng dynamic import để tránh lỗi hydration
const DynamicAppSidebar = dynamic(() => import("./sidebar/_components/app-sidebar").then(mod => ({ default: mod.AppSidebar })), {
  ssr: false,
});

interface AdminLayoutProps {
  children: React.ReactNode;
  showThemeSwitcher?: boolean;
  breadcrumbItems?: Array<{
    title: string;
    href?: string;
    isCurrentPage?: boolean;
  }>;
  variant?: "default" | "dashboard";
}

// Tạo một custom context provider để quản lý trạng thái sidebar
const SidebarStateContext = React.createContext<{
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
} | null>(null);

const BreadcrumbNavigation = React.memo(({ items }: {
  items: Array<{
    title: string;
    href?: string;
    isCurrentPage?: boolean;
  }>
}) => {
  if (!items || items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <React.Fragment key={`${item.title}-${index}`}>
            {index > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
            <BreadcrumbItem className={index < items.length - 1 ? "hidden sm:block" : ""}>
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href || "#"}>{item.title}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
});

const HeaderSection = React.memo(({
  breadcrumbItems,
  showThemeSwitcher,
  variant = "default",
  onToggleSidebar,
  isCollapsed
}: {
  breadcrumbItems?: AdminLayoutProps["breadcrumbItems"];
  showThemeSwitcher?: boolean;
  variant?: AdminLayoutProps["variant"];
  onToggleSidebar: () => void;
  isCollapsed: boolean;
}) => {
  const headerClasses = variant === "dashboard"
    ? "sticky top-0 z-10 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full"
    : "flex h-14 md:h-16 shrink-0 items-center gap-2 border-b transition-all ease-linear w-full";

  return (
    <header className={headerClasses}>
      <div className="flex items-center justify-between w-full px-2 md:px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="sidebar-trigger flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {breadcrumbItems && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4 hidden sm:block" />
              <BreadcrumbNavigation items={breadcrumbItems} />
            </>
          )}
        </div>
        {showThemeSwitcher && <ThemeSwitcher />}
      </div>
    </header>
  );
});

const _AdminLayout = ({
  children,
  showThemeSwitcher = true,
  breadcrumbItems = [
    { title: "Building Your Application", href: "#" },
    { title: "Data Fetching", isCurrentPage: true },
  ],
  variant = "default",
}: AdminLayoutProps) => {
  const isMobileScreen = useMediaQuery("(max-width: 768px)");
  const [collapsed, setCollapsed] = useState(isMobileScreen);

  useEffect(() => {
    // Only force sidebar closed on initial mobile view
    if (isMobileScreen) {
      setCollapsed(true);
    }
  }, [isMobileScreen]);

  const mainClasses = variant === "dashboard"
    ? "flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 w-full"
    : "flex-1 overflow-y-auto p-3 md:p-6 w-full";

  const sidebarContextValue = React.useMemo(() => ({
    collapsed,
    setCollapsed
  }), [collapsed]);

  const overlayElement = (isMobileScreen && !collapsed) ? (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 sidebar-overlay"
      onClick={() => setCollapsed(true)}
    />
  ) : null;

  // Tính toán lại các class cho sidebar và content
  const sidebarClass = isMobileScreen
    ? 'fixed z-20 transition-all duration-300 ease-in-out'
    : 'sticky top-0 h-screen z-20 transition-all duration-300 ease-in-out';

  // Class thêm cho sidebar dựa vào trạng thái
  const sidebarStateClass = isMobileScreen
    ? (collapsed ? ' translate-x-[-100%]' : ' translate-x-0')
    : (collapsed ? ' sidebar-icon-view' : '');

  // Cấu hình width cho sidebar
  const sidebarWidthClass = isMobileScreen
    ? 'w-56' // Mặc định trên mobile
    : collapsed ? 'w-16' : 'w-56'; // Icon mode: 4rem (16), Expanded: 14rem (56)

  // Tính toán margin cho content dựa vào trạng thái sidebar
  const contentMarginClass = !isMobileScreen
    ? (collapsed ? 'ml-16' : 'ml-56')
    : '';

  return (
    <SidebarProvider>
      <SidebarStateContext.Provider value={sidebarContextValue}>
        <div className="flex flex-col min-h-screen h-full w-full max-w-[100vw] overflow-x-hidden">
          {overlayElement}

          <div className="flex w-full relative">
            {/* Sidebar - Sửa đổi để hiển thị dạng icon khi thu gọn */}
            <aside className={`${sidebarClass}${sidebarStateClass} ${sidebarWidthClass}`}>
              <DynamicAppSidebar />
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${contentMarginClass} max-w-full`}>
              <HeaderSection
                breadcrumbItems={breadcrumbItems}
                showThemeSwitcher={showThemeSwitcher}
                variant={variant}
                onToggleSidebar={() => setCollapsed(!collapsed)}
                isCollapsed={collapsed}
              />
              <main className={mainClasses}>
                {children}
              </main>
            </div>
          </div>
        </div>
      </SidebarStateContext.Provider>
    </SidebarProvider>
  );
};

export const useSidebarState = () => {
  const context = React.useContext(SidebarStateContext);
  if (!context) {
    throw new Error("useSidebarState must be used within SidebarStateContext.Provider");
  }
  return context;
};

const AdminLayout = React.memo(_AdminLayout);

export default AdminLayout;