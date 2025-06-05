'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  DataTable,
  BaseTableData,
  TableColumn,
  PaginationConfig,
  SortConfig,
  FilterConfig,
  ActionConfig,
  DialogConfig,
  TableThemeConfig
} from 'react-table-power';

import UserForm from './_components/UserForm';
import { UserTableColumns } from './_components/UserTableColumns';

import { UserStatusEnum } from '@/common/enum';
import { UserType } from '@/common/interface/user';
import { Badge } from '@/components/ui/badge';
import { DialogType, useDialog } from '@/contexts/DialogProvider';
import { useRoleContext } from '@/hooks/roles/roleContext';
import { useUserContext } from '@/hooks/users/userContext';
import { TUserSchema } from '@/schemas/user';
import { useTheme } from 'next-themes';

const UserContainer = () => {
  // Sử dụng context
  const {
    listUsers,
    selectedUser,
    loading,
    activeFilters,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    setSelectedUser,
    resetError,
    updatePagination,
  } = useUserContext();

  const { theme } = useTheme();

  // Lấy context của role để có thể hiển thị danh sách role trong form
  const { getAllRoles } = useRoleContext();
  const roleQuery = getAllRoles;

  // Sử dụng useRef để tránh re-render không cần thiết
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // Theo dõi các request đang thực hiện
  const pendingRequestsRef = useRef(new Set<string>());

  // Dialog context
  const { updateDialogData, showDialog } = useDialog();

  // State lưu trữ metadata cho phân trang
  const [paginationMeta, setPaginationMeta] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: activeFilters.limit || 10,
  });

  // State cho sorting và filtering
  const [currentSorting, setCurrentSorting] = useState<SortConfig[]>([
    { field: 'createdAt', direction: 'desc' }
  ]);

  const [currentFilters, setCurrentFilters] = useState<Record<string, any>>({});

  // Thêm effect để cập nhật dialog khi selectedUser thay đổi
  useEffect(() => {
    if (selectedUser) {
      updateDialogData(selectedUser);
    }
  }, [selectedUser, updateDialogData]);

  // Get users data with filters and pagination
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
    isRefetching,
  } = listUsers(
    {
      ...activeFilters,
      // Convert string status to UserStatusEnum if it exists
      status: activeFilters.status ? (activeFilters.status as UserStatusEnum) : undefined,
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      // Thêm caching và stale time để tối ưu hiệu suất
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
    },
  );

  // Safe wrapper for refetch that prevents excessive calls
  const safeRefetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    // Tạo request ID để theo dõi
    const requestId = `refetch-${Date.now()}`;
    pendingRequestsRef.current.add(requestId);

    refetchTimeoutRef.current = setTimeout(() => {
      refetchUsers().finally(() => {
        pendingRequestsRef.current.delete(requestId);
        refetchTimeoutRef.current = null;
      });
    }, 300);
  }, [refetchUsers]);

  // Xử lý thay đổi trang/limit được tối ưu
  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      // Nếu không thay đổi, không cần trigger API call
      if (paginationMeta.currentPage === page && paginationMeta.pageSize === pageSize) {
        return;
      }

      // Cập nhật trong context
      updatePagination(page, pageSize);

      // Kích hoạt refetch sau khi cập nhật state
      setTimeout(() => {
        safeRefetch();
      }, 0);
    },
    [updatePagination, safeRefetch, paginationMeta],
  );

  // Chuẩn bị danh sách roles để truyền vào form
  const roleOptions = React.useMemo(() => {
    if (!roleQuery.data) return [];

    return roleQuery.data.map(role => ({
      value: role.id,
      label: role.name,
    }));
  }, [roleQuery.data]);

  // Handle form submission for create/edit with controlled refetch
  const handleUserFormSubmit = useCallback(
    async (data: TUserSchema): Promise<boolean> => {
      // Ngăn chặn submit trùng lặp
      if (isSubmittingRef.current) return false;

      const requestId = `submit-${Date.now()}`;
      try {
        isSubmittingRef.current = true;
        pendingRequestsRef.current.add(requestId);

        if (data.id) {
          const { id, ...updateData } = data;
          await handleUpdateUser(id, updateData);
        } else {
          const { ...createData } = data;
          await handleCreateUser(createData);
        }

        safeRefetch();
        setSelectedUser(null);
        return true;
      } catch (error) {
        console.error('Error submitting user form:', error);
        return false;
      } finally {
        isSubmittingRef.current = false;
        pendingRequestsRef.current.delete(requestId);
      }
    },
    [handleCreateUser, handleUpdateUser, safeRefetch, setSelectedUser],
  );

  // Handle user deletion
  const handleUserDelete = useCallback(
    async (id: string): Promise<void> => {
      // Ngăn chặn delete trùng lặp
      if (isSubmittingRef.current) return;

      const requestId = `delete-${Date.now()}`;
      try {
        isSubmittingRef.current = true;
        pendingRequestsRef.current.add(requestId);

        await handleDeleteUser(id);

        // Nếu user đang được chọn bị xóa, reset selection
        if (selectedUser?.id === id) {
          setSelectedUser(null);
        }

        safeRefetch();
      } catch (error) {
        console.error('Error deleting user:', error);
      } finally {
        isSubmittingRef.current = false;
        pendingRequestsRef.current.delete(requestId);
      }
    },
    [handleDeleteUser, safeRefetch, selectedUser, setSelectedUser],
  );

  // Xử lý khi chọn edit user
  const handleEditUser = useCallback(
    (user: UserType): void => {
      setSelectedUser(user);
      showDialog({
        type: DialogType.EDIT,
        data: user,
      });
    },
    [setSelectedUser, showDialog],
  );

  // Xử lý khi chọn xem user
  const handleViewUser = useCallback(
    (user: UserType): void => {
      setSelectedUser(user);
      showDialog({
        type: DialogType.VIEW,
        data: user,
      });
    },
    [setSelectedUser, showDialog],
  );

  // Xử lý khi sort thay đổi
  const handleSortChange = useCallback((sorting: SortConfig[]) => {
    setCurrentSorting(sorting);
  }, []);

  // Xử lý khi filter thay đổi
  const handleFilterChange = useCallback((filters: Record<string, any>) => {
    setCurrentFilters(filters);
    // Cập nhật filters vào context nếu cần
  }, []);

  // Xử lý create user
  const handleCreateUserAction = useCallback(() => {
    showDialog({
      type: DialogType.CREATE,
      data: null,
    });
  }, [showDialog]);

  // Đảm bảo cleanup khi unmount
  useEffect(() => {
    return () => {
      // Clear tất cả timers và refs
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }

      pendingRequestsRef.current.clear();
      isSubmittingRef.current = false;

      // Reset selected user khi unmount để tránh memory leaks
      setSelectedUser(null);
      resetError();
    };
  }, [setSelectedUser, resetError]);

  // Chuyển đổi columns từ ColumnDef sang TableColumn
  const tableColumns: TableColumn<UserType>[] = React.useMemo(() => {
    return [
      {
        accessorKey: 'fullName',
        header: 'Tên người dùng',
        cell: ({ row }) => {
          const user = row;
          return (
            <div className="flex items-center gap-2">
              <div className="font-medium">{user.fullName}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'username',
        header: 'Tên đăng nhập',
        enableSorting: true,
      },
      {
        accessorKey: 'role',
        header: 'Vai trò',
        cell: ({ row }) => {
          return row.role?.code || 'Chưa có vai trò';
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        filterType: 'select',
        filterOptions: [
          { label: 'Hoạt động', value: 'ACTIVE' },
          { label: 'Không hoạt động', value: 'INACTIVE' },
          { label: 'Chờ duyệt', value: 'PENDING_ACTIVATION' },
        ],
        cell: ({ row }) => {
          const status = row.status;
          return (
            <Badge
              className={
                status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : status === 'INACTIVE'
                    ? 'bg-red-500 text-white dark:text-gray-900 border-red-200'
                    : 'bg-gray-100 border-yellow-200 text-gray-900 dark:text-gray-800'
              }
            >
              {status === 'ACTIVE'
                ? 'Hoạt động'
                : status === 'INACTIVE'
                  ? 'Không hoạt động'
                  : 'Chờ duyệt'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'lastLogin',
        header: 'Đăng nhập cuối',
        cell: ({ row }) => {
          const lastLogin = row.lastLogin;
          if (!lastLogin) return 'Chưa đăng nhập';
          return new Date(lastLogin).toLocaleString('vi-VN');
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Ngày tạo',
        cell: ({ row }) => {
          return new Date(row.createdAt).toLocaleString('vi-VN');
        },
        enableSorting: true,
      },
    ];
  }, []);

  // Định nghĩa filter configs
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      options: [
        { label: 'Hoạt động', value: 'ACTIVE' },
        { label: 'Không hoạt động', value: 'INACTIVE' },
        { label: 'Chờ duyệt', value: 'PENDING_ACTIVATION' },
      ],
    },
    {
      key: 'roleId',
      label: 'Vai trò',
      type: 'select',
      options: roleOptions,
    },
  ];

  // Cấu hình dialog
  const dialogConfig: DialogConfig = {
    closeOnClickOutside: true,
    closeOnEsc: true,
    width: '600px',
  };

  const users = usersData?.data || [];
  const isLoading = loading || isLoadingUsers || isRefetching;

  // Cập nhật metadata phân trang khi dữ liệu thay đổi
  useEffect(() => {
    if (usersData?.meta) {
      setPaginationMeta({
        totalItems: usersData.meta.totalItems,
        totalPages: usersData.meta.totalPages,
        currentPage: usersData.meta.currentPage,
        pageSize: usersData.meta.itemsPerPage,
      });
    }
  }, [usersData]);

  // Cấu hình phân trang
  const paginationConfig: PaginationConfig = {
    current: paginationMeta.currentPage,
    pageSize: paginationMeta.pageSize,
    total: paginationMeta.totalItems,
    pageSizeOptions: [10, 20, 50, 100],
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong ${total} người dùng`,
  };

  // Cấu hình global search
  const globalSearchConfig = {
    enabled: true,
    placeholder: 'Tìm kiếm tên, email, số điện thoại...',
    fields: ['fullName', 'username', 'email', 'phone'],
  };

  const themConfig: TableThemeConfig = {
    theme: theme || 'light',
    header: {
      backgroundColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-900 dark:text-gray-100',
    },
    row: {
      hoverBackgroundColor: 'hover:bg-gray-50 dark:hover:bg-gray-700',
      selectedBackgroundColor: 'bg-blue-50 dark:bg-blue-800',
    },
  };

  return (
    <div className="space-y-6">
      <DataTable<UserType>
        data={users}
        columns={tableColumns}
        title="Danh sách người dùng"
        description="Quản lý tất cả người dùng trong hệ thống"
        loading={isLoading}
        pagination={paginationConfig}
        sorting={currentSorting}
        filters={filterConfigs}
        globalSearch={globalSearchConfig}
        theme={themConfig}
        builtInActions={{
          create: true,
          edit: true,
          view: true,
          delete: true,
          tooltips: true,
          createFormComponent: (props) => <UserForm {...props} roles={roleOptions} />,
          editFormComponent: (props) => <UserForm {...props} roles={roleOptions} />,
          viewFormComponent: (props) => <UserForm {...props} roles={roleOptions} isReadOnly={true} />,
        }}
        dialog={dialogConfig}
        size="medium"
        striped
        hover
        responsive
        eventHandlers={{
          onCreate: handleUserFormSubmit,
          onUpdate: handleUserFormSubmit,
          onDelete: handleUserDelete,
          onRefresh: safeRefetch,
          onSortChange: handleSortChange,
          onFilterChange: handleFilterChange,
          onPageChange: (page) => handlePageChange(page, paginationMeta.pageSize),
          onPageSizeChange: (size) => handlePageChange(paginationMeta.currentPage, size),
        }}
      />
    </div>
  );
};

export default UserContainer;
