"use client";

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  ChevronRight,
  type LucideIcon,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";


import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuthManager } from "@/hooks/auth/useAuthManager";
import { hasRouteAccess, UserRole } from "@/utils/permission-utils";

import { useSidebarCollapsed, useSidebarIsMobileView } from "../../SidebarStateProvider";

import { Project } from './sidebar-data';

interface ProjectItem {
  name: string;
  url: string;
  icon: LucideIcon;
  items?: ProjectItem[];
}

const ProjectSubItem = React.memo(
  ({ item, level = 0, hasAccess = true }: { item: ProjectItem; level?: number; hasAccess: boolean }) => {
    const pathname = usePathname();
    const isActive = pathname === item.url;

    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild={hasAccess}
          className={`
            ${!hasAccess ? "opacity-50 cursor-not-allowed" : ""}
            ${isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500" : "hover:bg-slate-50 dark:hover:bg-slate-800"}
            transition-all duration-200 rounded-lg mx-1
          `}
          style={{ paddingLeft: `${level * 0.75 + 1}rem` }}
        >
          {hasAccess ? (
            <Link href={item.url} className="flex items-center w-full">
              <item.icon size={16} className="mr-2 flex-shrink-0" />
              <span className={isActive ? "font-medium" : ""}>{item.name}</span>
            </Link>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center w-full">
                    <item.icon size={16} className="mr-2 flex-shrink-0 opacity-50" />
                    <span>{item.name}</span>
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
  },
);

ProjectSubItem.displayName = 'ProjectSubItem';

const ProjectMenuItemPopover = React.memo(
  ({ item, userRole }: { item: ProjectItem; userRole?: UserRole }) => {
    const pathname = usePathname();
    const isActive = pathname?.startsWith(item.url);
    const hasChildren = item.items && item.items.length > 0;

    return (
      <SidebarMenuItem>
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton 
              tooltip={item.name}
              className={`
                ${isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"}
                transition-colors duration-200
              `}
            >
              <item.icon className="flex-shrink-0" />
              <span className="sr-only">{item.name}</span>
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
                {item.name}
              </div>
              {hasChildren ? (
                <div className="py-1">
                  {item.items?.map(subItem => {
                    const itemHasAccess = userRole ? hasRouteAccess(subItem.url, userRole) : false;
                    return (
                      <div key={subItem.url} className="px-2">
                        {itemHasAccess ? (
                          <Link
                            href={subItem.url}
                            className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors duration-200"
                          >
                            <subItem.icon size={16} className="mr-2" />
                            {subItem.name}
                          </Link>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-between items-center px-3 py-2 text-sm opacity-50 cursor-not-allowed text-slate-500">
                                  <div className="flex items-center">
                                    <subItem.icon size={16} className="mr-2" />
                                    {subItem.name}
                                  </div>
                                  <Shield size={14} />
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
              ) : (
                <div className="px-2 py-1">
                  <Link
                    href={item.url}
                    className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors duration-200"
                  >
                    <item.icon size={16} className="mr-2" />
                    Xem {item.name}
                  </Link>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    );
  },
);

ProjectMenuItemPopover.displayName = 'ProjectMenuItemPopover';

const ProjectMenuItem = React.memo(
  ({ item, level = 0, isMobile, userRole }: { item: ProjectItem; level?: number; isMobile: boolean; userRole?: UserRole }) => {
    const pathname = usePathname();
    const isActive = pathname?.startsWith(item.url);
    const hasChildren = item.items && item.items.length > 0;
    const Icon = item.icon;
    const hasAccess = userRole ? hasRouteAccess(item.url, userRole) : false;

    if (hasChildren) {
      return (
        <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton 
                className={`
                  ${isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "hover:bg-slate-50 dark:hover:bg-slate-800"}
                  transition-all duration-200 rounded-lg group
                `}
                tooltip={item.name} 
                style={{ paddingLeft: `${level * 0.75 + 1}rem` }}
              >
                <Icon className={`
                  flex-shrink-0 
                  ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"}
                  transition-colors duration-200
                `} />
                <span className={isActive ? "font-medium" : ""}>{item.name}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-slate-400" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="transition-all duration-200">
              <SidebarMenuSub className="ml-4 border-l border-slate-200 dark:border-slate-700 pl-2">
                {item.items?.map(subItem => {
                  const subItemHasAccess = userRole ? hasRouteAccess(subItem.url, userRole) : false;
                  return (
                    <ProjectSubItem
                      key={subItem.url}
                      item={subItem}
                      level={level + 1}
                      hasAccess={subItemHasAccess}
                    />
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild={hasAccess}
          className={`
            ${!hasAccess ? "opacity-50 cursor-not-allowed" : ""}
            ${isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500" : "hover:bg-slate-50 dark:hover:bg-slate-800"}
            transition-all duration-200 rounded-lg
          `}
          style={{ paddingLeft: `${level * 0.75 + 1}rem` }}
        >
          {hasAccess ? (
            <Link href={item.url} className="flex items-center w-full">
              <Icon className="flex-shrink-0" />
              <span className={isActive ? "font-medium" : ""}>{item.name}</span>
            </Link>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center w-full">
                    <Icon className="flex-shrink-0 opacity-50" />
                    <span>{item.name}</span>
                    <Shield size={14} className="ml-auto text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bạn không có quyền truy cập vào tính năng này</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </SidebarMenuButton>
        
        {hasAccess && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover className="opacity-60 hover:opacity-100 transition-opacity">
                <MoreHorizontal size={16} />
                <span className="sr-only">More</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 rounded-lg shadow-lg"
              side={isMobile ? 'bottom' : 'right'}
              align={isMobile ? 'end' : 'start'}
            >
              <DropdownMenuItem className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <Folder className="text-muted-foreground" size={16} />
                <span>Xem {item.name}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-slate-50 dark:hover:bg-slate-800">
                <Forward className="text-muted-foreground" size={16} />
                <span>Chia sẻ {item.name}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">
                <Trash2 className="text-red-500" size={16} />
                <span>Xóa {item.name}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarMenuItem>
    );
  },
);

ProjectMenuItem.displayName = 'ProjectMenuItem';

export function NavProjects({ projects }: { projects: Project[] }) {
  const isMobile = useSidebarIsMobileView();
  const collapsed = useSidebarCollapsed();
  const { user } = useAuthManager();
  const userRole = user?.role as UserRole | undefined;
  
  const isIconMode = !isMobile && collapsed;

  const projectItems = React.useMemo(
    () => projects.map(item => 
      isIconMode ? (
        <ProjectMenuItemPopover 
          key={item.name} 
          item={item} 
          userRole={userRole}
        />
      ) : (
        <ProjectMenuItem 
          key={item.name} 
          item={item} 
          isMobile={isMobile} 
          userRole={userRole}
        />
      )
    ),
    [projects, isMobile, isIconMode, userRole],
  );

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className={isIconMode ? 'hidden' : ''}>
      <SidebarGroupLabel className="text-slate-500 dark:text-slate-400 font-medium px-2 py-1">
        Dự án
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1">{projectItems}</SidebarMenu>
    </SidebarGroup>
  );
};

NavProjects.displayName = 'NavProjects';
