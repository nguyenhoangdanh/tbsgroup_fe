"use client"

import * as React from "react"
import { TeamSwitcher } from "./team-switcher"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import useAuthManager from "@/hooks/useAuthManager"
import { sidebarData } from "./sidebar-data"
import { useSidebarCollapsed, useSidebarSetCollapsed, useSidebarIsMobileView } from "../../SidebarStateProvider"
import { useRenderTracker } from "@/hooks/useRenderTracker"

// Định nghĩa component SidebarToggle và memo nó
const SidebarToggle = React.memo(({
    className = "",
    onClick,
    isCollapsed
}: {
    className?: string,
    onClick: () => void,
    isCollapsed: boolean
}) => {
    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 ${className}`}
            aria-label="Toggle sidebar"
            title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            >
                <path d="m15 18-6-6 6-6"></path>
            </svg>

        </button>
    );
});

SidebarToggle.displayName = "SidebarToggle";

// Memo các component để tránh re-renders
const MemoTeamSwitcher = React.memo(TeamSwitcher);
const MemoNavMain = React.memo(NavMain);
const MemoNavProjects = React.memo(NavProjects);
const MemoNavUser = React.memo(NavUser);

// UserData wrapper để tránh re-renders của NavUser
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

NavUserWithProvider.displayName = "NavUserWithProvider";

// Export AppSidebar với React.memo
export const AppSidebar = React.memo(function AppSidebar() {
    // Sử dụng context đã tách để giảm re-render
    const collapsed = useSidebarCollapsed();
    const setCollapsed = useSidebarSetCollapsed();
    const isMobileView = useSidebarIsMobileView();

    // Handle sidebar toggle với useCallback
    const handleToggle = React.useCallback(() => {
        setCollapsed(!collapsed);
    }, [collapsed, setCollapsed]);

    // Memoize các item data để giảm re-renders
    const navMainItems = React.useMemo(() => sidebarData.navMain, []);
    const projectItems = React.useMemo(() => sidebarData.projects, []);
    const teamItems = React.useMemo(() => sidebarData.teams, []);

    useRenderTracker("AppSidebar", {});

    return (
        <div className="h-screen bg-white dark:bg-black border-r border-border/40 flex flex-col overflow-y-auto w-full">
            <div className="p-2.5 border-b flex items-center justify-between">
                <MemoTeamSwitcher teams={teamItems} />
                {!isMobileView && (
                    <SidebarToggle
                        onClick={handleToggle}
                        className="ml-auto"
                        isCollapsed={collapsed}
                    />
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2.5">
                <MemoNavMain items={navMainItems} />
                <div className="mt-4">
                    <MemoNavProjects projects={projectItems} />
                </div>
            </div>
            <div className="border-t p-2.5">
                <NavUserWithProvider />
            </div>
        </div>
    );
});

AppSidebar.displayName = "AppSidebar";




















// "use client"

// import * as React from "react"
// import { TeamSwitcher } from "./team-switcher"
// import { NavMain } from "./nav-main"
// import { NavProjects } from "./nav-projects"
// import { NavUser } from "./nav-user"
// import useAuthManager from "@/hooks/useAuthManager"
// import { sidebarData } from "./sidebar-data"
// import { useMediaQuery } from "@/hooks/useMediaQuery"
// import { useSidebarState } from "@/components/common/layouts/admin/AdminLayout"

// // Định nghĩa component SidebarToggle
// const SidebarToggle = ({
//     className = "",
//     onClick,
//     isCollapsed
// }: {
//     className?: string,
//     onClick: () => void,
//     isCollapsed: boolean
// }) => {
//     return (
//         <button
//             onClick={onClick}
//             className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 ${className}`}
//             aria-label="Toggle sidebar"
//             title={isCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
//         >
//             <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="18"
//                 height="18"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
//             >
//                 <path d="m15 18-6-6 6-6"></path>
//             </svg>
//         </button>
//     );
// };

// export function AppSidebar() {
//     // Use Media Query to detect mobile devices
//     const isMobileScreen = useMediaQuery("(max-width: 768px)");

//     // Use custom context from AdminLayout
//     const { collapsed, setCollapsed } = useSidebarState();

//     // Use React Suspense to handle loading state
//     const { user, isLoading } = useAuthManager();

//     // Memoize sidebar components to prevent unnecessary re-renders
//     const memoizedTeamSwitcher = React.useMemo(() =>
//         <TeamSwitcher teams={sidebarData.teams} />,
//         [sidebarData.teams]
//     );

//     const memoizedNavMain = React.useMemo(() =>
//         <NavMain items={sidebarData.navMain} />,
//         [sidebarData.navMain]
//     );

//     const memoizedNavProjects = React.useMemo(() =>
//         <NavProjects projects={sidebarData.projects} />,
//         [sidebarData.projects]
//     );

//     // Only create NavUser when user exists
//     const userNav = React.useMemo(() => {
//         if (isLoading) return null;
//         if (!user) return null;

//         return (
//             <NavUser user={{
//                 name: user.fullName,
//                 avatar: user.avatar,
//             }} />
//         );
//     }, [user, isLoading]);

//     // Handle sidebar toggle
//     const handleToggle = React.useCallback(() => {
//         setCollapsed(!collapsed);
//     }, [collapsed, setCollapsed]);

//     return (
//         <div className="h-screen bg-white dark:bg-black border-r border-border/40 flex flex-col overflow-y-auto w-full">
//             <div className="p-2.5 border-b flex items-center justify-between">
//                 {memoizedTeamSwitcher}
//                 {!isMobileScreen && (
//                     <SidebarToggle
//                         onClick={handleToggle}
//                         className="ml-auto"
//                         isCollapsed={collapsed}
//                     />
//                 )}
//             </div>
//             <div className="flex-1 overflow-y-auto p-2.5">
//                 {memoizedNavMain}
//                 <div className="mt-4">
//                     {memoizedNavProjects}
//                 </div>
//             </div>
//             <div className="border-t p-2.5">
//                 {userNav}
//             </div>
//         </div>
//     );
// }