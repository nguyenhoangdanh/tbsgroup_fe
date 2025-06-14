"use client";

import { Bell, Search } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { AppSidebar } from "./sidebar/_components/app-sidebar";
import { ThemeSwitch } from "./sidebar/_components/ThemeSwitch";


interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* AppSidebar handles its own width */}
      <AppSidebar />

      {/* CRITICAL FIX: Main content area - remove fixed margin */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header - mobile toggle space is handled by sidebar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
          {/* Left side - Breadcrumb */}
          <div className="flex items-center space-x-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    href="/admin"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Trang chủ
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-900 dark:text-gray-100 font-medium">
                    Quản lý hệ thống
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Right side - Actions và Theme Switcher */}
          <div className="flex items-center space-x-3">
            {/* Global Search - ẩn trên mobile nhỏ */}
            <div className="hidden lg:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <Input
                placeholder="Tìm kiếm..."
                className="pl-9 w-64 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-9 w-9 px-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Search size={16} />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-9 w-9 px-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Bell size={16} />
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <div className="text-sm font-medium">Thông báo mới</div>
                    <div className="text-xs text-gray-500">Bạn có một tin nhắn mới</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col space-y-1">
                    <div className="text-sm font-medium">Cập nhật hệ thống</div>
                    <div className="text-xs text-gray-500">Hệ thống sẽ bảo trì vào 2h sáng</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-blue-600 dark:text-blue-400">
                  Xem tất cả thông báo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Switcher */}
            <ThemeSwitch
              variant="icon"
              showLabel={false}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 min-w-0">
          <div className="max-w-full mx-auto min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
