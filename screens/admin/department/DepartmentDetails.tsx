"use client"
import { Building, Users, Pencil, ArrowLeft, Building2, TreePine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDepartmentQueries } from '@/hooks/department';

import DepartmentForm from './DepartmentForm';

export interface DepartmentDetailsProps {
    departmentId: string;
}

export const DepartmentDetails: React.FC<DepartmentDetailsProps> = ({ departmentId }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');

    // Use the correct department queries
    const { getById, invalidateCache } = useDepartmentQueries();
    const {
        data: departmentDetails,
        isLoading,
        error,
        refetch,
    } = getById(departmentId, {
        enabled: !!departmentId,
    });

    // Handle back button
    const handleBack = useCallback(() => {
        router.push('/admin/departments');
    }, [router]);

    // Enhanced edit handler with full form
    // const handleEdit = useCallback(() => {
    //     if (!departmentDetails) return;

    //     showDialog({
    //         title: 'Chỉnh sửa phòng ban',
    //         type: DialogType.EDIT,
    //         data: departmentDetails,
    //         children: () => (
    //             <DepartmentForm
    //                 data={departmentDetails}
    //                 departments={[]} // Load departments if needed
    //                 onSuccess={() => {
    //                     invalidateCache();
    //                     refetch();
    //                 }}
    //             />
    //         ),
    //     });
    // }, [departmentDetails, showDialog, invalidateCache, refetch]);

    const handleNavigateToUsers = useCallback(() => {
        router.push(`/admin/departments/${departmentId}/users`);
    }, [router, departmentId]);

    const handleNavigateToOrganizationChart = useCallback(() => {
        router.push(`/admin/departments/organization-chart`);
    }, [router]);

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Đang tải...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error || !departmentDetails) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi tải dữ liệu</CardTitle>
                    <CardDescription>Không thể tải thông tin phòng ban</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-destructive">
                        {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải thông tin phòng ban'}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={handleBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with back button and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">{departmentDetails.name}</h1>
                    <Badge>{departmentDetails.code}</Badge>
                    <Badge variant={departmentDetails.departmentType === 'HEAD_OFFICE' ? 'default' : 'secondary'}>
                        {departmentDetails.departmentType === 'HEAD_OFFICE' ? 'Văn phòng điều hành' : 'Văn phòng nhà máy'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Pencil className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                    </Button>
                    <Button onClick={handleNavigateToOrganizationChart}>
                        <Building2 className="mr-2 h-4 w-4" />
                        Sơ đồ tổ chức
                    </Button>
                </div>
            </div>

            {/* Enhanced Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="general">
                        <Building className="mr-2 h-4 w-4" />
                        Thông tin chung
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="mr-2 h-4 w-4" />
                        Nhân viên
                    </TabsTrigger>
                    <TabsTrigger value="hierarchy">
                        <TreePine className="mr-2 h-4 w-4" />
                        Cấu trúc phân cấp
                    </TabsTrigger>
                </TabsList>

                {/* General information tab */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin phòng ban</CardTitle>
                            <CardDescription>Thông tin chi tiết về phòng ban {departmentDetails.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Mã phòng ban</h3>
                                    <p className="font-medium">{departmentDetails.code}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Tên phòng ban</h3>
                                    <p className="font-medium">{departmentDetails.name}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Loại phòng ban</h3>
                                    <Badge variant={departmentDetails.departmentType === 'HEAD_OFFICE' ? 'default' : 'secondary'}>
                                        {departmentDetails.departmentType === 'HEAD_OFFICE' ? 'VVăn phòng điều hành' : 'Văn phòng nhà máy'}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Thời gian tạo</h3>
                                    <p className="font-medium">
                                        {departmentDetails.createdAt
                                            ? new Date(departmentDetails.createdAt).toLocaleString('vi-VN')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Mô tả</h3>
                                <p className="text-sm">{departmentDetails.description || 'Không có mô tả'}</p>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Phòng ban cha</h3>
                                    {departmentDetails.parentId ? (
                                        <div className="flex items-center">
                                            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span>Có phòng ban cha</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Đây là phòng ban gốc
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Users tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nhân viên phòng ban</CardTitle>
                            <CardDescription>
                                Quản lý nhân viên thuộc phòng ban {departmentDetails.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <Users className="h-12 w-12 text-primary mb-4" />
                                <h3 className="text-lg font-medium mb-2">Quản lý nhân viên</h3>
                                <p className="text-muted-foreground mb-4">
                                    Xem và quản lý danh sách nhân viên thuộc phòng ban này
                                </p>
                                <Button onClick={handleNavigateToUsers}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Đi đến quản lý nhân viên
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Hierarchy tab */}
                <TabsContent value="hierarchy" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cấu trúc phân cấp</CardTitle>
                            <CardDescription>
                                Xem cấu trúc phân cấp và sơ đồ tổ chức
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <Building2 className="h-12 w-12 text-primary mb-4" />
                                <h3 className="text-lg font-medium mb-2">Sơ đồ tổ chức</h3>
                                <p className="text-muted-foreground mb-4">
                                    Xem sơ đồ tổ chức tổng thể và vị trí của phòng ban này
                                </p>
                                <Button onClick={handleNavigateToOrganizationChart}>
                                    <Building2 className="mr-2 h-4 w-4" />
                                    Xem sơ đồ tổ chức
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
