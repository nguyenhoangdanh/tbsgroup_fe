import React, { useCallback } from 'react';
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

// Định nghĩa kiểu LineStatus để đảm bảo type safety
type LineStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

interface LineSettingsProps {
    factoryId: string;
    lineId: string;
}

export const LineSettings: React.FC<LineSettingsProps> = ({ factoryId, lineId }) => {
    const router = useRouter();
    const { line, mutations, cache } = useLine();
    const factoryQueries = useFactoryQueries();

    // Fetch line details
    const { data: lineDetails, isLoading, error } = line.getWithDetails(lineId);

    // Check if user can manage this line
    const { data: canManage } = line.canManage(lineId);

    // Fetch factory info using the factory query
    const { data: factory } = factoryQueries.getFactoryWithDetails(factoryId, {
        includeManagers: false
    });

    // Handle status change for the line
    const handleStatusChange = useCallback(async (status: LineStatus) => {
        if (!lineDetails || !canManage) return;

        try {
            // Create update data with explicit type casting to ensure TypeScript compatibility
            const updateData: LineUpdateDTO & { id: string } = {
                id: lineId,
                status: status,
                code: lineDetails.code || '', // Include existing code
                name: lineDetails.name || '', // Include existing name
                // Optional: include other existing properties if needed
                description: lineDetails.description ?? undefined,
                capacity: lineDetails.capacity ?? undefined,
            };

            await mutations.update(updateData);

            // Invalidate cache for this line to refresh the data
            cache.invalidateDetails(lineId, { forceRefetch: true });

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
        }
    }, [lineDetails, lineId, mutations, cache, canManage]);

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
                    <CardDescription>Không thể tải thông tin cài đặt dây chuyền</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-destructive">
                        {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải thông tin dây chuyền'}
                    </div>
                    <Button variant="outline" onClick={handleBack} className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Status property check - mặc định là ACTIVE nếu không có
    const lineStatus = lineDetails.status || 'ACTIVE';

    return (
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
                            {lineDetails.name} ({lineDetails.code}) - Nhà máy: {factory?.name || 'Đang tải...'}
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

                {/* Status tab */}
                <TabsContent value="status" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trạng thái dây chuyền</CardTitle>
                            <CardDescription>Quản lý trạng thái hoạt động của dây chuyền</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <h3 className="font-medium">Hoạt động</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Dây chuyền đang hoạt động bình thường
                                    </p>
                                </div>
                                <Switch
                                    checked={lineStatus === 'ACTIVE'}
                                    onCheckedChange={(checked) => {
                                        if (checked) handleStatusChange('ACTIVE');
                                    }}
                                    disabled={!canManage}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <h3 className="font-medium">Tạm dừng</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Tạm dừng hoạt động của dây chuyền
                                    </p>
                                </div>
                                <Switch
                                    checked={lineStatus === 'INACTIVE'}
                                    onCheckedChange={(checked) => {
                                        if (checked) handleStatusChange('INACTIVE');
                                    }}
                                    disabled={!canManage}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <h3 className="font-medium">Bảo trì</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Dây chuyền đang trong quá trình bảo trì
                                    </p>
                                </div>
                                <Switch
                                    checked={lineStatus === 'MAINTENANCE'}
                                    onCheckedChange={(checked) => {
                                        if (checked) handleStatusChange('MAINTENANCE');
                                    }}
                                    disabled={!canManage}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

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
                                    <Switch id="public-access" disabled={!canManage} />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between py-4">
                                    <div>
                                        <h3 className="font-medium">Giới hạn theo nhà máy</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Chỉ người dùng thuộc nhà máy mới có thể xem dây chuyền này
                                        </p>
                                    </div>
                                    <Switch id="factory-limited" defaultChecked disabled={!canManage} />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between py-4">
                                    <div>
                                        <h3 className="font-medium">Giới hạn chỉnh sửa</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Chỉ quản lý dây chuyền mới có thể chỉnh sửa thông tin
                                        </p>
                                    </div>
                                    <Switch id="edit-limited" defaultChecked disabled={!canManage} />
                                </div>

                                <Separator />

                                <div className="mt-6">
                                    <h3 className="font-medium mb-4">Quản lý quyền quản trị</h3>
                                    <Button
                                        variant="outline"
                                        onClick={handleGoToManagers}
                                        className="w-full justify-start"
                                        disabled={!canManage}
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
                                        disabled={!canManage}
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
                                        disabled={!canManage}
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
                                        disabled={!canManage}
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
    );
};