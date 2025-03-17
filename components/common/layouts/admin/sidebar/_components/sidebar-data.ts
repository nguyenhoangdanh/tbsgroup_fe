import { LockKeyhole, LucideIcon } from "lucide-react"
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Briefcase,
    Command,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
} from "lucide-react"

// Team data interface (đã sửa để phù hợp với TeamSwitcher)
export interface Team {
    label: string; // Thay thế "name" bằng "label"
    value: string; // Thêm trường "value"
    icon?: LucideIcon; // Thay thế "logo" bằng "icon"
}

// Navigation item interface
export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
        title: string;
        url: string;
    }[];
}

// Project interface
export interface Project {
    name: string;
    url: string;
    icon: LucideIcon;
}

// Export sidebar data
export const sidebarData = {
    teams: [
        {
            label: "Acme Inc", // Thay đổi từ "name" thành "label"
            value: "acme-inc", // Thêm trường "value"
            icon: GalleryVerticalEnd, // Thay đổi từ "logo" thành "icon"
        },
        {
            label: "Acme Corp.",
            value: "acme-corp",
            icon: AudioWaveform,
        },
        {
            label: "Evil Corp.",
            value: "evil-corp",
            icon: Command,
        },
    ] as Team[],
    
    navMain: [
        {
            title: "Handbags",
            url: "#",
            icon: Briefcase,
            isActive: true,
            items: [
                {
                    title: "Stages",
                    url: "/admin/handbag/stages",
                },
                {
                    title: "Starred",
                    url: "#",
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "Models",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Genesis",
                    url: "#",
                },
                {
                    title: "Explorer",
                    url: "#",
                },
                {
                    title: "Quantum",
                    url: "#",
                },
            ],
        },
        {
            title: "Documentation",
            url: "#",
            icon: BookOpen,
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: Settings2,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ] as NavItem[],
    
    projects: [
        {
            name: "User",
            url: "users",
            icon: Briefcase,
        },
        {
            name: "Permissions",
            url: "permissions",
            icon: LockKeyhole,
        },
        // {
        //     name: "Sales & Marketing",
        //     url: "#",
        //     icon: PieChart,
        // },
        // {
        //     name: "Travel",
        //     url: "#",
        //     icon: Map,
        // },
    ] as Project[],
}