"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
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
import { useSidebarCollapsed, useSidebarIsMobileView } from "../../SidebarStateProvider"
import Link from "next/link"

// Sử dụng React.memo với kiểm tra so sánh sâu để tránh re-render không cần thiết
const SubItem = React.memo(({ title, url }: { title: string, url: string }) => {
    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild>
                <Link href={url}>
                    <span>{title}</span>
                </Link>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    );
});

SubItem.displayName = "SubItem";

// Popover item component
const PopoverNavItem = React.memo(({ item }: {
    item: {
        title: string;
        url: string;
        icon?: LucideIcon;
        items?: {
            title: string;
            url: string;
        }[];
    }
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
                            {item.items?.map((subItem) => (
                                <Link
                                    key={subItem.title}
                                    href={subItem.url}
                                    className="flex items-center px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    {subItem.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </SidebarMenuItem>
    );
});

PopoverNavItem.displayName = "PopoverNavItem";

// Collapsible item component
const CollapsibleNavItem = React.memo(({ item }: {
    item: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }
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
                        {item.items?.map((subItem) => (
                            <SubItem
                                key={subItem.title}
                                title={subItem.title}
                                url={subItem.url}
                            />
                        ))}
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
    isIconMode
}: {
    item: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    },
    isIconMode: boolean
}) => {
    return isIconMode
        ? <PopoverNavItem item={item} />
        : <CollapsibleNavItem item={item} />;
});

NavItemRenderer.displayName = "NavItemRenderer";

// Component chính đã tối ưu
export const NavMain = React.memo(({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
        items?: {
            title: string
            url: string
        }[]
    }[]
}) => {
    const pathname = usePathname();
    // Sử dụng context đã tách
    const collapsed = useSidebarCollapsed();
    const isMobileView = useSidebarIsMobileView();

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

    return (
        <SidebarGroup>
            <SidebarGroupLabel className={isIconMode ? "hidden" : ""}>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {processedItems.map((item) => (
                    <NavItemRenderer
                        key={item.title}
                        item={item}
                        isIconMode={isIconMode}
                    />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
});

NavMain.displayName = "NavMain";

















// "use client"

// import * as React from "react"
// import { ChevronRight, type LucideIcon } from "lucide-react"
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
//     useSidebar,
// } from "@/components/ui/sidebar"
// import useMediaQuery from "@/hooks/useMediaQuery"
// import {
//     Popover,
//     PopoverContent,
//     PopoverTrigger
// } from "@/components/ui/popover"
// import { useSidebarState } from "../../SidebarStateProvider"
// import Link from "next/link"

// // Item interface để dùng cho memoization
// interface NavMainItemProps {
//     item: {
//         title: string
//         url: string
//         icon?: LucideIcon
//         isActive?: boolean
//         items?: {
//             title: string
//             url: string
//         }[]
//     }
//     isIconMode: boolean
// }

// // Tách logic của từng item thành component riêng để tối ưu render
// const NavMainItem = React.memo(({ item, isIconMode }: NavMainItemProps) => {
//     if (isIconMode) {
//         // Chế độ icon - Sử dụng Popover
//         return (
//             <SidebarMenuItem>
//                 <Popover>
//                     <PopoverTrigger asChild>
//                         <SidebarMenuButton tooltip={item.title}>
//                             {item.icon && <item.icon />}
//                             <span className="sr-only">{item.title}</span>
//                         </SidebarMenuButton>
//                     </PopoverTrigger>
//                     <PopoverContent
//                         side="right"
//                         align="start"
//                         alignOffset={-8}
//                         className="p-0 w-56"
//                     >
//                         <div className="py-1">
//                             <div className="px-2 py-1.5 text-sm font-semibold">
//                                 {item.title}
//                             </div>
//                             <div className="mt-1">
//                                 {item.items?.map((subItem) => (
//                                     <a
//                                         key={subItem.title}
//                                         href={subItem.url}
//                                         className="flex items-center px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
//                                     >
//                                         {subItem.title}
//                                     </a>
//                                 ))}
//                             </div>
//                         </div>
//                     </PopoverContent>
//                 </Popover>
//             </SidebarMenuItem>
//         );
//     }

//     // Chế độ thường - Sử dụng Collapsible
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
//                         {item.items?.map((subItem) => (
//                             <SidebarMenuSubItem key={subItem.title}>
//                                 <SidebarMenuSubButton asChild>
//                                     <Link href={subItem.url}>
//                                         <span>{subItem.title}</span>
//                                     </Link>
//                                 </SidebarMenuSubButton>
//                             </SidebarMenuSubItem>
//                         ))}
//                     </SidebarMenuSub>
//                 </CollapsibleContent>
//             </SidebarMenuItem>
//         </Collapsible>
//     );
// },
//     (prevProps: NavMainItemProps, nextProps: NavMainItemProps) => {
//         return (
//             prevProps.isIconMode === nextProps.isIconMode &&
//             prevProps.item.title === nextProps.item.title &&
//             prevProps.item.url === nextProps.item.url &&
//             prevProps.item.isActive === nextProps.item.isActive
//         );
//     }
// );

// NavMainItem.displayName = "NavMainItem";

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
//     // Sử dụng context mới
//     const { collapsed } = useSidebarState();
//     const isMobileScreen = useMediaQuery("(max-width: 768px)");

//     // Xác định chế độ icon - tính toán một lần duy nhất khi dependencies thay đổi
//     const isIconMode = React.useMemo(() => {
//         return !isMobileScreen && collapsed;
//     }, [isMobileScreen, collapsed])

//     const processedItems = React.useMemo(() => {
//         return items.map(item => ({
//             ...item,
//             isActive: item.isActive ||
//                 (pathname && pathname.startsWith(item.url) && item.url !== '#') ||
//                 item.items?.some(subItem => pathname && pathname.startsWith(subItem.url))
//         }));
//     }, [items, pathname]);;

//     return (
//         <SidebarGroup>
//             {/* Có thể ẩn label khi ở chế độ icon */}
//             <SidebarGroupLabel className={isIconMode ? "hidden" : ""}>Platform</SidebarGroupLabel>
//             <SidebarMenu>
//                 {processedItems.map((item) => (
//                     <NavMainItem
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