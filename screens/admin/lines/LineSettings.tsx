import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Activity, ShieldAlert } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useLine } from '@/hooks/line/LineContext';
import { useFactoryQueries } from '@/hooks/factory/useFactoryQueries';
import { LineUpdateDTO } from '@/common/interface/line';
import { ErrorBoundary } from 'react-error-boundary';
import PageLoader from '@/components/common/Loading/PageLoader';

// Define LineStatus type to ensure type safety
type LineStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

// Error fallback component for ErrorBoundary
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <Card>
        <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>Đã xảy ra lỗi khi hiển thị cài đặt dây chuyền</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-destructive">
                {error.message || 'Đã xảy ra lỗi không xác định'}
            </div>
            <Button variant="outline" onClick={resetErrorBoundary} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Thử lại
            </Button>
        </CardContent>
    </Card>
);

// Error state component
const ErrorState = ({ error, onBack }: { error: unknown, onBack: () => void }) => (
    <Card>
        <CardHeader>
            <CardTitle>Lỗi tải dữ liệu</CardTitle>
            <CardDescription>Không thể tải thông tin cài đặt dây chuyền</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-destructive">
                {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải thông tin dây chuyền'}
            </div>
            <Button variant="outline" onClick={onBack} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
            </Button>
        </CardContent>
    </Card>
);

interface LineSettingsProps {
    factoryId: string;
    lineId: string;
}

export const LineSettings: React.FC<LineSettingsProps> = ({ factoryId, lineId }) => {
    const router = useRouter();
    const { line, mutations, cache } = useLine();
    const factoryQueries = useFactoryQueries();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch line details
    const { data: lineDetails, isLoading, error, refetch } = line.getWithDetails(lineId);

    // Check if user can manage this line
    const { data: canManage } = line.canManage(lineId);

    // Fetch factory info using the factory query
    const { data: factory } = factoryQueries.getFactoryWithDetails(factoryId, {
        includeManagers: false
    });

    // Handle refresh with debounce protection
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await refetch();
            await cache.invalidateDetails(lineId, { forceRefetch: true });
        } catch (error) {
            console.error('Error refreshing line details:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetch, cache, lineId, isRefreshing]);

    // Handle status change for the line
    const handleStatusChange = useCallback(async (status: LineStatus) => {
        if (!lineDetails || !canManage || isUpdating) return;

        setIsUpdating(true);
        try {
            // Create update data with explicit type casting to ensure TypeScript compatibility
            const updateData: LineUpdateDTO & { id: string } = {
                id: lineId,
                code: lineDetails.code || '', // Include existing code
                name: lineDetails.name || '', // Include existing name
                // Include other existing properties if needed
                description: lineDetails.description ?? undefined,
                capacity: lineDetails.capacity ?? undefined,
            };

            await mutations.update(updateData);

            // Invalidate cache for this line to refresh the data
            try {
                await cache.invalidateDetails(lineId, { forceRefetch: true });
            } catch (cacheError) {
                console.error('Cache invalidation error:', cacheError);
                // Fallback to direct refetch
                await refetch();
            }

            toast({
                title: 'Cập nhật trạng thái thành công',
                description: `Dây chuyền đã được chuyển sang trạng thái mới`,
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Lỗi cập nhật trạng thái',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật trạng thái',
                variant: 'destructive',
                duration: 5000,
            });
        } finally {
            setIsUpdating(false);
        }
    }, [lineDetails, lineId, mutations, cache, canManage, refetch, isUpdating]);

    // Navigation handlers
    const handleBack = useCallback(() => {
        router.push(`/admin/factories/${factoryId}/lines/${lineId}`);
    }, [router, factoryId, lineId]);

    const handleGoToManagers = useCallback(() => {
        router.push(`/admin/factories/${factoryId}/lines/${lineId}/managers`);
    }, [router, factoryId, lineId]);

    const handleGoToTeams = useCallback(() => {
        router.push(`/admin/factories/${factoryId}/lines/${lineId}/teams`);
    }, [router, factoryId, lineId]);

    // Determine overall loading state
    const isPageLoading = isLoading || isUpdating || isRefreshing;

    // Error handling
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
                showTableSkeleton={false}
            >
                <div className="space-y-6">
                    {/* Header with back button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">Cài đặt dây chuyền</h1>
                                <p className="text-muted-foreground">
                                    {lineDetails?.name} ({lineDetails?.code}) - Nhà máy: {factory?.name || 'Đang tải...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Settings tabs */}
                    <Tabs defaultValue="status" className="w-full">
                        <TabsList>
                            <TabsTrigger value="status">
                                <Activity className="mr-2 h-4 w-4" />
                                Trạng thái hoạt động
                            </TabsTrigger>
                            <TabsTrigger value="access">
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Quyền truy cập
                            </TabsTrigger>
                            <TabsTrigger value="staff">
                                <Users className="mr-2 h-4 w-4" />
                                Nhân sự
                            </TabsTrigger>
                        </TabsList>

                        {/* Access tab */}
                        <TabsContent value="access" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quyền truy cập</CardTitle>
                                    <CardDescription>Quản lý quyền truy cập dây chuyền</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Công khai</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Cho phép tất cả người dùng trong hệ thống xem dây chuyền này
                                                </p>
                                            </div>
                                            <Switch id="public-access" disabled={!canManage || isPageLoading} />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Giới hạn theo nhà máy</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Chỉ người dùng thuộc nhà máy mới có thể xem dây chuyền này
                                                </p>
                                            </div>
                                            <Switch id="factory-limited" defaultChecked disabled={!canManage || isPageLoading} />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Giới hạn chỉnh sửa</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Chỉ quản lý dây chuyền mới có thể chỉnh sửa thông tin
                                                </p>
                                            </div>
                                            <Switch id="edit-limited" defaultChecked disabled={!canManage || isPageLoading} />
                                        </div>

                                        <Separator />

                                        <div className="mt-6">
                                            <h3 className="font-medium mb-4">Quản lý quyền quản trị</h3>
                                            <Button
                                                variant="outline"
                                                onClick={handleGoToManagers}
                                                className="w-full justify-start"
                                                disabled={!canManage || isPageLoading}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                Quản lý danh sách quản lý dây chuyền
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Staff tab */}
                        <TabsContent value="staff" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quản lý nhân sự</CardTitle>
                                    <CardDescription>Quản lý nhân sự làm việc trên dây chuyền</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Nhóm sản xuất</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Quản lý các nhóm làm việc trên dây chuyền
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleGoToTeams}
                                                variant="outline"
                                                disabled={!canManage || isPageLoading}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                Quản lý nhóm
                                            </Button>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Tổ sản xuất</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Quản lý các tổ sản xuất thuộc dây chuyền
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push(`/admin/factories/${factoryId}/lines/${lineId}/groups`)}
                                                disabled={!canManage || isPageLoading}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                Quản lý tổ
                                            </Button>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Công nhân</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Quản lý công nhân làm việc trên dây chuyền
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push(`/admin/factories/${factoryId}/lines/${lineId}/workers`)}
                                                disabled={!canManage || isPageLoading}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                Quản lý công nhân
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </PageLoader>
        </ErrorBoundary>
    );
};