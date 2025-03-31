import { BarChart } from 'lucide-react';
import { 
  LucideIcon, 
  Users, 
  Briefcase, 
  Factory, 
  Settings, 
  PieChart, 
  Command, 
  Map, 
  LineChart, 
  UserCog, 
  KeyRound, 
  FileText, 
  Building,
  AudioWaveform,
  GalleryVerticalEnd,
  Group,
  Layers,
  LayoutDashboard
} from "lucide-react"

// Team data interface
export interface Team {
  label: string;
  value: string;
  icon?: LucideIcon;
}

// Navigation item interface with support for nested sub-items
export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavItem[];
}

// Project interface
export interface Project {
  name: string;
  url: string;
  icon: LucideIcon;
  items?: Project[];
}

// Export sidebar data
export const sidebarData = {
  teams: [
    {
      label: "Acme Inc",
      value: "acme-inc",
      icon: GalleryVerticalEnd,
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
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Users Management",
      url: "/admin/users",
      icon: Users,
      items: [
        {
          title: "All Users",
          url: "/admin/users/all",
        },
        {
          title: "User Groups",
          url: "/admin/users/groups",
        },
        {
          title: "User Roles",
          url: "/admin/users/roles",
        },
      ],
    },
    {
      title: "Handbags",
      url: "/admin/handbags",
      icon: Briefcase,
      items: [
        {
          title: "All Handbags",
          url: "/admin/handbags/all",
        },
        {
          title: "Bag Colors",
          url: "/admin/handbags/bag-colors",
        },
        {
          title: "Bag Processes",
          url: "/admin/handbags/bag-processes",
        },
        {
          title: "Bag Groups",
          url: "/admin/handbags/bag-groups",
        },
        {
          title: "Bag Group Rates",
          url: "/admin/handbags/bag-group-rates",
        },
            {
              title: 'Túi xách & Nhóm',
              url: '/admin/handbags/bag-group-rates/hand-bags',
            },
            {
              title: 'Danh sách năng suất',
              url: '/admin/handbags/bag-group-rates',
            },
        {
          title: "Bag Group Rates Stats",
          url: "/admin/handbags/bag-group-rates/stats",
        },
        {
          title: "Bag Group Rates History",
          url: "/admin/handbags/bag-group-rates/history",
        },
        {
          title: "Bag Group Rates Details",
          url: "/admin/handbags/bag-group-rates/details",
        },
        {
          title: "Models",
          url: "/admin/handbags/models",
        },
        {
          title: "Materials",
          url: "/admin/handbags/materials",
        },
      ],
    },
    {
      title: "Factories",
      url: "/admin/factories",
      icon: Factory,
      items: [
        {
          title: "Factory 1",
          url: "/admin/factories/factory-1",
          items: [
            {
              title: "Line 1",
              url: "/admin/factories/factory-1/line-1",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-1/line-1/teams",
                  items: [
                    {
                      title: "Group A",
                      url: "/admin/factories/factory-1/line-1/teams/group-a",
                    },
                    {
                      title: "Group B",
                      url: "/admin/factories/factory-1/line-1/teams/group-b",
                    },
                  ],
                },
              ],
            },
            {
              title: "Line 2",
              url: "/admin/factories/factory-1/line-2",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-1/line-2/teams",
                  items: [
                    {
                      title: "Group A",
                      url: "/admin/factories/factory-1/line-2/teams/group-a",
                    },
                    {
                      title: "Group B",
                      url: "/admin/factories/factory-1/line-2/teams/group-b",
                    },
                  ],
                },
              ],
            },
            {
              title: "Line 3",
              url: "/admin/factories/factory-1/line-3",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-1/line-3/teams",
                },
              ],
            },
            {
              title: "Line 4",
              url: "/admin/factories/factory-1/line-4",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-1/line-4/teams",
                },
              ],
            },
          ],
        },
        {
          title: "Factory 2",
          url: "/admin/factories/factory-2",
          items: [
            {
              title: "Line 1",
              url: "/admin/factories/factory-2/line-1",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-2/line-1/teams",
                },
              ],
            },
            {
              title: "Line 2",
              url: "/admin/factories/factory-2/line-2",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-2/line-2/teams",
                },
              ],
            },
            {
              title: "Line 3",
              url: "/admin/factories/factory-2/line-3",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-2/line-3/teams",
                },
              ],
            },
            {
              title: "Line 4",
              url: "/admin/factories/factory-2/line-4",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-2/line-4/teams",
                },
              ],
            },
          ],
        },
        {
          title: "Factory 3",
          url: "/admin/factories/factory-3",
          items: [
            {
              title: "Line 1",
              url: "/admin/factories/factory-3/line-1",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-3/line-1/teams",
                },
              ],
            },
            {
              title: "Line 2",
              url: "/admin/factories/factory-3/line-2",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-3/line-2/teams",
                },
              ],
            },
            {
              title: "Line 3",
              url: "/admin/factories/factory-3/line-3",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-3/line-3/teams",
                },
              ],
            },
            {
              title: "Line 4",
              url: "/admin/factories/factory-3/line-4",
              items: [
                {
                  title: "Teams",
                  url: "/admin/factories/factory-3/line-4/teams",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "/admin/settings/general",
        },
        {
          title: "Permissions",
          url: "/admin/settings/permissions",
        },
        {
          title: "Profile",
          url: "/admin/settings/profile",
        },
        {
          title: "Change Password",
          url: "/admin/settings/change-password",
        },
        {
          title: "System Config",
          url: "/admin/settings/system-config",
        },
      ],
    },
  ] as NavItem[],
  
  projects: [
    {
      name: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      url: "/admin/users",
      icon: Users,
      items: [
        {
          name: "All Users",
          url: "/admin/users/all",
          icon: Users
        },
        {
          name: "User Roles",
          url: "/admin/users/roles",
          icon: UserCog
        }
      ]
    },
    {
      name: "Handbags",
      url: "/admin/handbags",
      icon: Briefcase,
      items: [
        {
          name: "All Handbags",
          url: "/admin/handbags/all",
          icon: Briefcase
        },
        {
          name: "Colors",
          url: "/admin/handbags/bag-colors",
          icon: PieChart
        },
        {
          name: "Processes",
          url: "/admin/handbags/bag-processes",
          icon: Command
        }
      ]
    },
    {
      name: "Factories",
      url: "/admin/factories",
      icon: Factory,
      items: [
        {
          name: "Factory 1",
          url: "/admin/factories/factory-1",
          icon: Building,
          items: [
            {
              name: "Lines",
              url: "/admin/factories/factory-1/lines",
              icon: LineChart
            },
            {
              name: "Teams",
              url: "/admin/factories/factory-1/teams",
              icon: Group
            }
          ]
        },
        {
          name: "Factory 2",
          url: "/admin/factories/factory-2",
          icon: Building
        },
        {
          name: "Factory 3",
          url: "/admin/factories/factory-3",
          icon: Building
        }
      ]
    },
    {
      name: "Settings",
      url: "/admin/settings",
      icon: Settings,
      items: [
        {
          name: "General",
          url: "/admin/settings/general",
          icon: Settings
        },
        {
          name: "Permissions",
          url: "/admin/settings/permissions",
          icon: KeyRound
        },
        {
          name: "Profile",
          url: "/admin/settings/profile",
          icon: UserCog
        }
      ]
    }
  ] as Project[],
}