"use client"

import { ChevronRight, Menu, X, Settings, LogOut, User, Bell, Search, PanelLeftClose, PanelLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import ImageLogo from '@/components/common/layouts/ImageLogo'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuthContext } from "@/contexts/auth/AuthProvider"
import { cn } from "@/lib/utils"

import { useSidebarPermissions } from "./useSidebarPermissions"

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  // CRITICAL FIX: Enhanced state management
  const [mounted, setMounted] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false); // Thêm state collapse cho desktop
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])
  
  const pathname = usePathname()
  const { user, logout } = useAuthContext()
  const { navMain } = useSidebarPermissions()

  // CRITICAL FIX: Improved breakpoint detection
  React.useEffect(() => {
    setMounted(true);
    
    const updateMobile = () => {
      const width = window.innerWidth;
      const mobile = width < 1024;
      setIsMobile(mobile);
      
      // Restore collapse state from localStorage cho desktop
      if (!mobile) {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        if (savedCollapsed !== null) {
          setIsCollapsed(savedCollapsed === 'true');
        }
      }
    };

    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  // Save collapse state to localStorage
  React.useEffect(() => {
    if (mounted && !isMobile) {
      localStorage.setItem('sidebar-collapsed', String(isCollapsed));
    }
  }, [isCollapsed, mounted, isMobile]);

  // Filter items
  const filteredNavMain = React.useMemo(() => {
    if (!searchQuery) return navMain
    return navMain.filter(item => {
      const matchesTitle = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubItems = item.items?.some((subItem: { title: string; url: string }) =>
        subItem.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      return matchesTitle || matchesSubItems
    })
  }, [navMain, searchQuery])

  const userInitials = user?.fullName 
    ? user.fullName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().substring(0, 2)
    : user?.username?.substring(0, 2).toUpperCase() || 'U'

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // CRITICAL FIX: Enhanced handlers
  const openSidebar = () => {
    setSidebarOpen(true);
    if (isMobile) {
      document.body.style.overflow = 'hidden'; // Prevent body scroll on mobile
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    if (isMobile) {
      document.body.style.overflow = 'unset';
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  // Cleanup body scroll on unmount
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Don't render during SSR
  if (!mounted) {
    return <div className="w-64 h-screen bg-gray-100 animate-pulse hidden lg:block" />;
  }

  return (
    <>
      {/* IMPROVED: Mobile toggle button - better styling and positioning */}
      {isMobile && (
        <button
          onClick={openSidebar}
          className={cn(
            "fixed top-4 left-4 z-[9999] p-2 rounded-md bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700",
            "hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200",
            "flex items-center justify-center"
          )}
          aria-label="Open menu"
        >
          <Menu size={18} className="text-slate-700 dark:text-slate-300" />
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* IMPROVED: Desktop sidebar - with collapse functionality */}
      {!isMobile && (
        <div className={cn(
          "h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}>
          {/* Desktop Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {/* Logo và title - ẩn khi collapsed */}
            {!isCollapsed && (
              <div className="flex items-center space-x-3 min-w-0">
                <ImageLogo 
                  width={32}
                  height={32}
                  className="flex-shrink-0"
                  showGradient={false}
                  fallbackText="DP"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    THOAI SON HANDBAG FACTORY
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Management System
                  </span>
                </div>
              </div>
            )}
            
            {/* Logo khi collapsed */}
            {isCollapsed && (
              <div className="flex justify-center w-full">
                <ImageLogo 
                  width={28}
                  height={28}
                  showGradient={false}
                  fallbackText="DP"
                />
              </div>
            )}
            
            {/* Toggle button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapse}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
              title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
              {isCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </Button>
          </div>

          {/* Desktop Search - ẩn khi collapsed */}
          {!isCollapsed && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Tìm kiếm menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {filteredNavMain.map((item) => {
              const isExpanded = expandedItems.includes(item.title)
              const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
              const hasSubItems = item.items && item.items.length > 0

              return (
                <div key={item.title}>
                  {hasSubItems ? (
                    <div>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full h-10 px-3 text-left font-normal transition-all duration-200",
                          isCollapsed ? "justify-center px-2" : "justify-between",
                          isActive ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200" : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        onClick={() => !isCollapsed && toggleExpanded(item.title)}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <div className="flex items-center">
                          {item.icon && (
                            <item.icon className={cn(
                              "w-5 h-5 transition-colors",
                              isCollapsed ? "" : "mr-3",
                              isActive ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"
                            )} />
                          )}
                          {!isCollapsed && <span className="truncate">{item.title}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronRight className={cn(
                            "w-4 h-4 transition-transform duration-200", 
                            isExpanded && "rotate-90",
                            isActive ? "text-green-500" : "text-slate-400"
                          )} />
                        )}
                      </Button>
                      
                      {/* Sub items */}
                      {isExpanded && !isCollapsed && (
                        <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                          {item.items?.map((subItem : { title: string; url: string }) => {
                            const isSubActive = pathname === subItem.url
                            return (
                              <Link key={subItem.url} href={subItem.url}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={cn(
                                    "w-full justify-start h-8 px-3 text-sm font-normal transition-all duration-200",
                                    isSubActive 
                                      ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300" 
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                  )}
                                >
                                  <div className="w-1.5 h-1.5 bg-current rounded-full mr-3 opacity-60" />
                                  <span className="truncate">{subItem.title}</span>
                                </Button>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link href={item.url}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full h-10 px-3 font-normal transition-all duration-200",
                          isCollapsed ? "justify-center px-2" : "justify-start",
                          isActive 
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200" 
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        title={isCollapsed ? item.title : undefined}
                      >
                        {item.icon && (
                          <item.icon className={cn(
                            "w-5 h-5 transition-colors",
                            isCollapsed ? "" : "mr-3",
                            isActive ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-400"
                          )} />
                        )}
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Desktop User Profile */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-12 px-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all",
                    isCollapsed ? "justify-center px-2" : "justify-start"
                  )}
                >
                  <Avatar className="w-8 h-8 border-2 border-slate-200 dark:border-slate-600">
                    <AvatarImage src={user?.avatar} alt={user?.fullName || user?.username} />
                    <AvatarFallback className="bg-green-100 dark:bg-green-500 text-green-700 dark:text-white text-sm">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  
                  {!isCollapsed && (
                    <div className="ml-3 flex-1 text-left min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {user?.fullName || user?.username || 'User'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user?.email || 'No email'}
                      </div>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-56 border-slate-200 dark:border-slate-700"
                side={isCollapsed ? "right" : "top"}
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <div className="text-sm font-medium">
                      {user?.fullName || user?.username || 'User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email || 'No email'}
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Cài đặt
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  Thông báo
                  <Badge variant="destructive" className="ml-auto">3</Badge>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* IMPROVED: Mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-[9999] shadow-xl"
        >
          {/* Mobile Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div className="flex items-center space-x-3 min-w-0">
              <ImageLogo 
                width={32}
                height={32}
                className="flex-shrink-0"
                showGradient={false}
                fallbackText="DP"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  THOAI SON HANDBAG FACTORY
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Management System
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={closeSidebar}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Mobile Search */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Tìm kiếm menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
              />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {filteredNavMain.map((item) => {
              const isExpanded = expandedItems.includes(item.title)
              const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
              const hasSubItems = item.items && item.items.length > 0

              return (
                <div key={item.title}>
                  {hasSubItems ? (
                    <div>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between h-10 px-3 text-left font-normal",
                          isActive ? "bg-green-100 text-green-800" : "hover:bg-slate-100"
                        )}
                        onClick={() => toggleExpanded(item.title)}
                      >
                        <div className="flex items-center">
                          {item.icon && <item.icon className="w-5 h-5 mr-3" />}
                          <span>{item.title}</span>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-90")} />
                      </Button>
                      {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-3">
                          {item.items?.map((subItem : { title: string; url: string }) => (
                            <Link key={subItem.url} href={subItem.url} onClick={handleLinkClick}>
                              <Button variant="ghost" size="sm" className="w-full justify-start h-8 px-3 text-sm">
                                <div className="w-1.5 h-1.5 bg-current rounded-full mr-3 opacity-60" />
                                <span>{subItem.title}</span>
                              </Button>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link href={item.url} onClick={handleLinkClick}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-10 px-3 font-normal",
                          isActive ? "bg-green-100 text-green-800" : "hover:bg-slate-100"
                        )}
                      >
                        {item.icon && <item.icon className="w-5 h-5 mr-3" />}
                        <span>{item.title}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Mobile User Profile */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} alt={user?.fullName || user?.username} />
                <AvatarFallback className="bg-green-100 text-green-700 text-sm">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {user?.fullName || user?.username || 'User'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'No email'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
