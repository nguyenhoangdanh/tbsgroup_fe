
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
import { AlignJustify } from "lucide-react";

// Sử dụng dynamic import để tránh lỗi hydration
const DynamicAppSidebar = dynamic(
  () => import("./sidebar/_components/app-sidebar").then(mod => ({ default: mod.AppSidebar })),
  { ssr: false, loading: () => <div className="h-screen bg-background" /> }
);

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
  isMobileView: boolean;
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

BreadcrumbNavigation.displayName = "BreadcrumbNavigation";


const HeaderSection = React.memo(({
  breadcrumbItems,
  showThemeSwitcher,
  variant = "default",
  onToggleSidebar,
  isCollapsed,
  isMobileView
}: {
  breadcrumbItems?: AdminLayoutProps["breadcrumbItems"];
  showThemeSwitcher?: boolean;
  variant?: AdminLayoutProps["variant"];
  onToggleSidebar: () => void;
  isCollapsed: boolean;
  isMobileView: boolean;
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
            aria-label={isCollapsed || isMobileView ? "Expand sidebar" : "Collapse sidebar"}
          >
            <AlignJustify
              className={`transition-transform duration-200 ${isCollapsed || isMobileView ? "rotate-180" : ""}`}
            />
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
})

HeaderSection.displayName = "HeaderSection";

// Main content wrapper component to prevent re-renders of main content
const MainContent = React.memo(({ children, variant }: { children: React.ReactNode, variant?: "default" | "dashboard" }) => {
  const mainClasses = variant === "dashboard"
    ? "flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 w-full"
    : "flex-1 overflow-y-auto p-3 md:p-6 w-full";

  return <main className={mainClasses}>{children}</main>;
});

MainContent.displayName = "MainContent";

// Separated Sidebar component to prevent re-renders
const SidebarComponent = React.memo(({ collapsed, isClient, isSmallScreen }: {
  collapsed: boolean,
  isClient: boolean,
  isSmallScreen: boolean
}) => {
  if (!isClient) return null;

  return (
    <div
      className={`
        ${isSmallScreen ? 'fixed z-20' : 'relative'} 
        transition-all duration-300 ease-in-out h-screen
        ${collapsed ? 'w-16' : 'w-56'}
        ${(isSmallScreen && collapsed) || !isClient ? 'hidden' : ''}
      `}
    >
      <DynamicAppSidebar />
    </div>
  );
});

SidebarComponent.displayName = "SidebarComponent";

// Memoized overlay component
const SidebarOverlay = React.memo(({ isSmallScreen, collapsed, onCollapse }: {
  isSmallScreen: boolean,
  collapsed: boolean,
  onCollapse: () => void
}) => {
  if (!(isSmallScreen && !collapsed)) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10"
      onClick={onCollapse}
    />
  );
});

SidebarOverlay.displayName = "SidebarOverlay";


const _AdminLayout = ({
  children,
  showThemeSwitcher = true,
  breadcrumbItems = [
    { title: "Building Your Application", href: "#" },
    { title: "Data Fetching", isCurrentPage: true },
  ],
  variant = "default",
}: AdminLayoutProps) => {
  // Xác định thiết bị
  const isMobileScreen = useMediaQuery("(max-width: 768px)");
  const isTabletScreen = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
  const isSmallScreen = isMobileScreen || isTabletScreen;
  const [isClient, setIsClient] = useState(false);

  // Trạng thái sidebar - Mặc định đóng trên tất cả thiết bị
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setIsClient(true);

    // Khôi phục trạng thái sidebar từ localStorage cho desktop
    if (!isSmallScreen) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setCollapsed(savedState === 'true');
      } else {
        // Mặc định mở trên desktop
        setCollapsed(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);

      // For desktop views
      if (!isSmallScreen) {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState !== null) {
          setCollapsed(savedState === 'true');
        } else {
          // Default open on desktop
          setCollapsed(false);
        }
      }
    }
  }, [isSmallScreen]);

  const sidebarContextValue = React.useMemo(() => ({
    collapsed,
    setCollapsed,
    isMobileView: isSmallScreen
  }), [collapsed, isSmallScreen]);

  // Overlay khi sidebar mở trên thiết bị nhỏ
  const overlayElement = (isSmallScreen && !collapsed) ? (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10"
      onClick={() => setCollapsed(true)}
    />
  ) : null;

  return (
    <SidebarProvider>
      <SidebarStateContext.Provider value={sidebarContextValue}>
        <div className="flex min-h-screen h-full w-full overflow-hidden">
          {/* Overlay cho thiết bị nhỏ */}
          {overlayElement}

          <div
            className={`
    ${isSmallScreen ? 'fixed z-20' : 'relative'} 
    transition-all duration-300 ease-in-out h-screen
    ${collapsed ? 'w-16' : 'w-56'}
    ${(isSmallScreen && collapsed) || !isClient ? 'hidden' : ''}
  `}
          >
            {isClient && <DynamicAppSidebar />}
          </div>

          {/* Main Content */}
          <div
            className={`
              flex flex-col flex-grow 
              transition-all duration-300 ease-in-out
            `}
            style={{
              width: isSmallScreen
                ? '100%'
                : (collapsed ? 'calc(100% - 4rem)' : 'calc(100% - 14rem)')
            }}
          >
            <HeaderSection
              breadcrumbItems={breadcrumbItems}
              showThemeSwitcher={showThemeSwitcher}
              variant={variant}
              onToggleSidebar={() => setCollapsed(!collapsed)}
              isCollapsed={collapsed}
              isMobileView={isSmallScreen}
            />
            <MainContent variant={variant}>
              {children}
            </MainContent>
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