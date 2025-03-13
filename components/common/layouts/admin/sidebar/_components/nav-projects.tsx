"use client"

import * as React from "react"
import {
    Folder,
    Forward,
    MoreHorizontal,
    Trash2,
    type LucideIcon,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

// Tối ưu hóa các menu item bằng cách tách thành component riêng
const ProjectMenuItem = React.memo(({
    item,
    isMobile
}: {
    item: { name: string; url: string; icon: LucideIcon };
    isMobile: boolean;
}) => {
    const Icon = item.icon;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild>
                <Link href={item.url}>
                    <Icon />
                    <span>{item.name}</span>
                </Link>
            </SidebarMenuButton>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                    </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                >
                    <DropdownMenuItem>
                        <Folder className="text-muted-foreground" />
                        <span>View Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Forward className="text-muted-foreground" />
                        <span>Share Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Trash2 className="text-muted-foreground" />
                        <span>Delete Project</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    );
});

ProjectMenuItem.displayName = "ProjectMenuItem";

// Component "More" riêng biệt
const MoreProjectsButton = React.memo(() => (
    <SidebarMenuItem>
        <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
        </SidebarMenuButton>
    </SidebarMenuItem>
));

MoreProjectsButton.displayName = "MoreProjectsButton";

// Tối ưu NavProjects component với React.memo
export const NavProjects = React.memo(({
    projects,
}: {
    projects: {
        name: string
        url: string
        icon: LucideIcon
    }[]
}) => {
    const { isMobile } = useSidebar();

    // Memoize projects list để tránh re-render
    const projectItems = React.useMemo(() =>
        projects.map(item => (
            <ProjectMenuItem
                key={item.name}
                item={item}
                isMobile={isMobile}
            />
        )),
        [projects, isMobile]
    );

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
                {projectItems}
                <MoreProjectsButton />
            </SidebarMenu>
        </SidebarGroup>
    );
});

NavProjects.displayName = "NavProjects";