import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { LineProvider, useLine, useLineDetails } from '@/hooks/line/LineContext';
import { TeamProvider, useTeam } from '@/hooks/teams/TeamContext'; // Import for team hooks
import { useFactoryQueries } from '@/hooks/factory/useFactoryQueries';
import {
    ArrowLeft,
    Pencil,
    Users,
    Settings,
    Workflow,
    Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DialogType, useDialog } from '@/context/DialogProvider';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Factory } from '@/common/interface/factory';
import { LineManager } from '@/common/interface/line';
import LineManagerForm from './LineManagerForm';
import { ErrorBoundary } from 'react-error-boundary';
import { useUserQueries } from '@/hooks/users';
import { LineManagersTable } from './LineManagersTable';
import LineTeamsTab from './LineTeamsTab'; // Import our new component
import PageLoader from '@/components/common/loading/PageLoader';

interface ErrorStateProps {
    error: Error | unknown;
    onBack: () => void;
}

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <Card>
        <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>Đã xảy ra lỗi khi hiển thị chi tiết dây chuyền</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-destructive">
                {error.message || 'Đã xảy ra lỗi không xác định'}
            </div>
        </CardContent>
        <CardFooter>
            <Button variant="outline" onClick={resetErrorBoundary}>
                Thử lại
            </Button>
        </CardFooter>
    </Card>
);

// Error state component
const ErrorState: React.FC<ErrorStateProps> = ({ error, onBack }) => (
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
            <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
            </Button>
        </CardFooter>
    </Card>
);

interface LineDetailsProps {
    factoryId: string;
    lineId: string;
}

export const LineDetails: React.FC<LineDetailsProps> = ({ factoryId, lineId }) => {
    const router = useRouter();
    const { showDialog } = useDialog();
    const { cache, mutations } = useLine();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch users for manager selection
    const { getAllUsers } = useUserQueries();
    const { data: users, isLoading: isLoadingUsers } = getAllUsers;

    // Use custom hook for line details with optimized queries
    const { lineDetails, isLoading, error } = useLineDetails(lineId, true);

    // Use direct line query to get refetch capability
    const { line } = useLine();
    const { refetch: refetchLineDetails } = line.getWithDetails(lineId);

    // Check if user can manage this line
    const { data: canManage } = line.canManage(lineId);

    // Fetch factory info using the factory hook
    const factoryQueries = useFactoryQueries();
    const { data: factoryData } = factoryQueries.getFactoryWithDetails(factoryId, {
        includeManagers: false,
        refetchOnWindowFocus: false,
    });

    // Use team queries to get team count
    const { queries: teamQueries } = useTeam();
    const { data: lineTeams = [] } = teamQueries.getTeamsByLineId(lineId, {
        enabled: true,
        refetchOnWindowFocus: false,
    });

    // Handle refresh with debounce protection
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await refetchLineDetails();
            await cache.invalidateDetails(lineId, { forceRefetch: true });
        } catch (error) {
            console.error('Error refreshing line details:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchLineDetails, cache, lineId, isRefreshing]);

    // Handle back button navigation
    const handleBack = useCallback(() => {
        router.push(`/admin/factories/${factoryId}/lines`);
    }, [router, factoryId]);

    // Prepare factory data for form
    const factory: Factory = useMemo(() => {
        if (!factoryData) {
            return {} as Factory;
        }

        return {
            id: factoryData.id!,
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
        };
    }, [factoryData]);

    // Handle edit line
    const handleEdit = useCallback(() => {
        if (!lineDetails || !factory) return;

        showDialog({
            title: 'Cập nhật dây chuyền sản xuất',
            type: DialogType.EDIT,
            data: lineDetails,
            children: () => (
                <LineProvider>
                    <LineManagerForm
                        lineId={lineId}
                        factoryId={factoryId}
                        manager={undefined}
                        users={users || []}
                        onSuccess={async () => {
                            try {
                                await cache.invalidateDetails(lineId, { forceRefetch: true });
                            } catch (error) {
                                console.error('Cache invalidation error:', error);
                                await handleRefresh();
                            }

                            toast({
                                title: 'Cập nhật dây chuyền thành công',
                                description: `Dây chuyền "${lineDetails.name}" đã được cập nhật`,
                                duration: 2000
                            });
                        }}
                    />
                </LineProvider>
            ),
        });
    }, [lineDetails, factory, factoryId, lineId, showDialog, cache, handleRefresh, users]);

    // Handle delete line
    const handleDelete = useCallback(() => {
        if (!lineDetails) return;

        showDialog({
            title: 'Xác nhận xóa dây chuyền',
            description: `Bạn có chắc chắn muốn xóa dây chuyền "${lineDetails.name}"? Thao tác này không thể hoàn tác.`,
            type: DialogType.DELETE,
            onSubmit: async () => {
                try {
                    await mutations.delete(lineId);

                    toast({
                        title: 'Xóa dây chuyền thành công',
                        description: 'Dây chuyền đã được xóa khỏi hệ thống',
                        duration: 2000
                    });

                    // Navigate back to lines list
                    router.push(`/admin/factories/${factoryId}/lines`);
                    return true;
                } catch (error) {
                    toast({
                        title: 'Lỗi xóa dây chuyền',
                        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa dây chuyền',
                        variant: 'destructive',
                        duration: 3000
                    });
                    return false;
                }
            },
        });
    }, [lineDetails, lineId, mutations, router, factoryId, showDialog]);

    // Handle remove manager
    const handleRemoveManager = useCallback((userId: string) => {
        if (!lineDetails || !canManage) return;

        const managerName = lineDetails.managers?.find(m => m.userId === userId)?.user?.fullName || userId;

        showDialog({
            title: 'Xác nhận xóa quản lý',
            description: `Bạn có chắc chắn muốn xóa quản lý ${managerName} khỏi dây chuyền?`,
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

                    // Invalidate managers cache
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
            },
        });
    }, [lineDetails, lineId, showDialog, mutations, cache, canManage]);

    // Handle edit manager 
    const handleEditManager = useCallback((manager: LineManager) => {
        showDialog({
            title: 'Chỉnh sửa thông tin quản lý dây chuyền',
            type: DialogType.EDIT,
            data: manager,
            children: () => (
                <LineProvider>
                    <LineManagerForm
                        lineId={lineId}
                        factoryId={factoryId}
                        manager={manager}
                        users={users || []}
                        onSuccess={async () => {
                            // Refresh data after update
                            try {
                                await cache.invalidateManagers(lineId, true);
                            } catch (error) {
                                console.error('Cache invalidation error:', error);
                                await handleRefresh();
                            }

                            toast({
                                title: 'Cập nhật quản lý thành công',
                                description: 'Thông tin quản lý đã được cập nhật',
                                duration: 3000,
                            });
                        }}
                    />
                </LineProvider>
            ),
        });
    }, [lineId, factoryId, showDialog, cache, handleRefresh, users]);

    // Handle add manager
    const handleAddManager = useCallback(() => {
        showDialog({
            title: 'Thêm quản lý dây chuyền',
            type: DialogType.CREATE,
            children: () => (
                <LineProvider>
                    <LineManagerForm
                        lineId={lineId}
                        factoryId={factoryId}
                        users={users || []}
                        onSuccess={async () => {
                            try {
                                await cache.invalidateManagers(lineId, true);
                            } catch (error) {
                                console.error('Cache invalidation error:', error);
                                await handleRefresh();
                            }

                            toast({
                                title: 'Thêm quản lý thành công',
                                description: 'Quản lý mới đã được thêm vào dây chuyền',
                                duration: 3000,
                            });
                        }}
                    />
                </LineProvider>
            ),
        });
    }, [lineId, factoryId, showDialog, cache, handleRefresh, users]);

    // Determine overall loading state
    const isPageLoading = isLoading || isLoadingUsers || isRefreshing;

    // Error state
    if (error && !isLoading) {
        return <ErrorState error={error} onBack={handleBack} />;
    }

    return (
        <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) =>
                <ErrorFallback error={error} resetErrorBoundary={() => {
                    handleRefresh();
                    resetErrorBoundary();
                }}
                />}
        >
            <PageLoader
                isLoading={isPageLoading}
                showTableSkeleton={true}
                skeletonColumns={3}
                skeletonRows={5}
            >
                <div className="space-y-6">
                    {/* Header with back button and actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    {lineDetails?.name}
                                    {lineDetails?.code && <Badge>{lineDetails.code}</Badge>}
                                </h1>
                                <p className="text-muted-foreground">
                                    Nhà máy: {factory?.name || 'Đang tải...'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleEdit} disabled={!canManage || isPageLoading}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/admin/factories/${factoryId}/lines/${lineId}/settings`)}
                                disabled={isPageLoading}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Cài đặt
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={!canManage || isPageLoading}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
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
                                Quản lý ({lineDetails?.managers?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="teams">
                                <Users className="mr-2 h-4 w-4" />
                                Tổ sản xuất ({lineTeams?.length || 0})
                            </TabsTrigger>
                        </TabsList>

                        {/* General information tab */}
                        <TabsContent value="general" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin dây chuyền</CardTitle>
                                    <CardDescription>Thông tin chi tiết về dây chuyền {lineDetails?.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">Mã dây chuyền</h3>
                                            <p className="font-medium">{lineDetails?.code}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">Tên dây chuyền</h3>
                                            <p className="font-medium">{lineDetails?.name}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">Công suất</h3>
                                            <p className="font-medium">
                                                {lineDetails?.capacity ? `${lineDetails.capacity} sản phẩm/ngày` : 'Chưa cập nhật'}
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">Thời gian tạo</h3>
                                            <p className="font-medium">
                                                {lineDetails?.createdAt ? new Date(lineDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">Mô tả</h3>
                                        <p className="text-sm">{lineDetails?.description || 'Không có mô tả'}</p>
                                    </div>

                                    <Separator />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Teams Tab - Using our dedicated component */}
                        <TabsContent value="teams" className="space-y-4">
                            <LineTeamsTab
                                factoryId={factoryId}
                                lineId={lineId}
                                canManage={!!canManage}
                            />
                        </TabsContent>

                        {/* Managers tab */}
                        <TabsContent value="managers" className="space-y-4">
                            {lineDetails && (
                                <LineManagersTable
                                    lineId={lineId}
                                    factoryId={factoryId}
                                    managers={lineDetails.managers || []}
                                    users={users || []}
                                    canManage={!!canManage}
                                    isLoading={isPageLoading}
                                    onAddManager={handleAddManager}
                                    onEditManager={handleEditManager}
                                    onDeleteManager={handleRemoveManager}
                                    onRefresh={handleRefresh}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </PageLoader>
        </ErrorBoundary>
    );
};