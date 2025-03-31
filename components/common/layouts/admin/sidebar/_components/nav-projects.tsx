"use client"

import * as React from "react"
import {
    Folder,
    Forward,
    MoreHorizontal,
    Trash2,
    ChevronRight,
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useSidebarCollapsed, useSidebarIsMobileView } from "../../SidebarStateProvider"
import { usePathname } from "next/navigation"
import Link from "next/link"

// Type definition for Project with nested items
interface ProjectItem {
    name: string;
    url: string;
    icon: LucideIcon;
    items?: ProjectItem[];
}

// Component for rendering a project menu item with nested functionality
const ProjectMenuItem = React.memo(({
    item,
    level = 0,
    isMobile
}: {
    item: ProjectItem;
    level?: number;
    isMobile: boolean;
}) => {
    const pathname = usePathname();
    const isActive = pathname?.startsWith(item.url);
    const hasChildren = item.items && item.items.length > 0;
    const Icon = item.icon;

    // If the item has children, render a collapsible section
    if (hasChildren) {
        return (
            <Collapsible
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
            >
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            className={`pl-${level * 2}`}
                            tooltip={item.name}
                        >
                            <Icon className="flex-shrink-0" />
                            <span>{item.name}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {/* Fix: Added a null check and conditional rendering */}
                            {item.items?.map((subItem) => (
                                <ProjectMenuItem
                                    key={subItem.url}
                                    item={subItem}
                                    level={level + 1}
                                    isMobile={isMobile}
                                />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    // If the item has no children, render a standard menu item with link
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                className={`pl-${level * 2} ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
            >
                <Link href={item.url}>
                    <Icon className="flex-shrink-0" />
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
                        <span>View {item.name}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Forward className="text-muted-foreground" />
                        <span>Share {item.name}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Trash2 className="text-muted-foreground" />
                        <span>Delete {item.name}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    );
});

ProjectMenuItem.displayName = "ProjectMenuItem";

// Main NavProjects component
export const NavProjects = React.memo(({
    projects,
}: {
    projects: ProjectItem[]
}) => {
    const isMobile = useSidebarIsMobileView();
    const collapsed = useSidebarCollapsed();
    const isIconMode = !isMobile && collapsed;

    // Memoize projects list to avoid re-render
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
        <SidebarGroup className={isIconMode ? "hidden" : ""}>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
                {projectItems}
            </SidebarMenu>
        </SidebarGroup>
    );
});

NavProjects.displayName = "NavProjects";