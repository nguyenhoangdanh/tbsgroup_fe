'use client';

import { useMemo, useState } from 'react';

import { RolePermissionsAssignment } from './RolePermissionsAssignment';

import { RoleItemType } from '@/apis/roles/role.api';
import { useRoleContext } from '@/hooks/roles/roleContext';

export function RoleManagement() {
  const { getAllRoles } = useRoleContext();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Gọi getAllRoles để lấy dữ liệu vai trò
  const roleQuery = getAllRoles;

  const roles = useMemo(() => {
    if (roleQuery.isSuccess) {
      return roleQuery.data;
    }
    return [];
  }, [roleQuery.isSuccess, roleQuery.data]);

  if (!roles || roles.length === 0) {
    return <div>Không có vai trò nào được tìm thấy.</div>;
  }

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
  };

  return (
    <div>
      <h2>Quản lý vai trò</h2>
      <div>
        {roles?.map((role: RoleItemType) => (
          <button
            key={role.id}
            onClick={() => handleSelectRole(String(role.id))}
            className="m-2 p-2 border rounded"
          >
            {role.name}
          </button>
        ))}
      </div>
      {selectedRoleId && <RolePermissionsAssignment roleId={selectedRoleId} />}
    </div>
  );
}
