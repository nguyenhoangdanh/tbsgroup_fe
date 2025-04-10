import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Activity, ShieldAlert, UserCog } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useTeam } from '@/hooks/teams/TeamContext';
import { TeamUpdateDTO } from '@/common/interface/team';
import { ErrorBoundary } from 'react-error-boundary';
import PageLoader from '@/components/common/loading/PageLoader';

// Error fallback component for ErrorBoundary
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <Card>
        <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>Đã xảy ra lỗi khi hiển thị cài đặt tổ</CardDescription>
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
            <CardDescription>Không thể tải thông tin cài đặt tổ</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-destructive">
                {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải thông tin tổ'}
            </div>
            <Button variant="outline" onClick={onBack} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại
            </Button>
        </CardContent>
    </Card>
);

interface TeamSettingsProps {
    params: {
        teamId: string;
    };
}

export default function TeamSettings({ params }: TeamSettingsProps) {
    const teamId = params.teamId;
    const router = useRouter();
    const {
        updateTeam,
        invalidateTeamCache,
        isUpdating: isTeamUpdating,
        queries
    } = useTeam();

    const [isUpdating, setIsUpdating] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch team details
    const {
        data: teamDetails,
        isLoading,
        error,
        refetch
    } = queries.getTeamWithDetails(teamId, {
        enabled: true,
        refetchOnWindowFocus: false,
    });

    // Handle refresh with debounce protection
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await refetch();
            await invalidateTeamCache(teamId, true);

            toast({
                title: 'Làm mới dữ liệu',
                description: 'Cài đặt tổ đã được cập nhật',
                duration: 2000
            });
        } catch (error) {
            console.error('Error refreshing team settings:', error);
            toast({
                title: 'Lỗi làm mới',
                description: 'Không thể làm mới cài đặt tổ',
                variant: 'destructive'
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [refetch, invalidateTeamCache, teamId, isRefreshing]);

    // General update handler for team settings
    const handleSettingUpdate = useCallback(async (updateData: Partial<TeamUpdateDTO>) => {
        if (!teamDetails || isUpdating || isTeamUpdating) return;

        setIsUpdating(true);
        try {
            // Create update data with required fields
            const fullUpdateData: TeamUpdateDTO = {
                name: teamDetails.name,
                description: teamDetails.description ?? '',
                ...updateData
            };

            await updateTeam(teamId, fullUpdateData);

            // Invalidate cache for this team to refresh the data
            try {
                await invalidateTeamCache(teamId, true);
            } catch (cacheError) {
                console.error('Cache invalidation error:', cacheError);
                // Fallback to direct refetch
                await refetch();
            }

            toast({
                title: 'Cập nhật cài đặt thành công',
                description: 'Cài đặt tổ đã được cập nhật',
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: 'Lỗi cập nhật cài đặt',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi cập nhật cài đặt',
                variant: 'destructive',
                duration: 5000,
            });
        } finally {
            setIsUpdating(false);
        }
    }, [teamDetails, teamId, updateTeam, invalidateTeamCache, refetch, isUpdating, isTeamUpdating]);

    // Toggle settings handler
    const handleToggleSetting = useCallback(async (field: string, value: boolean) => {
        const updateData = {
            [field]: value
        };
        await handleSettingUpdate(updateData as Partial<TeamUpdateDTO>);
    }, [handleSettingUpdate]);

    // Navigation handlers
    const handleBack = useCallback(() => {
        router.push(`/teams/${teamId}/view`);
    }, [router, teamId]);

    const handleGoToLeaders = useCallback(() => {
        router.push(`/teams/${teamId}/leaders`);
    }, [router, teamId]);

    const handleGoToMembers = useCallback(() => {
        router.push(`/teams/${teamId}/members`);
    }, [router, teamId]);

    // Determine overall loading state
    const isPageLoading = isLoading || isUpdating || isTeamUpdating || isRefreshing;

    // Error handling
    if (error && !isLoading) {
        return <ErrorState error={error} onBack={handleBack} />;
    }

    return (
        <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) => (
                <ErrorFallback
                    error={error}
                    resetErrorBoundary={() => {
                        handleRefresh();
                        resetErrorBoundary();
                    }}
                />
            )}
        >
            <div className="container mx-auto p-4">
                <PageLoader
                    isLoading={isPageLoading}
                    showTableSkeleton={false}
                >
                    {/* Header with back button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold">Cài đặt tổ</h1>
                                <p className="text-muted-foreground">
                                    {teamDetails?.name} ({teamDetails?.code}) - Dây chuyền: {teamDetails?.lineName || 'Đang tải...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Settings tabs */}
                    <Tabs defaultValue="access" className="w-full">
                        <TabsList>
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
                                    <CardDescription>Quản lý quyền truy cập tổ</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Công khai</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Cho phép tất cả người dùng trong hệ thống xem tổ này
                                                </p>
                                            </div>
                                            <Switch
                                                id="public-access"
                                                disabled={isPageLoading}
                                                onCheckedChange={(checked) => handleToggleSetting('isPublic', checked)}
                                                checked={teamDetails?.isPublic || false}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Giới hạn theo dây chuyền</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Chỉ người dùng thuộc dây chuyền mới có thể xem tổ này
                                                </p>
                                            </div>
                                            <Switch
                                                id="line-limited"
                                                defaultChecked
                                                disabled={isPageLoading}
                                                onCheckedChange={(checked) => handleToggleSetting('isLineLimited', checked)}
                                                checked={teamDetails?.isLineLimited || true}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Giới hạn chỉnh sửa</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Chỉ tổ trưởng mới có thể chỉnh sửa thông tin
                                                </p>
                                            </div>
                                            <Switch
                                                id="edit-limited"
                                                defaultChecked
                                                disabled={isPageLoading}
                                                onCheckedChange={(checked) => handleToggleSetting('isEditLimited', checked)}
                                                checked={teamDetails?.isEditLimited || true}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="mt-6">
                                            <h3 className="font-medium mb-4">Quản lý quyền quản trị</h3>
                                            <Button
                                                variant="outline"
                                                onClick={handleGoToLeaders}
                                                className="w-full justify-start"
                                                disabled={isPageLoading}
                                            >
                                                <UserCog className="mr-2 h-4 w-4" />
                                                Quản lý danh sách tổ trưởng
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
                                    <CardDescription>Quản lý nhân sự làm việc trong tổ</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Thành viên</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Quản lý các thành viên làm việc trong tổ
                                                </p>
                                            </div>
                                            <Button
                                                onClick={handleGoToMembers}
                                                variant="outline"
                                                disabled={isPageLoading}
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                Quản lý thành viên
                                            </Button>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Tự động phân công</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Tự động phân công công việc cho các thành viên trong tổ
                                                </p>
                                            </div>
                                            <Switch
                                                id="auto-assign"
                                                disabled={isPageLoading}
                                                onCheckedChange={(checked) => handleToggleSetting('autoAssign', checked)}
                                                checked={teamDetails?.autoAssign || false}
                                            />
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between py-4">
                                            <div>
                                                <h3 className="font-medium">Thời gian làm việc</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Thiết lập thời gian làm việc của tổ
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push(`/teams/${teamId}/schedule`)}
                                                disabled={isPageLoading}
                                            >
                                                <Activity className="mr-2 h-4 w-4" />
                                                Thiết lập lịch làm việc
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </PageLoader>
            </div>
        </ErrorBoundary>
    );
}