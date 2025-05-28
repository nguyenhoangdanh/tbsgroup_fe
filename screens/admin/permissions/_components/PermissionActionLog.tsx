'use client';
import { RefreshCw } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// Simulated log entry type - in a real app, this would come from your API
interface LogEntry {
  id: string;
  timestamp: Date;
  action: 'assign' | 'remove';
  roleId: string;
  roleName: string;
  permissionId: string;
  permissionName: string;
  performedBy: string;
}

export default function PermissionActionLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated log data fetch - replace with real API call
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Simulated API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      //  Simulated response
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          action: 'assign',
          roleId: 'role-1',
          roleName: 'Admin',
          permissionId: 'perm-1',
          permissionName: 'View Dashboard',
          performedBy: 'John Doe',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          action: 'remove',
          roleId: 'role-2',
          roleName: 'User',
          permissionId: 'perm-3',
          permissionName: 'Delete Records',
          performedBy: 'Jane Smith',
        },
        // Add more mock logs as needed
      ];

      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Permission Change Log</span>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Performed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No permission changes recorded
                  </TableCell>
                </TableRow>
              ) : (
                logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={log.action === 'assign' ? 'default' : 'destructive'}>
                        {log.action === 'assign' ? 'Assigned' : 'Removed'}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.roleName}</TableCell>
                    <TableCell>{log.permissionName}</TableCell>
                    <TableCell>{log.performedBy}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
