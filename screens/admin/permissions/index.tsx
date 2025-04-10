"use client";
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import PermissionMatrix from './_components/PermissionMatrix';
import QuickAssignmentTemplates from './_components/QuickAssignmentTemplates';
import PermissionActionLog from './_components/PermissionActionLog';
import { PermissionManagementContainer } from './PermissionManagementContainer';

export default function PermissionManagementSystem() {
    const [activeTab, setActiveTab] = useState<string>('matrix');
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Permission Management</h1>
                <p className="text-muted-foreground">
                    Manage roles and permissions across your application
                </p>
            </div>

            <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="main">Standard View</TabsTrigger>
                    <TabsTrigger value="matrix">Matrix View</TabsTrigger>
                    <TabsTrigger value="templates">Quick Templates</TabsTrigger>
                    <TabsTrigger value="logs">Change Log</TabsTrigger>
                </TabsList>

                <TabsContent value="main" className="mt-6">
                    <PermissionManagementContainer />
                </TabsContent>

                <TabsContent value="matrix" className="mt-6">
                    <PermissionMatrix />
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <PermissionManagementContainer />
                        </div>
                        <div>
                            <QuickAssignmentTemplates />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="logs" className="mt-6">
                    <PermissionActionLog />
                </TabsContent>
            </Tabs>
        </div>
    );
}