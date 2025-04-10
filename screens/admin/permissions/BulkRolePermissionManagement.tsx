// src/components/admin/permissions/BulkPermissionManager.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRoleContext } from '@/hooks/roles/roleContext';
import { usePermissionQueries } from '@/hooks/permission/usePermissionQueries';
import { usePermissionMutations } from '@/hooks/permission/usePermissionMutations';
import { toast } from '@/hooks/use-toast';
import { RoleItemType } from '@/apis/roles/role.api';
import { PermissionDTO } from '@/common/types/permission';
import { PermissionType } from '@/common/enum';
import { isEqual } from 'lodash';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Icons
import {
    Search,
    Shield,
    CheckCircle2,
    X,
    Save,
    AlertTriangle,
    Filter,
    Globe,
    Lock,
    Database,
    Info,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkPermissionManagerProps {
    className?: string;
}

const BulkPermissionManager: React.FC<BulkPermissionManagerProps> = ({ className }) => {
    // State for selections
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

    // State for filters
    const [roleSearchTerm, setRoleSearchTerm] = useState('');
    const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
    const [activePermissionTab, setActivePermissionTab] = useState('all');
    const [permissionFilterStatus, setPermissionFilterStatus] = useState<'all' | 'common' | 'partial'>('all');

    // State for operations
    const [isAssigning, setIsAssigning] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [operationType, setOperationType] = useState<'assign' | 'remove'>('assign');

    // Get roles
    const { getAllRoles } = useRoleContext();
    const roleQuery = getAllRoles;

    // Get permissions
    const { listPermissions, getPermissionsByRole } = usePermissionQueries();
    const { data: allPermissionsData, isLoading: isLoadingPermissions } = listPermissions({});

    // Get permission mutations
    const {
        assignPermissionsToRoleMutation,
        removePermissionsFromRoleMutation,
        invalidateRelatedCaches
    } = usePermissionMutations();

    // Derived state for roles
    const roles = useMemo(() => {
        return roleQuery.isSuccess ? roleQuery.data : [];
    }, [roleQuery.isSuccess, roleQuery.data]);

    // Filter roles based on search
    const filteredRoles = useMemo(() => {
        if (!roleSearchTerm.trim()) return roles;

        return roles.filter((role: RoleItemType) =>
            role.name.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(roleSearchTerm.toLowerCase()))
        );
    }, [roles, roleSearchTerm]);

    // Track permissions assigned to each selected role
    const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, Record<string, boolean>>>({});
    const [isFetchingRolePermissions, setIsFetchingRolePermissions] = useState(false);

    // Sử dụng useCallback để memoize fetchRolePermissions
    const fetchRolePermissions = useCallback(async () => {
        if (selectedRoleIds.length === 0 || isFetchingRolePermissions) {
            return;
        }

        setIsFetchingRolePermissions(true);
        const newMap: Record<string, Record<string, boolean>> = { ...rolePermissionsMap };
        let hasChanges = false;

        try {
            // Sử dụng Promise.all để xử lý đồng thời các roleId
            const results = await Promise.all(
                selectedRoleIds.map(async (roleId) => {
                    try {
                        const result = await getPermissionsByRole(roleId).refetch();
                        if (result.data?.data) {
                            const permissionsObj: Record<string, boolean> = {};
                            result.data.data.forEach((permission: PermissionDTO) => {
                                permissionsObj[permission.id] = true;
                            });

                            if (!isEqual(newMap[roleId], permissionsObj)) {
                                newMap[roleId] = permissionsObj;
                                hasChanges = true;
                            }
                        }
                        return { roleId, success: true };
                    } catch (error) {
                        console.error(`Failed to fetch permissions for role ${roleId}:`, error);
                        return { roleId, success: false };
                    }
                })
            );

            // Chỉ cập nhật state một lần sau khi xử lý tất cả roleId
            if (hasChanges) {
                setRolePermissionsMap(newMap);
            }
        } finally {
            setIsFetchingRolePermissions(false);
        }
    }, [selectedRoleIds, getPermissionsByRole, rolePermissionsMap, isFetchingRolePermissions]);

    // Fetch permissions for selected roles
    useEffect(() => {
        if (selectedRoleIds.length === 0) {
            setRolePermissionsMap({});
            return;
        }

        fetchRolePermissions();
    }, [selectedRoleIds, fetchRolePermissions]);

    // Compute common and partial permissions
    const { commonPermissions, partialPermissions } = useMemo(() => {
        const roleIds = Object.keys(rolePermissionsMap);
        if (roleIds.length === 0) {
            return { commonPermissions: {}, partialPermissions: {} };
        }

        const commonMap: Record<string, boolean> = {};
        const partialMap: Record<string, boolean> = {};

        // Check all permissions from the first role
        if (roleIds[0] && rolePermissionsMap[roleIds[0]]) {
            const firstRolePermissions = rolePermissionsMap[roleIds[0]];

            // Start by assuming all permissions from the first role are common
            Object.keys(firstRolePermissions).forEach(permId => {
                commonMap[permId] = true;
            });

            // Then check if they exist in all other roles
            for (let i = 1; i < roleIds.length; i++) {
                const rolePermissions = rolePermissionsMap[roleIds[i]] || {};

                Object.keys(commonMap).forEach(permId => {
                    if (!rolePermissions[permId]) {
                        delete commonMap[permId];
                        partialMap[permId] = true;
                    }
                });

                Object.keys(rolePermissions).forEach(permId => {
                    if (!commonMap[permId]) {
                        partialMap[permId] = true;
                    }
                });
            }
        }

        return { commonPermissions: commonMap, partialPermissions: partialMap };
    }, [rolePermissionsMap]);

    // Filter permissions based on tab, search and status
    const filteredPermissions = useMemo(() => {
        if (!allPermissionsData?.data) return [];

        let filtered = allPermissionsData.data;

        if (activePermissionTab !== 'all') {
            filtered = filtered.filter(p => p.type === activePermissionTab);
        }

        if (permissionFilterStatus === 'common') {
            filtered = filtered.filter(p => commonPermissions[p.id]);
        } else if (permissionFilterStatus === 'partial') {
            filtered = filtered.filter(p => partialPermissions[p.id]);
        }

        if (permissionSearchTerm.trim()) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(permissionSearchTerm.toLowerCase())) ||
                (p.code && p.code.toLowerCase().includes(permissionSearchTerm.toLowerCase()))
            );
        }

        return filtered;
    }, [allPermissionsData, activePermissionTab, permissionFilterStatus, commonPermissions, partialPermissions, permissionSearchTerm]);

    // Group permissions by type
    const permissionsByType = useMemo(() => {
        if (!allPermissionsData?.data) return {};

        return allPermissionsData.data.reduce((acc: Record<string, PermissionDTO[]>, permission) => {
            if (!acc[permission.type]) {
                acc[permission.type] = [];
            }
            acc[permission.type].push(permission);
            return acc;
        }, {});
    }, [allPermissionsData]);

    // Permission status helpers
    const getPermissionStatus = (permissionId: string) => {
        if (selectedRoleIds.length === 0) return 'none';

        const roleIds = Object.keys(rolePermissionsMap);
        if (roleIds.length === 0) return 'none';

        let assignedCount = 0;
        for (const roleId of roleIds) {
            if (rolePermissionsMap[roleId]?.[permissionId]) {
                assignedCount++;
            }
        }

        if (assignedCount === 0) return 'none';
        if (assignedCount === roleIds.length) return 'all';
        return 'some';
    };

    // Selection handlers
    const handleRoleToggle = (roleId: string) => {
        setSelectedRoleIds(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        );
    };

    const handleSelectAllRoles = () => {
        setSelectedRoleIds(filteredRoles.map(r => r.id));
    };

    const handleClearRoleSelection = () => {
        setSelectedRoleIds([]);
    };

    const handlePermissionToggle = (permissionId: string) => {
        setSelectedPermissionIds(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSelectAllPermissions = () => {
        setSelectedPermissionIds(filteredPermissions.map(p => p.id));
    };

    const handleClearPermissionSelection = () => {
        setSelectedPermissionIds([]);
    };

    const handleSelectByType = (type: PermissionType) => {
        const typePermissions = filteredPermissions.filter(p => p.type === type);
        setSelectedPermissionIds(typePermissions.map(p => p.id));
    };

    // Operation handlers
    const handleOperation = (type: 'assign' | 'remove') => {
        if (selectedRoleIds.length === 0) {
            toast({
                title: 'No roles selected',
                description: 'Please select at least one role',
                variant: 'destructive',
            });
            return;
        }

        if (selectedPermissionIds.length === 0) {
            toast({
                title: 'No permissions selected',
                description: 'Please select at least one permission',
                variant: 'destructive',
            });
            return;
        }

        setOperationType(type);
        setConfirmDialogOpen(true);
    };

    const executeOperation = async () => {
        setConfirmDialogOpen(false);

        if (operationType === 'assign') {
            setIsAssigning(true);
        } else {
            setIsRemoving(true);
        }

        let successCount = 0;
        let failCount = 0;
        const totalOperations = selectedRoleIds.length;

        try {
            const results = await Promise.allSettled(
                selectedRoleIds.map(async (roleId) => {
                    try {
                        if (operationType === 'assign') {
                            await assignPermissionsToRoleMutation.mutateAsync({
                                roleId,
                                data: { permissionIds: selectedPermissionIds }
                            });
                        } else {
                            await removePermissionsFromRoleMutation.mutateAsync({
                                roleId,
                                data: { permissionIds: selectedPermissionIds }
                            });
                        }
                        return { roleId, success: true };
                    } catch (error) {
                        console.error(`Failed to ${operationType} permissions for role ${roleId}:`, error);
                        return { roleId, success: false };
                    }
                })
            );

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            });

            await invalidateRelatedCaches();
        } finally {
            if (operationType === 'assign') {
                setIsAssigning(false);
            } else {
                setIsRemoving(false);
            }
        }

        if (failCount === 0) {
            toast({
                title: 'Operation successful',
                description: `Successfully ${operationType === 'assign' ? 'assigned' : 'removed'} permissions from ${successCount} roles`,
            });
            setSelectedPermissionIds([]);
        } else {
            toast({
                title: 'Operation partially successful',
                description: `Completed for ${successCount} roles, failed for ${failCount} roles`,
                variant: 'destructive',
            });
        }
    };

    const renderPermissionIcon = (type: string) => {
        switch (type) {
            case PermissionType.PAGE_ACCESS:
                return <Globe className="h-4 w-4 mr-2 text-blue-500" />;
            case PermissionType.FEATURE_ACCESS:
                return <Lock className="h-4 w-4 mr-2 text-amber-500" />;
            case PermissionType.DATA_ACCESS:
                return <Database className="h-4 w-4 mr-2 text-green-500" />;
            default:
                return <Info className="h-4 w-4 mr-2 text-gray-500" />;
        }
    };

    const getPermissionTypeDisplay = (type: string) => {
        switch (type) {
            case PermissionType.PAGE_ACCESS:
                return 'Page Access';
            case PermissionType.FEATURE_ACCESS:
                return 'Feature Access';
            case PermissionType.DATA_ACCESS:
                return 'Data Access';
            default:
                return type;
        }
    };

    const getPermissionStatusBadge = (status: 'all' | 'some' | 'none') => {
        switch (status) {
            case 'all':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">All Roles</Badge>;
            case 'some':
                return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Some Roles</Badge>;
            default:
                return null;
        }
    };

    if (roleQuery.isLoading || isLoadingPermissions) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Bulk Permission Management</CardTitle>
                    <CardDescription>Loading data...</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-60 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-60 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Bulk Permission Management</CardTitle>
                <CardDescription>
                    Efficiently manage permissions across multiple roles simultaneously
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-2 items-center justify-between bg-muted/30 p-3 rounded-md">
                    <div>
                        <span className="font-medium">{selectedRoleIds.length}</span> roles selected,
                        <span className="font-medium ml-1">{selectedPermissionIds.length}</span> permissions selected
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleOperation('remove')}
                            disabled={selectedRoleIds.length === 0 || selectedPermissionIds.length === 0 || isAssigning || isRemoving}
                        >
                            {isRemoving ? 'Removing...' : 'Remove Permissions'}
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => handleOperation('assign')}
                            disabled={selectedRoleIds.length === 0 || selectedPermissionIds.length === 0 || isAssigning || isRemoving}
                        >
                            {isAssigning ? 'Assigning...' : 'Assign Permissions'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <div className="mb-3 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Roles</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleSelectAllRoles}>
                                    Select All
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleClearRoleSelection}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                        <div className="mb-3 relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search roles..."
                                className="pl-8"
                                value={roleSearchTerm}
                                onChange={(e) => setRoleSearchTerm(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[400px] border rounded-md">
                            <div className="p-2 space-y-2">
                                {filteredRoles.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">No roles found</p>
                                ) : (
                                    filteredRoles.map((role: RoleItemType) => (
                                        <div
                                            key={role.id}
                                            className={cn(
                                                "flex items-center p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                                                selectedRoleIds.includes(role.id) && "border-primary bg-primary/10"
                                            )}
                                            onClick={() => handleRoleToggle(role.id)}
                                        >
                                            <Checkbox
                                                checked={selectedRoleIds.includes(role.id)}
                                                onCheckedChange={() => handleRoleToggle(role.id)}
                                                className="mr-3"
                                            />
                                            <div className="flex-grow">
                                                <p className="font-medium">{role.name}</p>
                                                {role.description && (
                                                    <p className="text-sm text-muted-foreground">{role.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <div>
                        <div className="mb-3 flex justify-between items-center">
                            <h3 className="text-lg font-medium">Permissions</h3>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleSelectAllPermissions}>
                                    Select All
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleClearPermissionSelection}>
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <div className="mb-3 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search permissions..."
                                    className="pl-8"
                                    value={permissionSearchTerm}
                                    onChange={(e) => setPermissionSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={permissionFilterStatus === 'all' ? 'default' : 'outline'}
                                    onClick={() => setPermissionFilterStatus('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    size="sm"
                                    variant={permissionFilterStatus === 'common' ? 'default' : 'outline'}
                                    onClick={() => setPermissionFilterStatus('common')}
                                >
                                    Common to All
                                </Button>
                                <Button
                                    size="sm"
                                    variant={permissionFilterStatus === 'partial' ? 'default' : 'outline'}
                                    onClick={() => setPermissionFilterStatus('partial')}
                                >
                                    Partial
                                </Button>
                            </div>

                            <Tabs value={activePermissionTab} onValueChange={setActivePermissionTab}>
                                <TabsList className="grid grid-cols-4">
                                    <TabsTrigger value="all">All Types</TabsTrigger>
                                    <TabsTrigger value={PermissionType.PAGE_ACCESS}>Pages</TabsTrigger>
                                    <TabsTrigger value={PermissionType.FEATURE_ACCESS}>Features</TabsTrigger>
                                    <TabsTrigger value={PermissionType.DATA_ACCESS}>Data</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>

                        <ScrollArea className="h-[400px] border rounded-md">
                            <div className="p-2 space-y-2">
                                {filteredPermissions.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground">No permissions found</p>
                                ) : (
                                    filteredPermissions.map((permission) => {
                                        const status = getPermissionStatus(permission.id);
                                        return (
                                            <div
                                                key={permission.id}
                                                className={cn(
                                                    "flex p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors",
                                                    selectedPermissionIds.includes(permission.id) && "border-primary bg-primary/10",
                                                    status === 'all' && "border-green-200 bg-green-50/30",
                                                    status === 'some' && "border-amber-200 bg-amber-50/30"
                                                )}
                                                onClick={() => handlePermissionToggle(permission.id)}
                                            >
                                                <Checkbox
                                                    checked={selectedPermissionIds.includes(permission.id)}
                                                    onCheckedChange={() => handlePermissionToggle(permission.id)}
                                                    className="mr-3 mt-0.5"
                                                />
                                                <div className="flex-grow">
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <span className="font-medium">{permission.name}</span>
                                                        {status !== 'none' && getPermissionStatusBadge(status)}
                                                    </div>
                                                    {permission.description && (
                                                        <p className="text-sm text-muted-foreground">{permission.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {renderPermissionIcon(permission.type)}
                                                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                            {getPermissionTypeDisplay(permission.type)}
                                                        </span>
                                                        {permission.code && (
                                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                                {permission.code}
                                                            </code>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>

            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {operationType === 'assign' ? 'Assign Permissions' : 'Remove Permissions'}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {operationType} {selectedPermissionIds.length} permission{selectedPermissionIds.length !== 1 ? 's' : ''}
                            {operationType === 'assign' ? ' to ' : ' from '}
                            {selectedRoleIds.length} role{selectedRoleIds.length !== 1 ? 's' : ''}?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {operationType === 'remove' && (
                            <div className="rounded-md bg-destructive/10 p-3 text-destructive flex items-start">
                                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <span>
                                    Users with these roles will immediately lose access to the selected permissions.
                                </span>
                            </div>
                        )}
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
        </Card>
    );
};

export default BulkPermissionManager;