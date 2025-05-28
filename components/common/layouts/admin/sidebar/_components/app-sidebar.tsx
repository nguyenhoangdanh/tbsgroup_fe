'use client';

import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { NavMain } from './nav-main';
import { NavProjects } from './nav-projects';
import { NavUser } from './nav-user';
import { TeamSwitcher } from './team-switcher';
import useSidebarPermissions from './useSidebarPermissions';
import {
  useSidebarCollapsed,
  useSidebarSetCollapsed,
  useSidebarIsMobileView,
} from '../../SidebarStateProvider';

import { useRenderTracker } from '@/hooks/useRenderTracker';
import { useAuthManager } from '@/hooks/auth/useAuthManager';

const SidebarToggle = React.memo(
  ({
    className = '',
    onClick,
    isCollapsed,
  }: {
    className?: string;
    onClick: () => void;
    isCollapsed: boolean;
  }) => {
    return (
      <button
        onClick={onClick}
        className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 transition-colors duration-200 ${className}`}
        aria-label="Toggle sidebar"
        title={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
      >
        <ChevronRight
          size={18}
          className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </button>
    );
  },
);

SidebarToggle.displayName = 'SidebarToggle';

const MemoTeamSwitcher = React.memo(TeamSwitcher);
const MemoNavMain = React.memo(NavMain);
const MemoNavProjects = React.memo(NavProjects);
const MemoNavUser = React.memo(NavUser);

const NavUserWithProvider = React.memo(() => {
  const { user, isLoading, logout } = useAuthManager();

  const userData = React.useMemo(() => {
    if (isLoading || !user) return null;
    return {
      name: user.fullName,
      avatar: user.avatar,
    };
  }, [user, isLoading]);

  if (!userData) return null;

  return <MemoNavUser user={userData} onLogout={logout} />;
});

NavUserWithProvider.displayName = 'NavUserWithProvider';

export const AppSidebar = React.memo(function AppSidebar() {
  const collapsed = useSidebarCollapsed();
  const setCollapsed = useSidebarSetCollapsed();
  const isMobileView = useSidebarIsMobileView();

  const handleToggle = React.useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const { navMainItems, projectItems } = useSidebarPermissions();

  useRenderTracker('AppSidebar', {});

  return (
    <div className="h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden w-full shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center space-x-2">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DP</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Daily Performance</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">DP</span>
            </div>
          )}
        </div>
        {!isMobileView && (
          <SidebarToggle onClick={handleToggle} className="ml-auto" isCollapsed={collapsed} />
        )}
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        <MemoNavMain items={navMainItems} />
        {projectItems && projectItems.length > 0 && (
          <MemoNavProjects projects={projectItems} />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800">
        <NavUserWithProvider />
      </div>
    </div>
  );
});

AppSidebar.displayName = 'AppSidebar';
