

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFactoryQueries } from '@/hooks/factory/useFactoryQueries';
import { useFactoryMutations } from '@/hooks/factory/useFactoryMutations';
import {
    Factory as FactoryIcon,
    Users,
    Building,
    Pencil,
    ArrowLeft,
    Plus,
    Trash2
} from 'lucide-react';
import { FactoryWithDetails, FactoryManager } from '@/common/interface/factory';
import { Badge } from '@/components/ui/badge';
import { DialogType, useDialog } from '@/context/DialogProvider';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ManagerForm from './ManagerForm';
import { useUserQueries } from '@/hooks/users';
import { FactoryManagersTable } from './FactoryManagersTable';

interface FactoryDetailsProps {
    factoryId: string;
}

export const FactoryDetails: React.FC<FactoryDetailsProps> = ({ factoryId }) => {
    const router = useRouter();
    const { showDialog } = useDialog();
    const { Mode: ManagerFormMode } = ManagerForm;

    // Fetch users for manager selection
    const { getAllUsers } = useUserQueries();
    const { data: users, isLoading: isLoadingUsers } = getAllUsers;

    // Fetch factory details with optimized query options
    const { getFactoryWithDetails, invalidateFactoryDetailsCache } = useFactoryQueries();
    const {
        data: factoryDetails,
        isLoading,
        error,
        refetch
    } = getFactoryWithDetails(factoryId, {
        includeManagers: true,
        // Only refetch on window focus if data is stale (over 5 minutes old)
        refetchOnWindowFocus: false
    });

    // Mutations with optimistic updates
    const { removeManagerMutation } = useFactoryMutations();

    // Handle back button
    const handleBack = useCallback(() => {
        router.push('/admin/factories');
    }, [router]);

    // Handle edit factory with optimized dialog flow
    const handleEdit = useCallback(() => {
        if (!factoryDetails) return;

        showDialog({
            type: DialogType.EDIT,
            data: factoryDetails,
            onClose: () => {
                // Use a more targeted refetch approach
                invalidateFactoryDetailsCache(factoryId, true);
                refetch();
            }
        });
    }, [factoryDetails, showDialog, invalidateFactoryDetailsCache, factoryId, refetch]);

    // Handle add manager with optimized cache updates
    const handleAddManager = useCallback(() => {
        if (!factoryDetails) return;

        showDialog({
            title: 'Thêm quản lý nhà máy',
            type: DialogType.CREATE,
            data: {
                factoryId: factoryDetails.id,
                factoryName: factoryDetails.name
            },
            children: () => (
                <ManagerForm
                    mode={ManagerFormMode.CREATE}
                    factoryId={factoryId}
                    users={users || []}
                    isLoadingUsers={isLoadingUsers}
                    onSuccess={() => {
                        // More targeted approach to cache invalidation
                        invalidateFactoryDetailsCache(factoryId, true);
                    }}
                />
            ),
            onClose: () => {
                refetch();
            }
        });
    }, [factoryDetails, showDialog, invalidateFactoryDetailsCache, factoryId, refetch, users, isLoadingUsers, ManagerFormMode]);

    // Handle update manager with optimized cache handling
    const handleUpdateManager = useCallback((manager: FactoryManager) => {
        if (!factoryDetails) return;

        showDialog({
            title: 'Cập nhật quản lý',
            type: DialogType.EDIT,
            data: manager,
            children: () => (
                <ManagerForm
                    mode={ManagerFormMode.UPDATE}
                    factoryId={factoryDetails.id}
                    existingManager={manager}
                    onSuccess={() => {
                        invalidateFactoryDetailsCache(factoryId, true);
                    }}
                />
            ),
            onClose: () => {
                refetch();
            }
        });
    }, [factoryDetails, showDialog, invalidateFactoryDetailsCache, factoryId, refetch, ManagerFormMode]);

    // Handle remove manager confirmation with optimized UX
    const handleConfirmRemoveManager = useCallback((userId: string, userName: string) => {
        showDialog({
            title: "Xác nhận xóa quản lý",
            description: `Bạn có chắc chắn muốn xóa quản lý ${userName} khỏi nhà máy ${factoryDetails?.name}?`,
            type: DialogType.DELETE,
            data: { userId, factoryId },
            onSubmit: async (data) => {
                try {
                    await removeManagerMutation.mutateAsync({
                        factoryId: data.factoryId,
                        userId: data.userId
                    });

                    toast({
                        title: 'Xóa quản lý thành công',
                        description: `Đã xóa quản lý khỏi nhà máy.`,
                        duration: 2000,
                    });

                    // Single operation for cache invalidation
                    invalidateFactoryDetailsCache(factoryId, true);

                    return true;
                } catch (error) {
                    toast({
                        title: 'Lỗi xóa quản lý',
                        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa quản lý.',
                        variant: 'destructive',
                        duration: 3000,
                    });
                    return false;
                }
            }
        });
    }, [factoryDetails, removeManagerMutation, invalidateFactoryDetailsCache, factoryId]);

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
    if (error || !factoryDetails) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi tải dữ liệu</CardTitle>
                    <CardDescription>Không thể tải thông tin nhà máy</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-destructive">
                        {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải thông tin nhà máy'}
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
                    <h1 className="text-2xl font-bold">{factoryDetails.name}</h1>
                    <Badge>{factoryDetails.code}</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                    </Button>
                </div>
            </div>

            {/* Factory details in tabs */}
            <Tabs defaultValue="general" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">
                        <FactoryIcon className="mr-2 h-4 w-4" />
                        Thông tin chung
                    </TabsTrigger>
                    <TabsTrigger value="managers">
                        <Users className="mr-2 h-4 w-4" />
                        Quản lý ({factoryDetails.managers?.length || 0})
                    </TabsTrigger>
                </TabsList>

                {/* General information tab */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin nhà máy</CardTitle>
                            <CardDescription>Thông tin chi tiết về nhà máy {factoryDetails.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Mã nhà máy</h3>
                                    <p className="font-medium">{factoryDetails.code}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Tên nhà máy</h3>
                                    <p className="font-medium">{factoryDetails.name}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Địa chỉ</h3>
                                    <p className="font-medium">{factoryDetails.address || 'Chưa cập nhật'}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Thời gian tạo</h3>
                                    <p className="font-medium">
                                        {factoryDetails.createdAt ? new Date(factoryDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Mô tả</h3>
                                <p className="text-sm">{factoryDetails.description || 'Không có mô tả'}</p>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Phòng ban quản lý</h3>
                                    {factoryDetails.department ? (
                                        <div className="flex items-center">
                                            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span>{factoryDetails.department.name}</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Chưa thiết lập phòng ban quản lý</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Phòng ban tại nhà máy</h3>
                                    {factoryDetails.managingDepartment ? (
                                        <div className="flex items-center">
                                            <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span>{factoryDetails.managingDepartment.name}</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Chưa thiết lập phòng ban tại nhà máy</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Managers tab */}
                <TabsContent value="managers" className="space-y-4">
                    <FactoryManagersTable
                        factoryId={factoryDetails.id}
                        managers={factoryDetails.managers || []}
                        users={users || []}
                        onAddManager={() => {
                            // Implement add manager logic
                        }}
                        onEditManager={(manager) => {
                            // Implement edit manager logic
                        }}
                        onDeleteManager={(userId) => {
                            // Implement delete manager logic
                        }}
                    />
                    {/* <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>Danh sách quản lý</CardTitle>
                                <CardDescription>Những người quản lý nhà máy {factoryDetails.name}</CardDescription>
                            </div>
                            <Button size="sm" onClick={handleAddManager}>
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm quản lý
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {factoryDetails.managers?.length ? (
                                <div className="space-y-4">
                                    {factoryDetails.managers.map((manager) => (
                                        <div
                                            key={manager.userId}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <Avatar>
                                                    {manager.user?.avatar ? (
                                                        <AvatarImage src={manager.user.avatar} alt={manager.user?.fullName || 'User'} />
                                                    ) : null}
                                                    <AvatarFallback>
                                                        {manager.user?.fullName ? manager.user.fullName.charAt(0).toUpperCase() : 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{manager.user?.fullName || manager.userId}</p>
                                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                                        <span>Từ: {new Date(manager.startDate).toLocaleDateString('vi-VN')}</span>
                                                        {manager.endDate && (
                                                            <span>đến: {new Date(manager.endDate).toLocaleDateString('vi-VN')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {manager.isPrimary && (
                                                    <Badge className="mr-2">Quản lý chính</Badge>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleUpdateManager(manager)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleConfirmRemoveManager(manager.userId, manager.user?.fullName || manager.userId)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 space-y-2">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">Chưa có quản lý nào cho nhà máy này</p>
                                    <Button variant="outline" size="sm" onClick={handleAddManager}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Thêm quản lý
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card> */}
                </TabsContent>
            </Tabs>
        </div>
    );
};