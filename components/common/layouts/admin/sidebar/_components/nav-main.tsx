"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon, Shield, AlertCircle } from "lucide-react"
import { usePathname } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { useSidebarCollapsed, useSidebarIsMobileView } from "../../SidebarStateProvider"
import Link from "next/link"
import { hasRouteAccess, UserRole } from "@/utils/permission-utils";
import { useAuthManager } from "@/hooks/auth/useAuthManager";

interface SubItemProps {
  title: string;
  url: string;
  hasAccess?: boolean;
}

interface NavItemType {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavSubItemType[];
}

interface NavSubItemType {
  title: string;
  url: string;
}

const SubItem = React.memo(({
  title,
  url,
  hasAccess = true
}: SubItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === url;

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild={hasAccess}
        className={`
          ${!hasAccess ? "opacity-50 cursor-not-allowed" : ""}
          ${isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500" : "hover:bg-slate-50 dark:hover:bg-slate-800"}
          transition-all duration-200 rounded-lg mx-1
        `}
      >
        {hasAccess ? (
          <Link href={url} className="w-full">
            <span className={isActive ? "font-medium" : ""}>{title}</span>
          </Link>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center w-full">
                  <span>{title}</span>
                  <Shield size={14} className="ml-auto text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Bạn không có quyền truy cập vào tính năng này</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
});

SubItem.displayName = "SubItem";

const PopoverNavItem = React.memo(({ item, userRole }: {
  item: NavItemType,
  userRole?: UserRole;
}) => {
  return (
    <SidebarMenuItem>
      <Popover>
        <PopoverTrigger asChild>
          <SidebarMenuButton 
            tooltip={item.title}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
          >
            {item.icon && <item.icon className="text-slate-600 dark:text-slate-400" />}
            <span className="sr-only">{item.title}</span>
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          alignOffset={-8}
          className="p-0 w-64 shadow-lg border-slate-200 dark:border-slate-700"
        >
          <div className="py-2">
            <div className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700">
              {item.title}
            </div>
            <div className="py-1">
              {item.items?.map((subItem: NavSubItemType) => {
                const itemHasAccess = userRole ? hasRouteAccess(subItem.url, userRole) : false;
                return (
                  <div key={subItem.title} className="px-2">
                    {itemHasAccess ? (
                      <Link
                        href={subItem.url}
                        className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors duration-200"
                      >
                        {subItem.title}
                      </Link>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-between items-center px-3 py-2 text-sm opacity-50 cursor-not-allowed text-slate-500">
                              {subItem.title}
                              <Shield size={14} className="ml-2" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Bạn không có quyền truy cập vào tính năng này</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
});

PopoverNavItem.displayName = "PopoverNavItem";

const CollapsibleNavItem = React.memo(({ item, userRole }: {
  item: NavItemType,
  userRole?: UserRole;
}) => {
  const pathname = usePathname();
  const isMainActive = pathname === item.url;
  const hasActiveChild = item.items?.some(subItem => pathname === subItem.url);
  const isExpanded = item.isActive || isMainActive || hasActiveChild;

  return (
    <Collapsible
      asChild
      defaultOpen={isExpanded}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton 
            tooltip={item.title}
            className={`
              ${isMainActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "hover:bg-slate-50 dark:hover:bg-slate-800"}
              transition-all duration-200 rounded-lg group
            `}
          >
            {item.icon && (
              <item.icon className={`
                ${isMainActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"}
                transition-colors duration-200
              `} />
            )}
            <span className={isMainActive ? "font-medium" : ""}>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-slate-400" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="transition-all duration-200">
          <SidebarMenuSub className="ml-4 border-l border-slate-200 dark:border-slate-700 pl-2">
            {item.items?.map((subItem) => {
              const itemHasAccess = userRole ? hasRouteAccess(subItem.url, userRole) : false;
              return (
                <SubItem
                  key={subItem.title}
                  title={subItem.title}
                  url={subItem.url}
                  hasAccess={itemHasAccess}
                />
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
});

CollapsibleNavItem.displayName = "CollapsibleNavItem";

const NavItemRenderer = React.memo(({
  item,
  isIconMode,
  userRole
}: {
  item: NavItemType,
  isIconMode: boolean,
  userRole?: UserRole;
}) => {
  return isIconMode
    ? <PopoverNavItem item={item} userRole={userRole} />
    : <CollapsibleNavItem item={item} userRole={userRole} />;
});

NavItemRenderer.displayName = "NavItemRenderer";

export const NavMain = React.memo(({
  items,
}: {
  items: NavItemType[]
}) => {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();
  const isMobileView = useSidebarIsMobileView();
  const { user } = useAuthManager();
  const userRole = user?.role as UserRole | undefined;

  const isIconMode = React.useMemo(() => {
    return !isMobileView && collapsed;
  }, [isMobileView, collapsed]);

  const processedItems = React.useMemo(() => {
    return items.map(item => ({
      ...item,
      isActive: item.isActive ||
        (pathname && pathname.startsWith(item.url) && item.url !== '#') ||
        item.items?.some(subItem => pathname && pathname.startsWith(subItem.url))
    }));
  }, [items, pathname]);

  if (!processedItems || processedItems.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className={`${isIconMode ? "hidden" : ""} text-slate-500 dark:text-slate-400 font-medium`}>
          Platform
        </SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="cursor-default opacity-50">
              <AlertCircle size={18} className="text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Không có menu hiển thị</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className={`${isIconMode ? "hidden" : ""} text-slate-500 dark:text-slate-400 font-medium px-2 py-1`}>
        Platform
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {processedItems.map((item) => (
          <NavItemRenderer
            key={item.title}
            item={item}
            isIconMode={isIconMode}
            userRole={userRole}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
});

NavMain.displayName = "NavMain";
