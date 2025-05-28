'use client';

import { AlignJustify } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { useCallback, useMemo } from 'react';

import {
  useSidebarCollapsed,
  useSidebarSetCollapsed,
  useSidebarIsMobileView,
} from './SidebarStateProvider';
import ThemeSwitcher from './ThemeSwitcher';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { useRouteChangeHandler } from '@/hooks/useRouteChangeHandler';

const DynamicAppSidebar = dynamic(
  () =>
    import('./sidebar/_components/app-sidebar').then(mod => ({
      default: mod.AppSidebar,
    })),
  { ssr: false, loading: () => <div className="h-screen bg-background" /> },
);

interface AdminLayoutProps {
  children: React.ReactNode;
  showThemeSwitcher?: boolean;
  breadcrumbItems?: Array<{
    title: string;
    href?: string;
    isCurrentPage?: boolean;
  }>;
  variant?: 'default' | 'dashboard';
}

const BreadcrumbNavigation = React.memo(
  ({
    items,
  }: {
    items: Array<{
      title: string;
      href?: string;
      isCurrentPage?: boolean;
    }>;
  }) => {
    if (!items || items.length === 0) return null;

    return (
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={`${item.title}-${index}`}>
              {index > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
              <BreadcrumbItem className={index < items.length - 1 ? 'hidden sm:block' : ''}>
                {item.isCurrentPage ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href || '#'}>{item.title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  },
);

BreadcrumbNavigation.displayName = 'BreadcrumbNavigation';

const HeaderSection = React.memo(
  ({
    breadcrumbItems,
    showThemeSwitcher,
    variant = 'default',
    onToggleSidebar,
    isCollapsed,
    isMobileView,
  }: {
    breadcrumbItems?: AdminLayoutProps['breadcrumbItems'];
    showThemeSwitcher?: boolean;
    variant?: AdminLayoutProps['variant'];
    onToggleSidebar: () => void;
    isCollapsed: boolean;
    isMobileView: boolean;
  }) => {
    const headerClasses =
      variant === 'dashboard'
        ? 'sticky top-0 z-10 flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full'
        : 'flex h-14 md:h-16 shrink-0 items-center gap-2 border-b transition-all ease-linear w-full';

    return (
      <header className={headerClasses}>
        <div className="flex items-center justify-between w-full px-2 md:px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSidebar}
              className="sidebar-trigger flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
              aria-label={isCollapsed || isMobileView ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <AlignJustify
                className={`transition-transform duration-200 ${isCollapsed || isMobileView ? 'rotate-180' : ''}`}
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
  },
);

HeaderSection.displayName = 'HeaderSection';

const MainContent = React.memo(
  ({ children, variant }: { children: React.ReactNode; variant?: 'default' | 'dashboard' }) => {
    const mainClasses =
      variant === 'dashboard'
        ? 'flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 w-full'
        : 'flex-1 overflow-y-auto p-3 md:p-6 w-full';

    return <main className={mainClasses}>{children}</main>;
  },
);

MainContent.displayName = 'MainContent';

const SidebarComponent = React.memo(
  ({
    collapsed,
    isClient,
    isSmallScreen,
  }: {
    collapsed: boolean;
    isClient: boolean;
    isSmallScreen: boolean;
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
  },
);

SidebarComponent.displayName = 'SidebarComponent';

const SidebarOverlay = React.memo(
  ({
    isSmallScreen,
    collapsed,
    onCollapse,
  }: {
    isSmallScreen: boolean;
    collapsed: boolean;
    onCollapse: () => void;
  }) => {
    if (!(isSmallScreen && !collapsed)) return null;

    return <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10" onClick={onCollapse} />;
  },
);

SidebarOverlay.displayName = 'SidebarOverlay';

const AdminLayout = ({
  children,
  showThemeSwitcher = true,
  breadcrumbItems = [
    { title: 'Building Your Application', href: '#' },
    { title: 'Data Fetching', isCurrentPage: true },
  ],
  variant = 'default',
}: AdminLayoutProps) => {
  useRouteChangeHandler(); // Sử dụng hook để xử lý route change

  const collapsed = useSidebarCollapsed();
  const setCollapsed = useSidebarSetCollapsed();
  const isMobileView = useSidebarIsMobileView();

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const handleCollapse = useCallback(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  const contentStyle = useMemo(
    () => ({
      width: isMobileView ? '100%' : collapsed ? 'calc(100% - 4rem)' : 'calc(100% - 14rem)',
    }),
    [isMobileView, collapsed],
  );

  return (
    <div className="flex min-h-screen h-full w-full overflow-hidden bg-white dark:bg-gray-950 text-slate-900 dark:text-slate-50">
      {/* Overlay for mobile/tablet view */}
      <SidebarOverlay
        isSmallScreen={isMobileView}
        collapsed={collapsed}
        onCollapse={handleCollapse}
      />

      {/* Sidebar */}
      <SidebarComponent collapsed={collapsed} isClient={isClient} isSmallScreen={isMobileView} />

      {/* Main Content */}
      <div
        className="flex flex-col flex-grow transition-all duration-300 ease-in-out"
        style={contentStyle}
      >
        <HeaderSection
          breadcrumbItems={breadcrumbItems}
          showThemeSwitcher={showThemeSwitcher}
          variant={variant}
          onToggleSidebar={handleToggleSidebar}
          isCollapsed={collapsed}
          isMobileView={isMobileView}
        />
        <MainContent variant={variant}>
          <Link href="/" className="text-blue-500 hover:underline">
            {/* <ChevronRight size={18} /> */}
            Quay lại trang chủ
          </Link>
          {children}
        </MainContent>
      </div>
    </div>
  );
};

export default React.memo(AdminLayout);
