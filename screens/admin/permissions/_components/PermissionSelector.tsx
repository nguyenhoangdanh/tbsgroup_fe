'use client';

import { Search, Filter } from 'lucide-react';
import React, { useState, useMemo, useEffect, useRef } from 'react';

import { PermissionType } from '@/common/enum';
import { PermissionDTO } from '@/common/types/permission';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissionQueries } from '@/hooks/permission/usePermissionQueries';

interface PermissionSelectorProps {
  selectedPermissionIds: string[];
  onSelectionChange: (permissionIds: string[]) => void;
  selectedRoleIds: string[];
  bulkMode: boolean;
}

export default function PermissionSelector({
  selectedPermissionIds,
  onSelectionChange,
  selectedRoleIds,
}: PermissionSelectorProps) {
  const { listPermissions, getPermissionsByRole } = usePermissionQueries();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'assigned' | 'unassigned'>('all');

  // Get all permissions - không fetch lại khi component re-render
  const { data: allPermissionsData } = listPermissions(
    {},
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  );

  //Track assigned permissions across all selected roles
  const [assignedPermissionsMap, setAssignedPermissionsMap] = useState<Record<string, boolean>>({});

  //Track if component is mounted
  const isMountedRef = useRef(true);

  //  Track if we're currently fetching
  const isFetchingRef = useRef(false);

  //Store previous selected role IDs to compare
  const prevSelectedRoleIdsRef = useRef<string[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch permissions for all selected roles - chỉ fetch khi selectedRoleIds thay đổi thực sự
  useEffect(() => {
    // Skip if selected roles are the same as before (deep comparison)
    const prevRoles = prevSelectedRoleIdsRef.current;
    if (
      selectedRoleIds.length === prevRoles.length &&
      selectedRoleIds.every(id => prevRoles.includes(id))
    ) {
      return;
    }

    // Update previous selected roles
    prevSelectedRoleIdsRef.current = [...selectedRoleIds];

    // Reset assigned permissions map if no roles selected
    if (selectedRoleIds.length === 0) {
      setAssignedPermissionsMap({});
      return;
    }

    // Skip if already fetching
    if (isFetchingRef.current) return;

    // Define async function for fetching
    const fetchRolePermissions = async () => {
      if (!isMountedRef.current) return;

      isFetchingRef.current = true;

      try {
        // Create a new map for assigned permissions
        const newAssignedMap: Record<string, boolean> = {};

        // Fetch permissions for all roles in parallel
        const fetchPromises = selectedRoleIds.map(async roleId => {
          try {
            //   Use getPermissionsByRole instead of refetching each time
            const result = await getPermissionsByRole(roleId, {
              staleTime: 10000, // 10 seconds stale time to reduce refetches
            });

            //  Return permission IDs if data is available
            if (result.data?.data) {
              return result.data.data.map(p => p.id);
            }
            return [];
          } catch (error) {
            console.error(`Error fetching permissions for role ${roleId}:`, error);
            return [];
          }
        });

        // Wait for all fetch operations to complete
        const results = await Promise.all(fetchPromises);

        // Combine all permission IDs
        results.flat().forEach(id => {
          newAssignedMap[id] = true;
        });

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setAssignedPermissionsMap(newAssignedMap);
        }
      } catch (error) {
        console.error('Failed to fetch role permissions:', error);
      } finally {
        if (isMountedRef.current) {
          isFetchingRef.current = false;
        }
      }
    };

    // Start fetching
    fetchRolePermissions();
  }, [selectedRoleIds, getPermissionsByRole]);

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

  // Filter permissions based on search, tab, and filter type
  const filteredPermissions = useMemo(() => {
    if (!allPermissionsData?.data) return [];

    let filtered = allPermissionsData.data;

    // Filter by tab (permission type)
    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.type === activeTab);
    }

    // Filter by assignment status
    if (filterType === 'assigned') {
      filtered = filtered.filter(p => assignedPermissionsMap[p.id]);
    } else if (filterType === 'unassigned') {
      filtered = filtered.filter(p => !assignedPermissionsMap[p.id]);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    return filtered;
  }, [allPermissionsData, activeTab, filterType, assignedPermissionsMap, searchTerm]);

  // Handle toggling permission selection
  const handlePermissionToggle = (permissionId: string) => {
    if (selectedPermissionIds.includes(permissionId)) {
      onSelectionChange(selectedPermissionIds.filter(id => id !== permissionId));
    } else {
      onSelectionChange([...selectedPermissionIds, permissionId]);
    }
  };

  // Handle select all filtered permissions
  const handleSelectAll = () => {
    onSelectionChange(filteredPermissions.map(p => p.id));
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Permissions</span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType('all')}>
                  All Permissions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('assigned')}>
                  Assigned Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType('unassigned')}>
                  Unassigned Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearSelection}>
              Clear
            </Button>
          </div>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">All Types</TabsTrigger>
            <TabsTrigger value={PermissionType.PAGE_ACCESS}>Pages</TabsTrigger>
            <TabsTrigger value={PermissionType.FEATURE_ACCESS}>Features</TabsTrigger>
            <TabsTrigger value={PermissionType.DATA_ACCESS}>Data</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[50vh]">
          <div className="space-y-2">
            {filteredPermissions.map(permission => (
              <div
                key={permission.id}
                className={`
                  p-3 rounded-md border cursor-pointer
                  ${selectedPermissionIds.includes(permission.id) ? 'bg-primary/10 border-primary/30' : ''}
                  ${assignedPermissionsMap[permission.id] ? 'border-green-200 bg-green-50/50' : ''}
                  hover:bg-muted/50 transition-colors
                `}
                onClick={() => handlePermissionToggle(permission.id)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedPermissionIds.includes(permission.id)}
                    onCheckedChange={() => handlePermissionToggle(permission.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center">
                      {permission.name}
                      {assignedPermissionsMap[permission.id] && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Assigned
                        </span>
                      )}
                    </div>
                    {permission.description && (
                      <div className="text-sm text-muted-foreground">{permission.description}</div>
                    )}
                    {permission.code && (
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                        {permission.code}
                      </code>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
