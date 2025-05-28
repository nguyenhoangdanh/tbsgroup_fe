'use client';

import React, { useState, useCallback, useMemo } from 'react';

import BulkOperationsPanel from './_components/BulkOperationsPanel';
import PermissionSelector from './_components/PermissionSelector';
import RoleSelector from './_components/RoleSelector';

import { Switch } from '@/components/ui/switch';

export function PermissionManagementContainer() {
  // States for multi-selection
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  // Operation mode toggle (single role vs multi-role operations)
  const [bulkMode, setBulkMode] = useState<boolean>(false);

  //  Memoize handlers to prevent re-renders and infinite loops
  const handleRoleSelection = useCallback((roleIds: string[]) => {
    // Ensure we're not comparing identical arrays with different references
    setSelectedRoleIds(prev => {
      //  If arrays are same length and have same contents, don't update state
      if (
        prev.length === roleIds.length &&
        prev.every(id => roleIds.includes(id)) &&
        roleIds.every(id => prev.includes(id))
      ) {
        return prev;
      }
      return roleIds;
    });
  }, []);

  const handlePermissionSelection = useCallback((permissionIds: string[]) => {
    // Same pattern as above - avoid unnecessary state updates
    setSelectedPermissionIds(prev => {
      if (
        prev.length === permissionIds.length &&
        prev.every(id => permissionIds.includes(id)) &&
        permissionIds.every(id => prev.includes(id))
      ) {
        return prev;
      }
      return permissionIds;
    });
  }, []);

  // Handle operation completion (reset selections)
  const handleBulkOperationComplete = useCallback(() => {
    if (bulkMode) {
      setSelectedPermissionIds([]);
    }
  }, [bulkMode]);

  // Handle toggling bulk mode
  const handleBulkModeChange = useCallback(
    (checked: boolean) => {
      setBulkMode(checked);

      // If turning off bulk mode and multiple roles are selected, keep only the first one
      if (!checked && selectedRoleIds.length > 1) {
        setSelectedRoleIds(prev => (prev.length > 0 ? [prev[0]] : []));
      }
    },
    [selectedRoleIds],
  );

  // Memoize component props to prevent unnecessary re-renders
  const roleSelectorProps = useMemo(
    () => ({
      selectedRoleIds,
      onSelectionChange: handleRoleSelection,
      bulkMode,
    }),
    [selectedRoleIds, handleRoleSelection, bulkMode],
  );

  const permissionSelectorProps = useMemo(
    () => ({
      selectedPermissionIds,
      onSelectionChange: handlePermissionSelection,
      selectedRoleIds,
      bulkMode,
    }),
    [selectedPermissionIds, handlePermissionSelection, selectedRoleIds, bulkMode],
  );

  const bulkOperationsPanelProps = useMemo(
    () => ({
      selectedRoleIds,
      selectedPermissionIds,
      bulkMode,
      onOperationComplete: handleBulkOperationComplete,
    }),
    [selectedRoleIds, selectedPermissionIds, bulkMode, handleBulkOperationComplete],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Permission Management</h1>
        <div className="flex items-center gap-2">
          <Switch checked={bulkMode} onCheckedChange={handleBulkModeChange} />
          <span>Bulk Operations Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left panel: Role selection */}
        <RoleSelector {...roleSelectorProps} />

        {/* Right panel: Permission selection */}
        <PermissionSelector {...permissionSelectorProps} />
      </div>

      {/* Bottom panel: Operations */}
      <BulkOperationsPanel {...bulkOperationsPanelProps} />
    </div>
  );
}
