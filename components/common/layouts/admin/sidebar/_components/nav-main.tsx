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
import useAuthManager from "@/hooks/useAuthManager"
import { hasRouteAccess } from "@/utils/permission-utils";

// Define the interface for SubItem props
interface SubItemProps {
    title: string;
    url: string;
    hasAccess?: boolean;
}

// Sử dụng React.memo với kiểm tra so sánh sâu để tránh re-render không cần thiết
const SubItem = React.memo(({
    title,
    url,
    hasAccess = true
}: SubItemProps) => {
    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton
                asChild={hasAccess}
                className={!hasAccess ? "opacity-50 cursor-not-allowed" : ""}
            >
                {hasAccess ? (
                    <Link href={url}>
                        <span>{title}</span>
                    </Link>
                ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center">
                                    <span>{title}</span>
                                    <Shield size={14} className="ml-2 text-muted-foreground" />
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

// Define the interfaces for consistent type usage
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

// Popover item component
const PopoverNavItem = React.memo(({ item, userRole }: {
    item: NavItemType,
    userRole?: string
}) => {
    return (
        <SidebarMenuItem>
            <Popover>
                <PopoverTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span className="sr-only">{item.title}</span>
                    </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent
                    side="right"
                    align="start"
                    alignOffset={-8}
                    className="p-0 w-56"
                >
                    <div className="py-1">
                        <div className="px-2 py-1.5 text-sm font-semibold">
                            {item.title}
                        </div>
                        <div className="mt-1">
                            {item.items?.map((subItem: NavSubItemType) => {
                                const itemHasAccess = hasRouteAccess(subItem.url, userRole || '');
                                return (
                                    <div key={subItem.title} className="flex items-center px-3 py-1.5 text-sm">
                                        {itemHasAccess ? (
                                            <Link
                                                href={subItem.url}
                                                className="w-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                            >
                                                {subItem.title}
                                            </Link>
                                        ) : (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="w-full flex justify-between items-center opacity-50 cursor-not-allowed">
                                                            {subItem.title}
                                                            <Shield size={14} className="ml-2 text-muted-foreground" />
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

// Collapsible item component
const CollapsibleNavItem = React.memo(({ item, userRole }: {
    item: NavItemType,
    userRole?: string
}) => {
    return (
        <Collapsible
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                            const itemHasAccess = hasRouteAccess(subItem.url, userRole || '');
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

// Component để tối ưu render dựa trên trạng thái isIconMode
const NavItemRenderer = React.memo(({
    item,
    isIconMode,
    userRole
}: {
    item: NavItemType,
    isIconMode: boolean,
    userRole?: string
}) => {
    return isIconMode
        ? <PopoverNavItem item={item} userRole={userRole} />
        : <CollapsibleNavItem item={item} userRole={userRole} />;
});

NavItemRenderer.displayName = "NavItemRenderer";

// Component chính đã tối ưu
export const NavMain = React.memo(({
    items,
}: {
    items: NavItemType[]
}) => {
    const pathname = usePathname();
    // Sử dụng context đã tách
    const collapsed = useSidebarCollapsed();
    const isMobileView = useSidebarIsMobileView();
    // Get user role from auth manager
    const { user } = useAuthManager();
    const userRole = user?.role;

    // Xác định chế độ icon - tính toán một lần duy nhất khi dependencies thay đổi
    const isIconMode = React.useMemo(() => {
        return !isMobileView && collapsed;
    }, [isMobileView, collapsed]);

    // Chỉ xử lý lại items khi pathname thay đổi, không liên quan đến sidebar
    const processedItems = React.useMemo(() => {
        return items.map(item => ({
            ...item,
            isActive: item.isActive ||
                (pathname && pathname.startsWith(item.url) && item.url !== '#') ||
                item.items?.some(subItem => pathname && pathname.startsWith(subItem.url))
        }));
    }, [items, pathname]);

    // If no items are passed or user has no permissions, show a message
    if (!processedItems || processedItems.length === 0) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel className={isIconMode ? "hidden" : ""}>Platform</SidebarGroupLabel>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="cursor-default">
                            <AlertCircle size={18} className="text-muted-foreground" />
                            <span>Không có menu hiển thị</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel className={isIconMode ? "hidden" : ""}>Platform</SidebarGroupLabel>
            <SidebarMenu>
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






























// "use client"

// import * as React from "react"
// import { ChevronRight, Shield, type LucideIcon } from "lucide-react"
// import { usePathname } from 'next/navigation';
// import {
//     Collapsible,
//     CollapsibleContent,
//     CollapsibleTrigger,
// } from "@/components/ui/collapsible"
// import {
//     SidebarGroup,
//     SidebarGroupLabel,
//     SidebarMenu,
//     SidebarMenuButton,
//     SidebarMenuItem,
//     SidebarMenuSub,
//     SidebarMenuSubButton,
//     SidebarMenuSubItem,
// } from "@/components/ui/sidebar"
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger
// } from "@/components/ui/popover"
// import { useSidebarCollapsed, useSidebarIsMobileView } from "../../SidebarStateProvider"
// import Link from "next/link"
// import { hasRouteAccess } from "./permission-utils";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// // Sử dụng React.memo với kiểm tra so sánh sâu để tránh re-render không cần thiết
// const SubItem = React.memo(({ title, url }: { title: string, url: string }) => {
//     return (
//         <SidebarMenuSubItem>
//             <SidebarMenuSubButton asChild>
//                 <Link href={url}>
//                     <span>{title}</span>
//                 </Link>
//             </SidebarMenuSubButton>
//         </SidebarMenuSubItem>
//     );
// });

// SubItem.displayName = "SubItem";

// // Popover item component
// const PopoverNavItem = React.memo(({ item, userRole }: {
//     item: {
//         title: string;
//         url: string;
//         icon?: LucideIcon;
//         items?: {
//             title: string;
//             url: string;
//         }[];
//     },
//     userRole?: string
// }) => {
//     return (
//         <SidebarMenuItem>
//             <Popover>
//                 <PopoverTrigger asChild>
//                     <SidebarMenuButton tooltip={item.title}>
//                         {item.icon && <item.icon />}
//                         <span className="sr-only">{item.title}</span>
//                     </SidebarMenuButton>
//                 </PopoverTrigger>
//                 <PopoverContent
//                     side="right"
//                     align="start"
//                     alignOffset={-8}
//                     className="p-0 w-56"
//                 >
//                     <div className="py-1">
//                         <div className="px-2 py-1.5 text-sm font-semibold">
//                             {item.title}
//                         </div>
//                         <div className="mt-1">
//                             {/* {item.items?.map((subItem) => (
//                                 <Link
//                                     key={subItem.title}
//                                     href={subItem.url}
//                                     className="flex items-center px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
//                                 >
//                                     {subItem.title}
//                                 </Link>
//                             ))} */}
//                             {item.items?.map((subItem) => {
//                                 const itemHasAccess = hasRouteAccess(subItem.url, userRole || '');
//                                 return (
//                                     <div key={subItem.title} className="flex items-center px-3 py-1.5 text-sm">
//                                         {itemHasAccess ? (
//                                             <Link
//                                                 href={subItem.url}
//                                                 className="w-full hover:bg-slate-100 dark:hover:bg-slate-800"
//                                             >
//                                                 {subItem.title}
//                                             </Link>
//                                         ) : (
//                                             <TooltipProvider>
//                                                 <Tooltip>
//                                                     <TooltipTrigger asChild>
//                                                         <div className="w-full flex justify-between items-center opacity-50 cursor-not-allowed">
//                                                             {subItem.title}
//                                                             <Shield size={14} className="ml-2 text-muted-foreground" />
//                                                         </div>
//                                                     </TooltipTrigger>
//                                                     <TooltipContent>
//                                                         <p>Bạn không có quyền truy cập vào tính năng này</p>
//                                                     </TooltipContent>
//                                                 </Tooltip>
//                                             </TooltipProvider>
//                                         )}
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                 </PopoverContent>
//             </Popover>
//         </SidebarMenuItem>
//     );
// });

// PopoverNavItem.displayName = "PopoverNavItem";

// // Collapsible item component
// const CollapsibleNavItem = React.memo(({ item, userRole }: {
//     item: {
//         title: string;
//         url: string;
//         icon?: LucideIcon;
//         isActive?: boolean;
//         items?: {
//             title: string;
//             url: string;
//         }[];
//     },
//     userRole?: string
// }) => {
//     return (
//         <Collapsible
//             asChild
//             defaultOpen={item.isActive}
//             className="group/collapsible"
//         >
//             <SidebarMenuItem>
//                 <CollapsibleTrigger asChild>
//                     <SidebarMenuButton tooltip={item.title}>
//                         {item.icon && <item.icon />}
//                         <span>{item.title}</span>
//                         <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
//                     </SidebarMenuButton>
//                 </CollapsibleTrigger>
//                 <CollapsibleContent>
//                     <SidebarMenuSub>
//                         {item.items?.map((subItem) => {
//                             const itemHasAccess = hasRouteAccess(subItem.url, userRole || '');
//                             return (
//                                 <SubItem
//                                     key={subItem.title}
//                                     title={subItem.title}
//                                     url={subItem.url}
//                                     hasAccess={itemHasAccess}
//                                 />
//                             );
//                         })}
//                     </SidebarMenuSub>
//                 </CollapsibleContent>
//             </SidebarMenuItem>
//         </Collapsible>
//     );
// });

// CollapsibleNavItem.displayName = "CollapsibleNavItem";

// // Component để tối ưu render dựa trên trạng thái isIconMode
// const NavItemRenderer = React.memo(({
//     item,
//     isIconMode
// }: {
//     item: {
//         title: string;
//         url: string;
//         icon?: LucideIcon;
//         isActive?: boolean;
//         items?: {
//             title: string;
//             url: string;
//         }[];
//     },
//     isIconMode: boolean
// }) => {
//     return isIconMode
//         ? <PopoverNavItem item={item} />
//         : <CollapsibleNavItem item={item} />;
// });

// NavItemRenderer.displayName = "NavItemRenderer";

// // Component chính đã tối ưu
// export const NavMain = React.memo(({
//     items,
// }: {
//     items: {
//         title: string
//         url: string
//         icon?: LucideIcon
//         isActive?: boolean
//         items?: {
//             title: string
//             url: string
//         }[]
//     }[]
// }) => {
//     const pathname = usePathname();
//     // Sử dụng context đã tách
//     const collapsed = useSidebarCollapsed();
//     const isMobileView = useSidebarIsMobileView();

//     // Xác định chế độ icon - tính toán một lần duy nhất khi dependencies thay đổi
//     const isIconMode = React.useMemo(() => {
//         return !isMobileView && collapsed;
//     }, [isMobileView, collapsed]);

//     // Chỉ xử lý lại items khi pathname thay đổi, không liên quan đến sidebar
//     const processedItems = React.useMemo(() => {
//         return items.map(item => ({
//             ...item,
//             isActive: item.isActive ||
//                 (pathname && pathname.startsWith(item.url) && item.url !== '#') ||
//                 item.items?.some(subItem => pathname && pathname.startsWith(subItem.url))
//         }));
//     }, [items, pathname]);

//     return (
//         <SidebarGroup>
//             <SidebarGroupLabel className={isIconMode ? "hidden" : ""}>Platform</SidebarGroupLabel>
//             <SidebarMenu>
//                 {processedItems.map((item) => (
//                     <NavItemRenderer
//                         key={item.title}
//                         item={item}
//                         isIconMode={isIconMode}
//                     />
//                 ))}
//             </SidebarMenu>
//         </SidebarGroup>
//     );
// });

// NavMain.displayName = "NavMain";
