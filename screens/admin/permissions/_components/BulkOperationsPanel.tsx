'use client';

import { AlertCircle, Save, Trash } from 'lucide-react';
import React, { useState, useCallback, useEffect, useRef } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useBulkOperationsUtils } from '@/hooks/permission/useBulkOperationsUtils';

interface BulkOperationsPanelProps {
  selectedRoleIds: string[];
  selectedPermissionIds: string[];
  bulkMode: boolean;
  onOperationComplete: () => void;
}

export default function BulkOperationsPanel({
  selectedRoleIds,
  selectedPermissionIds,
  bulkMode,
  onOperationComplete,
}: BulkOperationsPanelProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [operationStatus, setOperationStatus] = useState<{
    message: string;
    success: boolean;
    isVisible: boolean;
  }>({ message: '', success: false, isVisible: false });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState<'assign' | 'remove'>('assign');

  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isMountedRef = useRef(true);

  const { assignPermissionsToRole, removePermissionsFromRole } = useBulkOperationsUtils();

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = null;
      }
    };
  }, []);

  const showStatusMessage = useCallback((message: string, success: boolean) => {
    if (!isMountedRef.current) return;

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }

    setOperationStatus({
      message,
      success,
      isVisible: true,
    });

    statusTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setOperationStatus(prev => ({ ...prev, isVisible: false }));
      }
    }, 3000);
  }, []);

  const handleOperation = useCallback(
    (type: 'assign' | 'remove') => {
      if (selectedRoleIds.length === 0 || selectedPermissionIds.length === 0) {
        showStatusMessage('Please select both roles and permissions', false);
        return;
      }

      setOperationType(type);
      setConfirmDialogOpen(true);
    },
    [selectedRoleIds, selectedPermissionIds, showStatusMessage],
  );

  const executeOperation = useCallback(async () => {
    setConfirmDialogOpen(false);

    const operation =
      operationType === 'assign' ? assignPermissionsToRole : removePermissionsFromRole;

    if (operationType === 'assign') {
      setIsAssigning(true);
    } else {
      setIsRemoving(true);
    }

    let successCount = 0;
    let failCount = 0;

    try {
      const results = await Promise.allSettled(
        selectedRoleIds.map(roleId => operation(roleId, selectedPermissionIds)),
      );

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value === true) {
          successCount++;
        } else {
          failCount++;
        }
      });

      const statusMessage =
        `${operationType === 'assign' ? 'Assigned' : 'Removed'} permissions for ${successCount} roles` +
        (failCount > 0 ? ` (${failCount} failed)` : '');

      showStatusMessage(statusMessage, failCount === 0);

      onOperationComplete();
    } catch (error) {
      console.error('Operation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showStatusMessage(`Operation failed: ${errorMessage}`, false);
    } finally {
      setIsAssigning(false);
      setIsRemoving(false);
    }
  }, [
    operationType,
    assignPermissionsToRole,
    removePermissionsFromRole,
    selectedRoleIds,
    selectedPermissionIds,
    onOperationComplete,
    showStatusMessage,
  ]);

  return (
    <div className="mt-6 space-y-4">
      {operationStatus.isVisible && (
        <Alert variant={operationStatus.success ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{operationStatus.message}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted/30 border rounded-md p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">Bulk Operations</h3>
            <p className="text-sm text-muted-foreground">
              {bulkMode
                ? `Selected: ${selectedRoleIds.length} roles and ${selectedPermissionIds.length} permissions`
                : `Selected: ${selectedRoleIds.length === 1 ? '1 role' : 'No role'} and ${selectedPermissionIds.length} permissions`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => handleOperation('remove')}
              disabled={
                selectedRoleIds.length === 0 ||
                selectedPermissionIds.length === 0 ||
                isRemoving ||
                isAssigning
              }
            >
              <Trash className="h-4 w-4 mr-2" />
              {isRemoving ? 'Removing...' : 'Remove Permissions'}
            </Button>
            <Button
              onClick={() => handleOperation('assign')}
              disabled={
                selectedRoleIds.length === 0 ||
                selectedPermissionIds.length === 0 ||
                isAssigning ||
                isRemoving
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {isAssigning ? 'Assigning...' : 'Assign Permissions'}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {operationType === 'assign' ? 'Assign Permissions' : 'Remove Permissions'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {operationType} {selectedPermissionIds.length} permission
              {selectedPermissionIds.length !== 1 ? 's' : ''}
              to {selectedRoleIds.length} role
              {selectedRoleIds.length !== 1 ? 's' : ''}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action will affect all users that have these roles assigned.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={operationType === 'remove' ? 'destructive' : 'default'}
              onClick={executeOperation}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
