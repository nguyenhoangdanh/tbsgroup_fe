'use client';

import { Users, UserPlus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UsersPage() {
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <Button asChild>
          <Link href="/admin/users/all">
            <UserPlus className="mr-2 h-4 w-4" />
            View All Users
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage all system users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">243</span>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/users/all">View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>User Groups</CardTitle>
            <CardDescription>Manage user groups and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-2xl font-bold">12</span>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/users/groups">View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Manage user permission roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-orange-500 mr-2" />
                <span className="text-2xl font-bold">8</span>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admin/users/roles">View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
