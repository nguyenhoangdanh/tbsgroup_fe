import { RoleProvider } from '@/hooks/roles/roleContext';

import PermissionManagementSystem from '@/screens/admin/permissions';
export default function RolePermissionPage() {
  return (
    <RoleProvider>
      <PermissionManagementSystem />
    </RoleProvider>
  )
}
