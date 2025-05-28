import PermissionManagementSystem from '@/screens/admin/permissions';
import { RoleProvider } from '@/hooks/roles/roleContext';
export default function RolePermissionPage() {
  return (
    <RoleProvider>
      <PermissionManagementSystem />
    </RoleProvider>
  )
}
