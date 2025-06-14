import {
  LucideIcon,
  Users,
  Briefcase,
  Factory,
  Settings,
  PieChart,
  Command,
  UserCog,
  KeyRound,
  Building,
  LayoutDashboard,
  Shield,
  FileText,
  BarChart3,
  GitBranch,
  Group,
  Building2,
  UsersIcon,
  Network,
  Layers,
} from 'lucide-react';

export interface Team {
  label: string;
  value: string;
  icon?: LucideIcon;
}

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavItem[];
}

export interface Project {
  name: string;
  url: string;
  icon: LucideIcon;
  items?: Project[];
}

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const;

export const getSidebarState = (windowWidth: number) => {
  if (windowWidth < BREAKPOINTS.mobile) {
    return {
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      defaultCollapsed: true,
      useOverlay: true,
    };
  } else if (windowWidth < BREAKPOINTS.tablet) {
    return {
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      defaultCollapsed: true,
      useOverlay: false,
    };
  } else {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      defaultCollapsed: false,
      useOverlay: false,
    };
  }
};

export const sidebarData = {
  teams: [
    {
      label: 'Daily Performance',
      value: 'daily-performance',
      icon: Briefcase,
    },
    {
      label: 'Development Team',
      value: 'development',
      icon: Command,
    },
    {
      label: 'Management',
      value: 'management',
      icon: UserCog,
    },
  ] as Team[],

  navMain: [
    {
      title: 'Bảng điều khiển',
      url: '/admin/dashboard',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: 'Quản lý người dùng',
      url: '/admin/users',
      icon: Users,
      items: [
        {
          title: 'Tất cả người dùng',
          url: '/admin/users/all',
        },
        {
          title: 'Vai trò người dùng',
          url: '/admin/users/roles',
        },
      ],
    },
    {
      title: 'Cơ cấu tổ chức',
      url: '/admin/organization',
      icon: Network,
      items: [
        {
          title: 'Phòng ban',
          url: '/admin/departments',
        },
        {
          title: 'Nhà máy',
          url: '/admin/factories',
        },
        {
          title: 'Dây chuyền',
          url: '/admin/lines',
        },
        {
          title: 'Tổ sản xuất',
          url: '/admin/teams',
        },
        {
          title: 'Nhóm sản xuất',
          url: '/admin/groups',
        },
      ],
    },
    {
      title: 'Túi xách',
      url: '/admin/handbags',
      icon: Briefcase,
      items: [
        {
          title: 'Tất cả túi xách',
          url: '/admin/handbags/all',
        },
        {
          title: 'Màu túi',
          url: '/admin/handbags/bag-colors',
        },
        {
          title: 'Quy trình sản xuất',
          url: '/admin/handbags/bag-processes',
        },
        {
          title: 'Nhóm túi',
          url: '/admin/handbags/bag-group-rates',
        },
        {
          title: 'Tỷ lệ năng suất nhóm',
          url: '/admin/handbags/bag-group-rates',
        },
        {
          title: 'Thống kê năng suất',
          url: '/admin/handbags/bag-group-rates/stats',
        },
        {
          title: 'Lịch sử năng suất',
          url: '/admin/handbags/bag-group-rates/history',
        },
        {
          title: 'Chi tiết năng suất',
          url: '/admin/handbags/bag-group-rates/details',
        },
        {
          title: 'Mẫu túi',
          url: '/admin/handbags/models',
        },
        {
          title: 'Nguyên liệu',
          url: '/admin/handbags/materials',
        },
      ],
    },
    {
      title: 'Báo cáo & Thống kê',
      url: '/admin/reports',
      icon: BarChart3,
      items: [
        {
          title: 'Báo cáo hiệu suất',
          url: '/admin/reports/performance',
        },
        {
          title: 'Báo cáo sản xuất',
          url: '/admin/reports/production',
        },
        {
          title: 'Báo cáo chất lượng',
          url: '/admin/reports/quality',
        },
        {
          title: 'Báo cáo nhân sự',
          url: '/admin/reports/hr',
        },
      ],
    },
    {
      title: 'Phân quyền',
      url: '/admin/permissions',
      icon: Shield,
      items: [
        {
          title: 'Quản lý phân quyền',
          url: '/admin/permissions',
        },
        {
          title: 'Quản lý trang',
          url: '/admin/settings/permissions-management',
        },
        {
          title: 'Gán quyền theo vai trò',
          url: '/admin/settings/role-permissions-assignment',
        },
      ],
    },
    {
      title: 'Cài đặt',
      url: '/admin/settings',
      icon: Settings,
      items: [
        {
          title: 'Cài đặt chung',
          url: '/admin/settings/general',
        },
        {
          title: 'Hồ sơ cá nhân',
          url: '/admin/settings/profile',
        },
        {
          title: 'Đổi mật khẩu',
          url: '/admin/settings/change-password',
        },
        {
          title: 'Cấu hình hệ thống',
          url: '/admin/settings/system-config',
        },
      ],
    },
  ] as NavItem[],

  projects: [
    {
      name: 'Bảng điều khiển',
      url: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Người dùng',
      url: '/admin/users',
      icon: Users,
      items: [
        {
          name: 'Tất cả người dùng',
          url: '/admin/users/all',
          icon: Users,
        },
        {
          name: 'Vai trò người dùng',
          url: '/admin/users/roles',
          icon: UserCog,
        },
      ],
    },
    {
      name: 'Cơ cấu tổ chức',
      url: '/admin/organization',
      icon: Network,
      items: [
        {
          name: 'Phòng ban',
          url: '/admin/departments',
          icon: Building2,
        },
        {
          name: 'Nhà máy',
          url: '/admin/factories',
          icon: Factory,
        },
        {
          name: 'Dây chuyền',
          url: '/admin/lines',
          icon: GitBranch,
        },
        {
          name: 'Tổ sản xuất',
          url: '/admin/teams',
          icon: UsersIcon,
        },
        {
          name: 'Nhóm sản xuất',
          url: '/admin/groups',
          icon: Group,
        },
      ],
    },
    {
      name: 'Túi xách',
      url: '/admin/handbags',
      icon: Briefcase,
      items: [
        {
          name: 'Tất cả túi xách',
          url: '/admin/handbags/all',
          icon: Briefcase,
        },
        {
          name: 'Màu túi',
          url: '/admin/handbags/bag-colors',
          icon: PieChart,
        },
        {
          name: 'Quy trình sản xuất',
          url: '/admin/handbags/bag-processes',
          icon: Command,
        },
        {
          name: 'Nhóm túi',
          url: '/admin/handbags/bag-group-rates',
          icon: Layers,
        },
      ],
    },
    {
      name: 'Báo cáo',
      url: '/admin/reports',
      icon: BarChart3,
      items: [
        {
          name: 'Báo cáo hiệu suất',
          url: '/admin/reports/performance',
          icon: BarChart3,
        },
        {
          name: 'Báo cáo sản xuất',
          url: '/admin/reports/production',
          icon: FileText,
        },
        {
          name: 'Báo cáo chất lượng',
          url: '/admin/reports/quality',
          icon: PieChart,
        },
      ],
    },
    {
      name: 'Phân quyền',
      url: '/admin/permissions',
      icon: Shield,
      items: [
        {
          name: 'Quản lý phân quyền',
          url: '/admin/permissions',
          icon: Shield,
        },
        {
          name: 'Quản lý trang',
          url: '/admin/settings/permissions-management',
          icon: FileText,
        },
      ],
    },
    {
      name: 'Cài đặt',
      url: '/admin/settings',
      icon: Settings,
      items: [
        {
          name: 'Cài đặt chung',
          url: '/admin/settings/general',
          icon: Settings,
        },
        {
          name: 'Hồ sơ cá nhân',
          url: '/admin/settings/profile',
          icon: UserCog,
        },
        {
          name: 'Đổi mật khẩu',
          url: '/admin/settings/change-password',
          icon: KeyRound,
        },
      ],
    },
  ] as Project[],
};
