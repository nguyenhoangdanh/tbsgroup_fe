import React from 'react';

import { RoleProvider } from '@/hooks/roles/roleContext';
import RoleManagementScreen from '@/screens/admin/role/Container';

const RolePage = () => {
  return (
    <RoleProvider>
      <RoleManagementScreen />
    </RoleProvider>
  );
};

export default RolePage;
