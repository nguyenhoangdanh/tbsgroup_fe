// src/components/admin/roles/RolePermissionsAssignment.tsx
'use client';

import { PermissionType } from '@/common/enum';
import { PermissionDTO } from '@/common/types/permission';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useRolePermissions } from '@/hooks/permission/useRolePermissions';

interface RolePermissionsAssignmentProps {
  roleId: string;
}

export function RolePermissionsAssignment({ roleId }: RolePermissionsAssignmentProps) {
  const {
    availablePermissions,
    assignedPermissions,
    selectedPermissionIds,
    permissionsByType,
    isLoading,
    togglePermissionSelection,
    selectPermissionsByType,
    selectAllPermissions,
    clearAllSelections,
    assignSelectedPermissions,
    removeSelectedPermissions,
    isPermissionAssigned,
  } = useRolePermissions({ initialRoleId: roleId });

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  console.log('availablePermissions', availablePermissions, roleId);

  return (
    <div>
      <h3>Quản lý quyền cho vai trò</h3>
      <div className="mb-4">
        <h4>Chọn quyền theo loại</h4>
        <div className="flex space-x-2">
          <Button onClick={() => selectPermissionsByType(PermissionType.PAGE_ACCESS)}>
            Quyền trang
          </Button>
          <Button onClick={() => selectPermissionsByType(PermissionType.FEATURE_ACCESS)}>
            Quyền tính năng
          </Button>
          <Button onClick={() => selectPermissionsByType(PermissionType.DATA_ACCESS)}>
            Quyền dữ liệu
          </Button>
          <Button onClick={selectAllPermissions}>Chọn tất cả</Button>
          <Button onClick={clearAllSelections}>Bỏ chọn tất cả</Button>
        </div>
      </div>

      {/* Danh sách quyền theo từng loại */}
      {Object.entries(permissionsByType).map(([type, permissions]) => (
        <div key={type} className="mb-4">
          <h4>
            {type === PermissionType.PAGE_ACCESS
              ? 'Quyền trang'
              : type === PermissionType.FEATURE_ACCESS
                ? 'Quyền tính năng'
                : 'Quyền dữ liệu'}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {permissions.map((permission: PermissionDTO) => (
              <div key={permission.id} className="flex items-center">
                <Checkbox
                  id={permission.id}
                  checked={selectedPermissionIds.includes(permission.id)}
                  onChange={() => togglePermissionSelection(permission.id)}
                />
                <label htmlFor={permission.id} className="ml-2">
                  {permission.name}
                  {isPermissionAssigned(permission.id) && (
                    <span className="text-green-500 ml-1">(Đã gán)</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end space-x-2 mt-4">
        <Button onClick={assignSelectedPermissions} disabled={selectedPermissionIds.length === 0}>
          Gán quyền
        </Button>
        <Button
          variant="destructive"
          onClick={removeSelectedPermissions}
          disabled={selectedPermissionIds.length === 0}
        >
          Xóa quyền
        </Button>
      </div>
    </div>
  );
}
