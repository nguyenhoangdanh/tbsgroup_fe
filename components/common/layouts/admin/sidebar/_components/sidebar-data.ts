import { 
  LucideIcon, 
  Users, 
  Briefcase, 
  Factory, 
  Settings, 
  PieChart, 
  Command, 
  LineChart, 
  UserCog, 
  KeyRound, 
  Building,
  Group,
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
  navMain: [
    {
      title: "Bảng điều khiển",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Quản lý người dùng",
      url: "/admin/users",
      icon: Users,
      items: [
        {
          title: "Tất cả người dùng",
          url: "/admin/users/all",
        },
        {
          title: "Nhóm người dùng",
          url: "/admin/users/groups",
        },
        {
          title: "Vai trò người dùng",
          url: "/admin/users/roles",
        },
      ],
    },
    {
      title: "Túi xách",
      url: "/admin/handbags",
      icon: Briefcase,
      items: [
        {
          title: "Tất cả túi xách",
          url: "/admin/handbags/all",
        },
        {
          title: "Màu túi",
          url: "/admin/handbags/bag-colors",
        },
        {
          title: "Quy trình sản xuất",
          url: "/admin/handbags/bag-processes",
        },
        {
          title: "Nhóm túi",
          url: "/admin/handbags/bag-group-rates",
        },
        {
          title: "Tỷ lệ năng suất nhóm",
          url: "/admin/handbags/bag-group-rates",
        },
        {
          title: "Thống kê năng suất",
          url: "/admin/handbags/bag-group-rates/stats",
        },
        {
          title: "Lịch sử năng suất",
          url: "/admin/handbags/bag-group-rates/history",
        },
        {
          title: "Chi tiết năng suất",
          url: "/admin/handbags/bag-group-rates/details",
        },
        {
          title: "Mẫu túi",
          url: "/admin/handbags/models",
        },
        {
          title: "Nguyên liệu",
          url: "/admin/handbags/materials",
        },
      ],
    },
    {
      title: "Nhà máy",
      url: "/admin/factories",
      icon: Factory,
      items: [
        {
          title: "Danh sách nhà máy",
          url: "/admin/factories",
        }
      ],
    },
    {
      title: "Cài đặt",
      url: "/admin/settings",
      icon: Settings,
      items: [
        {
          title: "Chung",
          url: "/admin/settings/general",
        },
        {
          title: "Phân quyền",
          url: "/admin/settings/permissions",
        },
        {
          title: "Hồ sơ cá nhân",
          url: "/admin/settings/profile",
        },
        {
          title: "Đổi mật khẩu",
          url: "/admin/settings/change-password",
        },
        {
          title: "Cấu hình hệ thống",
          url: "/admin/settings/system-config",
        },
      ],
    },
  ] as NavItem[],
  
  projects: [
    {
      name: "Bảng điều khiển",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Người dùng",
      url: "/admin/users",
      icon: Users,
      items: [
        {
          name: "Tất cả người dùng",
          url: "/admin/users/all",
          icon: Users
        },
        {
          name: "Vai trò người dùng",
          url: "/admin/users/roles",
          icon: UserCog
        }
      ]
    },
    {
      name: "Túi xách",
      url: "/admin/handbags",
      icon: Briefcase,
      items: [
        {
          name: "Tất cả túi xách",
          url: "/admin/handbags/all",
          icon: Briefcase
        },
        {
          name: "Màu túi",
          url: "/admin/handbags/bag-colors",
          icon: PieChart
        },
        {
          name: "Quy trình sản xuất",
          url: "/admin/handbags/bag-processes",
          icon: Command
        }
      ]
    },
    {
      name: "Nhà máy",
      url: "/admin/factories",
      icon: Factory,
      items: [
        {
          name: "Danh sách nhà máy",
          url: "/admin/factories",
          icon: Building
        }
      ]
    },
    {
      name: "Cài đặt",
      url: "/admin/settings",
      icon: Settings,
      items: [
        {
          name: "Chung",
          url: "/admin/settings/general",
          icon: Settings
        },
        {
          name: "Phân quyền",
          url: "/admin/settings/permissions",
          icon: KeyRound
        },
        {
          name: "Hồ sơ cá nhân",
          url: "/admin/settings/profile",
          icon: UserCog
        }
      ]
    }
  ] as Project[],
}