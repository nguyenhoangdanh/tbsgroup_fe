'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useBulkOperationsUtils } from '@/hooks/permission/useBulkOperationsUtils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, Trash } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';

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
    onOperationComplete
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

    // Use a ref to store and track the timeout ID
    const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Use a ref to track if the component is mounted
    const isMountedRef = useRef(true);

    // Get the bulk operations functions
    const { assignPermissionsToRole, removePermissionsFromRole } = useBulkOperationsUtils();

    // Set up and cleanup when component mounts/unmounts
    useEffect(() => {
        // Set mounted flag to true
        isMountedRef.current = true;

        // Clean up on unmount
        return () => {
            // Set mounted flag to false
            isMountedRef.current = false;

            // Clear any active timeout
            if (statusTimeoutRef.current) {
                clearTimeout(statusTimeoutRef.current);
                statusTimeoutRef.current = null;
            }
        };
    }, []);

    // Function to safely show a status message with auto-hide
    const showStatusMessage = useCallback((message: string, success: boolean) => {
        // Only update state if component is still mounted
        if (!isMountedRef.current) return;

        // Clear any existing timeout
        if (statusTimeoutRef.current) {
            clearTimeout(statusTimeoutRef.current);
            statusTimeoutRef.current = null;
        }

        // Update state to show message
        setOperationStatus({
            message,
            success,
            isVisible: true
        });

        // Set timeout to hide message after delay
        statusTimeoutRef.current = setTimeout(() => {
            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setOperationStatus(prev => ({ ...prev, isVisible: false }));
            }
        }, 3000);
    }, []);

    // Handle starting an operation (showing confirmation dialog)
    const handleOperation = useCallback((type: 'assign' | 'remove') => {
        // Validate selections
        if (selectedRoleIds.length === 0 || selectedPermissionIds.length === 0) {
            showStatusMessage('Please select both roles and permissions', false);
            return;
        }

        // Set operation type and show confirmation dialog
        setOperationType(type);
        setConfirmDialogOpen(true);
    }, [selectedRoleIds, selectedPermissionIds, showStatusMessage]);

    // Execute the operation after confirmation
    const executeOperation = useCallback(async () => {
        // Close the confirmation dialog
        setConfirmDialogOpen(false);

        // Select the right operation based on type
        const operation = operationType === 'assign'
            ? assignPermissionsToRole
            : removePermissionsFromRole;

        // Set loading state
        if (operationType === 'assign') {
            setIsAssigning(true);
        } else {
            setIsRemoving(true);
        }

        // Track success and failure counts
        let successCount = 0;
        let failCount = 0;

        try {
            // Process all roles in parallel
            const results = await Promise.allSettled(
                selectedRoleIds.map(roleId =>
                    operation(roleId, selectedPermissionIds)
                )
            );

            // Count successes and failures
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value === true) {
                    successCount++;
                } else {
                    failCount++;
                }
            });

            // Create status message
            const statusMessage = `${operationType === 'assign' ? 'Assigned' : 'Removed'} permissions for ${successCount} roles` +
                (failCount > 0 ? ` (${failCount} failed)` : '');

            // Show status message
            showStatusMessage(statusMessage, failCount === 0);

            // Notify parent component that operation is complete
            onOperationComplete();
        } catch (error) {
            // Handle unexpected errors
            console.error('Operation failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showStatusMessage(`Operation failed: ${errorMessage}`, false);
        } finally {
            // Reset loading state
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
        showStatusMessage
    ]);

    return (
        <div className="mt-6 space-y-4">
            {operationStatus.isVisible && (
                <Alert variant={operationStatus.success ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {operationStatus.message}
                    </AlertDescription>
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
                            disabled={selectedRoleIds.length === 0 || selectedPermissionIds.length === 0 || isRemoving || isAssigning}
                        >
                            <Trash className="h-4 w-4 mr-2" />
                            {isRemoving ? 'Removing...' : 'Remove Permissions'}
                        </Button>
                        <Button
                            onClick={() => handleOperation('assign')}
                            disabled={selectedRoleIds.length === 0 || selectedPermissionIds.length === 0 || isAssigning || isRemoving}
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
                            Are you sure you want to {operationType} {selectedPermissionIds.length} permission{selectedPermissionIds.length !== 1 ? 's' : ''}
                            to {selectedRoleIds.length} role{selectedRoleIds.length !== 1 ? 's' : ''}?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Alert variant="warning">
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