'use client';
import { CircleUserRound, KeyRound, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import useAuthManager from '@/hooks/useAuthManager';

const UserAvatar = () => {
  const router = useRouter();
  const { logout, user, isAuthenticated } = useAuthManager();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use fullName or username, with fallback for display
  const displayName = user?.fullName || user?.username || 'User';

  // Get the initials for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toLocaleUpperCase();
  };

  const handleNavigation = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router],
  );

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: 'Đăng xuất thành công',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Đăng xuất thất bại',
        description: 'Vui lòng thử lại sau',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout]);

  if (!isAuthenticated)
    return (
      <div className="flex items-center">
        <button
          onClick={() => handleNavigation('/login')}
          className="px-2 py-1 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors"
          aria-label="Đăng nhập"
        >
          Đăng nhập
        </button>
      </div>
    );

  return (
    <div className="flex items-center gap-2">
      {/* Chỉ hiển thị thông tin người dùng trên màn hình lớn hơn */}
      <div className="hidden sm:grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold ">{displayName}</span>
        {user?.employeeId && (
          <span className="truncate text-xs text-gray-500">{user.employeeId}</span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild aria-label="User menu">
          <Avatar className="h-8 w-8 rounded-lg cursor-pointer">
            {user?.avatar ? (
              <AvatarImage
                src={user.avatar}
                alt={displayName}
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = 'none';
                }}
              />
            ) : null}
            <AvatarFallback className="rounded-lg text-sm">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 text-sm">
            <p className="font-medium">{displayName}</p>
            {user?.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => handleNavigation('/profile')}
              className="cursor-pointer"
            >
              <CircleUserRound size="16px" className="mr-2" />
              Thông tin cá nhân
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleNavigation('/reset-password')}
              className="cursor-pointer"
            >
              <KeyRound size="16px" className="mr-2" />
              Đổi mật khẩu
            </DropdownMenuItem>

            {/* <DropdownMenuItem className="cursor-pointer">
                            <Bell size="16px" className="mr-2" />
                            Thông báo
                        </DropdownMenuItem> */}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            {/* <DropdownMenuItem className="cursor-pointer">
                            <SettingsIcon size="16px" className="mr-2" />
                            Cài đặt
                        </DropdownMenuItem> */}

            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer"
              disabled={isLoggingOut}
            >
              <LogOut size="16px" className="mr-2" />
              {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserAvatar;
