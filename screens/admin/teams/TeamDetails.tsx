"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TeamProvider, useTeam } from '@/hooks/teams/TeamContext';
import { useLine } from '@/hooks/line/LineContext'; // Added for line context access
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Users,
    ArrowLeft,
    Edit,
    Trash2,
    Settings,
    Factory
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Team, TeamLeader, TeamLeaderDTO } from '@/common/interface/team';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TeamManagersTable } from './TeamLeadersTable';
import { useUserQueries } from '@/hooks/users';
import { ErrorBoundary } from 'react-error-boundary';
import PageLoader from '@/components/common/loading/PageLoader';
import { DialogType, useDialog } from '@/context/DialogProvider';
import TeamManagerForm from './TeamManagerForm';
import { toast } from '@/hooks/use-toast';
import { TeamForm } from './TeamForm';

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <Card>
        <CardHeader>
            <CardTitle>Lỗi</CardTitle>
            <CardDescription>Đã xảy ra lỗi khi hiển thị chi tiết tổ</CardDescription>
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

// Error State Component
const ErrorState = ({ error, onBack }: { error: unknown, onBack: () => void }) => (
    <Card>
        <CardHeader>
            <CardTitle>Lỗi tải dữ liệu</CardTitle>
            <CardDescription>Không thể tải thông tin tổ</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-destructive">
                {error instanceof Error ? error.message : 'Đã xảy ra lỗi khi tải thông tin tổ'}
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

interface TeamDetailsProps {
    params: {
        teamId: string;
        lineId?: string;
        factoryId?: string;
    };
}

export default function TeamDetails({ params }: TeamDetailsProps) {
    const router = useRouter();
    const { teamId } = params;
    // Use URL params or handle undefined gracefully
    const lineId = params.lineId;
    const factoryId = params.factoryId;

    const { showDialog, hideDialog } = useDialog();
    const {
        getTeamWithDetails,
        deleteTeam,
        removeTeamLeader,
        isLoading: isTeamActionLoading,
        invalidateTeamCache,
        queries
    } = useTeam();

    // Line context for fetching line details if needed
    const { line } = useLine();

    // Fetch users for manager selection
    const { getAllUsers } = useUserQueries();
    const { data: users = [], isLoading: isLoadingUsers } = getAllUsers;

    // Use query directly for refetch capability
    const {
        data: teamDetails,
        isLoading: isLoadingTeam,
        error: teamError,
        refetch: refetchTeam
    } = queries.getTeamWithDetails(teamId, {
        enabled: true,
        refetchOnWindowFocus: false,
    });

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Get the line information for this team if needed
    useEffect(() => {
        // If we already have lineId from params, we don't need to fetch it
        if (!lineId && teamDetails?.lineId) {
            // We could fetch line details here if needed
        }
    }, [lineId, teamDetails]);

    // Memoize leaders data
    const leaders = useMemo(() =>
        teamDetails?.leaders || [],
        [teamDetails?.leaders]
    );

    // Handle refresh with debounce protection
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await refetchTeam();
            await invalidateTeamCache(teamId, true);

            toast({
                title: 'Làm mới dữ liệu',
                description: 'Thông tin tổ đã được cập nhật',
                duration: 2000
            });
        } catch (error) {
            console.error('Error refreshing team details:', error);
            toast({
                title: 'Lỗi làm mới',
                description: 'Không thể làm mới thông tin tổ',
                variant: 'destructive'
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchTeam, invalidateTeamCache, teamId, isRefreshing]);

    // Handle back button navigation
    const handleBack = useCallback(() => {
        if (lineId && factoryId) {
            // Navigate back to the line's teams view if we have lineId and factoryId
            router.push(`/admin/factories/${factoryId}/lines/${lineId}/teams`);
        } else if (teamDetails?.lineId) {
            // If we have the team's lineId from API data
            router.push(`/teams?lineId=${teamDetails.lineId}`);
        } else {
            // Fallback to generic teams list
            router.push(`/teams`);
        }
    }, [router, lineId, factoryId, teamDetails?.lineId]);

    // Handle edit team
    const handleEdit = useCallback(() => {
        if (!teamDetails) return;

        setIsProcessing(true);

        showDialog({
            title: 'Cập nhật thông tin tổ',
            type: DialogType.EDIT,
            data: teamDetails,
            children: () => (
                <TeamProvider>
                    <TeamForm
                        teamId={teamId}
                        lineId={teamDetails.lineId || ''}
                        onSuccess={async () => {
                            await invalidateTeamCache(teamId, true);
                            await refetchTeam();

                            toast({
                                title: 'Cập nhật tổ thành công',
                                description: 'Thông tin tổ đã được cập nhật',
                                duration: 2000
                            });

                            setIsProcessing(false);
                            hideDialog();
                        }}
                        onCancel={() => {
                            setIsProcessing(false);
                            hideDialog();
                        }}
                    />
                </TeamProvider>
            ),
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [teamDetails, teamId, showDialog, invalidateTeamCache, refetchTeam, hideDialog]);

    // Handle settings navigation
    const handleSettings = useCallback(() => {
        router.push(`/teams/${teamId}/settings`);
    }, [router, teamId]);

    // Handle delete confirmation
    const handleDeleteClick = useCallback(() => {
        setConfirmDelete(true);
    }, []);

    // Execute team deletion
    const executeDelete = useCallback(async () => {
        try {
            const success = await deleteTeam(teamId);
            if (success) {
                if (lineId && factoryId) {
                    // Navigate back to the line's teams view if we have lineId and factoryId
                    router.push(`/admin/factories/${factoryId}/lines/${lineId}/teams`);
                } else {
                    router.push('/teams');
                }

                toast({
                    title: 'Xóa tổ thành công',
                    description: `Tổ "${teamDetails?.name}" đã được xóa`,
                    duration: 2000
                });
            }
        } catch (error) {
            console.error('Error deleting team:', error);
            toast({
                title: 'Lỗi xóa tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tổ',
                variant: 'destructive'
            });
        } finally {
            setConfirmDelete(false);
        }
    }, [deleteTeam, teamId, router, teamDetails?.name, lineId, factoryId]);

    // Handle add leader
    const handleAddLeader = useCallback(() => {
        setIsProcessing(true);

        showDialog({
            title: 'Thêm tổ trưởng mới',
            type: DialogType.CREATE,
            children: () => (
                <TeamManagerForm
                    teamId={teamId}
                    users={users}
                    onSuccess={async () => {
                        await invalidateTeamCache(teamId, true);
                        await refetchTeam();

                        toast({
                            title: 'Thêm tổ trưởng thành công',
                            description: 'Tổ trưởng mới đã được thêm vào tổ',
                            duration: 2000
                        });

                        setIsProcessing(false);
                        hideDialog();
                    }}
                    onCancel={() => {
                        setIsProcessing(false);
                        hideDialog();
                    }}
                />
            ),
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [teamId, users, showDialog, invalidateTeamCache, refetchTeam, hideDialog]);

    // Handle edit leader
    const handleEditLeader = useCallback((leader: TeamLeader) => {
        setIsProcessing(true);

        showDialog({
            title: 'Cập nhật thông tin tổ trưởng',
            type: DialogType.EDIT,
            data: leader,
            children: () => (
                <TeamManagerForm
                    teamId={teamId}
                    users={users}
                    manager={leader}
                    onSuccess={async () => {
                        await invalidateTeamCache(teamId, true);
                        await refetchTeam();

                        toast({
                            title: 'Cập nhật tổ trưởng thành công',
                            description: 'Thông tin tổ trưởng đã được cập nhật',
                            duration: 2000
                        });

                        setIsProcessing(false);
                        hideDialog();
                    }}
                    onCancel={() => {
                        setIsProcessing(false);
                        hideDialog();
                    }}
                />
            ),
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [teamId, users, showDialog, invalidateTeamCache, refetchTeam, hideDialog]);

    // Handle remove leader
    const handleRemoveLeader = useCallback((userId: string) => {
        const leaderName = leaders.find(l => l.userId === userId)?.user?.fullName || userId;

        setIsProcessing(true);

        showDialog({
            title: 'Xác nhận xóa tổ trưởng',
            description: `Bạn có chắc chắn muốn xóa tổ trưởng ${leaderName} khỏi tổ không?`,
            type: DialogType.DELETE,
            data: { userId },
            onSubmit: async () => {
                try {
                    await removeTeamLeader(teamId, userId);
                    await invalidateTeamCache(teamId, true);
                    await refetchTeam();

                    toast({
                        title: 'Xóa tổ trưởng thành công',
                        description: 'Tổ trưởng đã được xóa khỏi tổ',
                        duration: 2000
                    });

                    setIsProcessing(false);
                    return true;
                } catch (error) {
                    toast({
                        title: 'Lỗi xóa tổ trưởng',
                        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tổ trưởng',
                        variant: 'destructive'
                    });
                    setIsProcessing(false);
                    return false;
                }
            },
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [leaders, teamId, showDialog, removeTeamLeader, invalidateTeamCache, refetchTeam]);

    // Determine overall loading state
    const isLoading = isLoadingTeam || isLoadingUsers || isTeamActionLoading || isRefreshing || isProcessing;

    // React to error states
    if (teamError && !isLoadingTeam) {
        return <ErrorState error={teamError} onBack={handleBack} />;
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
            <PageLoader
                isLoading={isLoading}
                showTableSkeleton={true}
                skeletonColumns={3}
                skeletonRows={5}
            >
                <div className="container mx-auto p-4">
                    {/* Header with actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-2">
                                    {teamDetails?.name}
                                    {teamDetails?.code && <Badge>{teamDetails.code}</Badge>}
                                </h1>
                                <p className="text-muted-foreground">
                                    Dây chuyền: {teamDetails?.lineName || teamDetails?.lineId || 'Chưa xác định'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleEdit} disabled={isLoading}>
                                <Edit className="mr-2 h-4 w-4" />
                                Chỉnh sửa
                            </Button>
                            <Button variant="outline" onClick={handleSettings} disabled={isLoading}>
                                <Settings className="mr-2 h-4 w-4" />
                                Cài đặt
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteClick} disabled={isLoading}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                            </Button>
                        </div>
                    </div>

                    {/* Team details tabs */}
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList>
                            <TabsTrigger value="general">
                                <Factory className="mr-2 h-4 w-4" />
                                Thông tin chung
                            </TabsTrigger>
                            <TabsTrigger value="leaders">
                                <Users className="mr-2 h-4 w-4" />
                                Tổ trưởng ({leaders.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* General information tab */}
                        <TabsContent value="general" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin tổ</CardTitle>
                                    <CardDescription>Chi tiết về tổ {teamDetails?.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">Mã tổ</h3>
                                            <p className="font-medium">{teamDetails?.code}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">Tên tổ</h3>
                                            <p className="font-medium">{teamDetails?.name}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">Dây chuyền sản xuất</h3>
                                            <p className="font-medium">{teamDetails?.lineName || teamDetails?.lineId || 'Chưa xác định'}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-sm font-medium text-muted-foreground">Ngày tạo</h3>
                                            <p className="font-medium">
                                                {teamDetails?.createdAt ? new Date(teamDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">Mô tả</h3>
                                        <p className="text-sm">{teamDetails?.description || 'Không có mô tả'}</p>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">Thời gian cập nhật</h3>
                                        <p className="text-sm">
                                            {teamDetails?.updatedAt ? new Date(teamDetails.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Team Leaders tab */}
                        <TabsContent value="leaders" className="space-y-4">
                            <TeamManagersTable
                                teamId={teamId}
                                leaders={leaders}
                                users={users}
                                canManage={true}
                                isLoading={isLoading}
                                onAddManager={handleAddLeader}
                                onEditManager={handleEditLeader}
                                onDeleteManager={handleRemoveLeader}
                                onRefresh={handleRefresh}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Confirm Delete Dialog */}
                    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Xóa tổ</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa tổ "{teamDetails?.name}"? Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={executeDelete}
                                    className="bg-destructive text-destructive-foreground"
                                >
                                    {isLoading ? 'Đang xóa...' : 'Xóa'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </PageLoader>
        </ErrorBoundary>
    );
}