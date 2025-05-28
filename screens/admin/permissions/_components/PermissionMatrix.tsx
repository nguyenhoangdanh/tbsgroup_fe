'use client';
import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';

import { usePermissionMatrix } from './usePermissionMatrix';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default function PermissionMatrix() {
  const {
    roles,
    permissions,
    matrix,
    changes,
    isLoading,
    error,
    togglePermission,
    saveChanges,
    refreshData,
  } = usePermissionMatrix();

  if (isLoading && (roles.length === 0 || permissions.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p>Loading permission matrix...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex justify-center mt-4">
            <Button onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (roles.length === 0 || permissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Permission Matrix</span>
            <Button onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {roles.length === 0 ? 'No roles found.' : 'No permissions found.'}
          </p>
          <p className="text-sm">
            {roles.length === 0 && permissions.length === 0
              ? 'You need to create roles and permissions before using the matrix view.'
              : roles.length === 0
                ? 'Create roles to manage permissions using the matrix view.'
                : 'Create permissions to assign to roles using the matrix view.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Permission Matrix</span>
          <div className="flex gap-2">
            <Button onClick={refreshData} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={saveChanges} disabled={changes.length === 0 || isLoading}>
              Save {changes.length > 0 ? `${changes.length} Changes` : ''}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <Alert className="mb-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <AlertDescription>Loading permission data...</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[70vh]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="min-w-[200px]">Permission</TableHead>
                  {roles.map(role => (
                    <TableHead key={role.id} className="text-center">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map(permission => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-medium">{permission.name}</div>
                        {permission.description && (
                          <div className="text-xs text-muted-foreground max-w-xs truncate">
                            {permission.description}
                          </div>
                        )}
                        {permission.code && (
                          <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                            {permission.code}
                          </code>
                        )}
                      </div>
                    </TableCell>
                    {roles.map(role => (
                      <TableCell key={role.id} className="text-center">
                        <Checkbox
                          checked={matrix[role.id]?.[permission.id] || false}
                          onCheckedChange={() => togglePermission(String(role.id), permission.id)}
                          className={
                            changes.some(
                              c => c.roleId === role.id && c.permissionId === permission.id,
                            )
                              ? 'border-primary'
                              : ''
                          }
                          disabled={isLoading}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {roles.length} roles × {permissions.length} permissions
        </div>
        {changes.length > 0 && (
          <div className="text-sm font-medium">
            {changes.length} unsaved {changes.length === 1 ? 'change' : 'changes'}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
