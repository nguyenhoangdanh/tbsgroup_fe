'use client';
import { Search } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { RoleItemType } from '@/apis/roles/role.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRoleContext } from '@/hooks/roles/roleContext';

interface RoleSelectorProps {
  selectedRoleIds: string[];
  onSelectionChange: (roleIds: string[]) => void;
  bulkMode: boolean;
}

export default function RoleSelector({
  selectedRoleIds,
  onSelectionChange,
  bulkMode,
}: RoleSelectorProps) {
  const { getAllRoles } = useRoleContext();
  const [searchTerm, setSearchTerm] = useState('');

  const roleQuery = getAllRoles;
  const roles = useMemo(() => {
    if (roleQuery.isSuccess) {
      return roleQuery.data;
    }
    return [];
  }, [roleQuery.isSuccess, roleQuery.data]);

  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return roles;

    return roles.filter(
      (role: RoleItemType) =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [roles, searchTerm]);

  const handleRoleToggle = (roleId: string) => {
    if (bulkMode) {
      // In bulk mode, toggle selection
      onSelectionChange(
        selectedRoleIds.includes(roleId)
          ? selectedRoleIds.filter(id => id !== roleId)
          : [...selectedRoleIds, roleId],
      );
    } else {
      // In single mode, replace selection
      onSelectionChange([roleId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(filteredRoles.map((role: RoleItemType) => role.id as string));
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Roles</span>
          {bulkMode && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearSelection}>
                Clear
              </Button>
            </div>
          )}
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            className="pl-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[50vh]">
          <div className="space-y-2">
            {filteredRoles.map((role: RoleItemType) => (
              <div
                key={role.id}
                className={`
                  p-3 rounded-md border cursor-pointer
                  ${selectedRoleIds.includes(String(role.id)) ? 'bg-primary/10 border-primary/30' : ''}
                  hover:bg-muted/50 transition-colors
                `}
                onClick={() => handleRoleToggle(String(role.id))}
              >
                <div className="flex items-center gap-3">
                  {bulkMode && (
                    <Checkbox
                      checked={selectedRoleIds.includes(String(role.id))}
                      onCheckedChange={() => handleRoleToggle(String(role.id))}
                    />
                  )}
                  <div>
                    <div className="font-medium">{role.name}</div>
                    {role.description && (
                      <div className="text-sm text-muted-foreground">{role.description}</div>
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
