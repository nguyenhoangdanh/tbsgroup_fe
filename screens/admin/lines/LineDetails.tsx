import React, { useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useLine } from '@/hooks/line/LineContext';
import { useFactoryQueries } from '@/hooks/factory/useFactoryQueries';
import {
    ArrowLeft,
    Pencil,
    Users,
    Settings,
    Workflow
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DialogType, useDialog } from '@/context/DialogProvider';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LineForm from '@/screens/admin/lines/LineForm';
import { Factory } from '@/common/interface/factory';

interface LineDetailsProps {
    factoryId: string;
    lineId: string;
}

export const LineDetails: React.FC<LineDetailsProps> = ({ factoryId, lineId }) => {
    const router = useRouter();
    const { showDialog } = useDialog();
    const { line, cache, mutations } = useLine();
    const factoryQueries = useFactoryQueries();

    // Fetch factory info using the factory hook
    const { data: factoryData } = factoryQueries.getFactoryWithDetails(factoryId, {
        includeManagers: false
    });

    // Fetch line details and managers
    const { data: lineDetails, isLoading, error } = line.getWithDetails(lineId, { includeManagers: true });

    // Check if user can manage this line
    const { data: canManage } = line.canManage(lineId);

    // Prefetch the line details when component mounts
    useEffect(() => {
        if (lineId) {
            cache.prefetchDetails(lineId, { includeManagers: true });
        }
    }, [lineId, cache]);

    // Handle back button navigation
    const handleBack = useCallback(() => {
        router.push(`/admin/factories/${factoryId}/lines`);
    }, [router, factoryId]);

    const factory: Factory = factoryData ? {
        id: factoryData.id!, // Use non-null assertion or provide a default
        name: factoryData.name ?? '',
        code: factoryData.code ?? '',
        description: factoryData.description ?? null,
        address: factoryData.address ?? null,
        departmentId: factoryData.departmentId ?? null,
        managingDepartmentId: factoryData.managingDepartmentId ?? null,
        createdAt: factoryData.createdAt ?? new Date().toISOString(),
        updatedAt: factoryData.updatedAt ?? new Date().toISOString(),
        department: factoryData.department ?? null,
        managingDepartment: factoryData.managingDepartment ?? null,
    } : {
        id: '',
        name: '',
        code: '',
        description: null,
        address: null,
        departmentId: null,
        managingDepartmentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        department: null,
        managingDepartment: null,
    };

    // Handle edit line
    const handleEdit = useCallback(() => {
        if (!lineDetails || !factory) return;

        showDialog({
            title: 'Cập nhật dây chuyền sản xuất',
            type: DialogType.EDIT,
            data: lineDetails,
            children: () => (
                <LineForm
                    factoryId={factoryId}
                    factory={factory}
                    line={lineDetails}
                    onSuccess={() => {
                        // Invalidate cache to ensure fresh data
                        cache.invalidateDetails(lineId, { forceRefetch: true });
                    }}
                />
            )
        });
    }, [lineDetails, factory, factoryId, showDialog, cache, lineId]);

    // Handle remove manager
    const handleRemoveManager = useCallback((userId: string) => {
        if (!lineDetails || !canManage) return;

        showDialog({
            title: 'Xác nhận xóa quản lý',
            description: 'Bạn có chắc chắn muốn xóa quản lý này khỏi dây chuyền?',
            type: DialogType.DELETE,
            data: { userId },
            onSubmit: async (data) => {
                try {
                    await mutations.removeManager(lineId, data.userId);

                    toast({
                        title: 'Xóa quản lý thành công',
                        description: 'Quản lý đã được xóa khỏi dây chuyền',
                        duration: 3000,
                    });

                    // Invalidate cache
                    cache.invalidateManagers(lineId, true);

                    return true;
                } catch (error) {
                    toast({
                        title: 'Lỗi xóa quản lý',
                        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa quản lý',
                        variant: 'destructive',
                        duration: 5000,
                    });
                    return false;
                }
            }
        });
    }, [lineDetails, lineId, showDialog, mutations, cache]);

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
    if (error || !lineDetails) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Lỗi tải dữ liệu</CardTitle>
                    <CardDescription>Không thể tải thông tin dây chuyền</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-destructive">
                        {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải thông tin dây chuyền'}
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

    const lineStatus = lineDetails.status || 'ACTIVE';

    return (
        <div className="space-y-6">
            {/* Header with back button and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {lineDetails.name}
                            <Badge>{lineDetails.code}</Badge>
                        </h1>
                        <p className="text-muted-foreground">
                            Nhà máy: {factory?.name || 'Đang tải...'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleEdit}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/admin/factories/${factoryId}/lines/${lineId}/settings`)}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Cài đặt
                    </Button>
                </div>
            </div>

            {/* Line details in tabs */}
            <Tabs defaultValue="general" className="w-full">
                <TabsList>
                    <TabsTrigger value="general">
                        <Workflow className="mr-2 h-4 w-4" />
                        Thông tin chung
                    </TabsTrigger>
                    <TabsTrigger value="managers">
                        <Users className="mr-2 h-4 w-4" />
                        Quản lý ({lineDetails.managers?.length || 0})
                    </TabsTrigger>
                </TabsList>

                {/* General information tab */}
                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin dây chuyền</CardTitle>
                            <CardDescription>Thông tin chi tiết về dây chuyền {lineDetails.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Mã dây chuyền</h3>
                                    <p className="font-medium">{lineDetails.code}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Tên dây chuyền</h3>
                                    <p className="font-medium">{lineDetails.name}</p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Công suất</h3>
                                    <p className="font-medium">
                                        {lineDetails.capacity ? `${lineDetails.capacity} sản phẩm/ngày` : 'Chưa cập nhật'}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Thời gian tạo</h3>
                                    <p className="font-medium">
                                        {lineDetails.createdAt ? new Date(lineDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Mô tả</h3>
                                <p className="text-sm">{lineDetails.description || 'Không có mô tả'}</p>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">Trạng thái</h3>
                                <div>
                                    {(() => {
                                        let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "default";
                                        let statusText = 'Không xác định';

                                        switch (lineStatus) {
                                            case 'ACTIVE':
                                                badgeVariant = "secondary"; // Changed from 'success'
                                                statusText = 'Hoạt động';
                                                break;
                                            case 'INACTIVE':
                                                badgeVariant = "outline";
                                                statusText = 'Tạm dừng';
                                                break;
                                            case 'MAINTENANCE':
                                                badgeVariant = "destructive";
                                                statusText = 'Bảo trì';
                                                break;
                                        }

                                        return <Badge variant={badgeVariant}>{statusText}</Badge>;
                                    })()}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Managers tab */}
                <TabsContent value="managers" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle>Danh sách quản lý</CardTitle>
                                <CardDescription>Những người quản lý dây chuyền {lineDetails.name}</CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => router.push(`/admin/factories/${factoryId}/lines/${lineId}/managers/add`)}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Thêm quản lý
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {lineDetails.managers && lineDetails.managers.length > 0 ? (
                                <div className="space-y-4">
                                    {lineDetails.managers.map((manager) => (
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
                                                {canManage && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => router.push(`/admin/factories/${factoryId}/lines/${lineId}/managers/${manager.userId}/edit`)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveManager(manager.userId)}
                                                            className="text-destructive"
                                                        >
                                                            <Users className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 space-y-2">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">Chưa có quản lý nào cho dây chuyền này</p>
                                    {canManage && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/admin/factories/${factoryId}/lines/${lineId}/managers/add`)}
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            Thêm quản lý
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};