"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

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
    useSidebar,
} from "@/components/ui/sidebar"
import { useSidebarState } from "../../AdminLayout"
import useMediaQuery from "@/hooks/useMediaQuery"
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover"

export function NavMain({
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
}) {
    // Thêm hook lấy trạng thái sidebar
    const { collapsed } = useSidebarState();
    const isMobileScreen = useMediaQuery("(max-width: 768px)");
    const { isMobile } = useSidebar();

    // Xác định xem có đang ở chế độ icon hay không
    const isIconMode = !isMobileScreen && collapsed;

    return (
        <SidebarGroup>
            {/* Có thể ẩn label khi ở chế độ icon */}
            <SidebarGroupLabel className={isIconMode ? "hidden" : ""}>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    isIconMode ? (
                        // Chế độ icon - Sử dụng Popover thay vì Collapsible
                        <SidebarMenuItem key={item.title}>
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
                                                <a
                                                    key={subItem.title}
                                                    href={subItem.url}
                                                    className="flex items-center px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                                                >
                                                    {subItem.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </SidebarMenuItem>
                    ) : (
                        // Chế độ thường - Tiếp tục sử dụng Collapsible
                        <Collapsible
                            key={item.title}
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
                                            <SidebarMenuSubItem key={subItem.title}>
                                                <SidebarMenuSubButton asChild>
                                                    <a href={subItem.url}>
                                                        <span>{subItem.title}</span>
                                                    </a>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    )
                ))}
            </SidebarMenu>
        </SidebarGroup>
    )
}