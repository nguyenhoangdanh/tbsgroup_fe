'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PlusIcon, Search, Trash2, RefreshCw, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { DataTable } from "@/components/common/table/data-table";
import { TeamProvider, useTeam } from '@/hooks/teams/TeamContext';
import { useLine } from '@/hooks/line/LineContext';
import { Team, TeamCondDTO } from '@/common/interface/team';
import { toast } from '@/hooks/use-toast';
import { ColumnDef } from "@tanstack/react-table";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { ErrorBoundary } from 'react-error-boundary';
import PageLoader from '@/components/common/Loading/PageLoader';
import { Badge } from '@/components/ui/badge';
import { TeamForm } from '../teams/TeamForm';

interface LineTeamsContainerProps {
    factoryId: string;
    lineId: string;
}

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
    <div className="p-4 border border-red-300 rounded-md bg-red-50">
        <h3 className="text-lg font-semibold text-red-800">Có lỗi xảy ra</h3>
        <p className="text-red-600">{error.message}</p>
        <Button
            variant="outline"
            onClick={resetErrorBoundary}
            className="mt-4"
        >
            Thử lại
        </Button>
    </div>
);

const LineTeamsContainer: React.FC<LineTeamsContainerProps> = ({ factoryId, lineId }) => {
    const router = useRouter();
    const { showDialog } = useDialog();
    const {
        listTeams,
        getTeamsByLine,
        deleteTeam,
        batchDeleteTeams,
        isLoading: isTeamActionLoading,
        isDeleting,
        queries,
        invalidateTeamCache
    } = useTeam();

    // Line context for fetching line details
    const { line } = useLine();
    const { data: lineDetails } = line.getWithDetails(lineId);

    // State management
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Fetch teams for this line with optimized query
    const {
        data: lineTeams = [],
        isLoading: isLoadingTeams,
        error: teamsError,
        refetch: refetchTeams
    } = queries.getTeamsByLineId(lineId, {
        enabled: true,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    // Handle refresh with debounce protection
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await refetchTeams();
            toast({
                title: 'Làm mới dữ liệu',
                description: 'Danh sách tổ đã được cập nhật',
                duration: 2000
            });
        } catch (error) {
            console.error('Error refreshing teams:', error);
            toast({
                title: 'Lỗi làm mới',
                description: 'Không thể làm mới danh sách tổ',
                variant: 'destructive'
            });
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchTeams, isRefreshing]);

    // Create a new team
    const handleCreateTeam = useCallback(() => {
        setIsProcessing(true);

        showDialog({
            title: 'Thêm tổ mới',
            type: DialogType.CREATE,
            children: () => (
                <TeamProvider>
                    <TeamForm
                        lineId={lineId}
                        onSuccess={async (teamId) => {
                            await invalidateTeamCache(teamId);
                            await refetchTeams();
                            setIsProcessing(false);
                            toast({
                                title: 'Thêm tổ thành công',
                                description: 'Tổ mới đã được tạo',
                                duration: 2000
                            });
                        }}
                        onCancel={() => setIsProcessing(false)}
                    />
                </TeamProvider>
            ),
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [lineId, showDialog, invalidateTeamCache, refetchTeams]);

    // Edit an existing team
    const handleEditTeam = useCallback((team: Team) => {
        setIsProcessing(true);

        showDialog({
            title: 'Cập nhật tổ',
            type: DialogType.EDIT,
            data: team,
            children: () => (
                <TeamProvider>
                    <TeamForm
                        teamId={team.id}
                        lineId={lineId}
                        onSuccess={async (teamId) => {
                            await invalidateTeamCache(teamId);
                            await refetchTeams();
                            setIsProcessing(false);
                            toast({
                                title: 'Cập nhật tổ thành công',
                                description: `Tổ "${team.name}" đã được cập nhật`,
                                duration: 2000
                            });
                        }}
                        onCancel={() => setIsProcessing(false)}
                    />
                </TeamProvider>
            ),
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [lineId, showDialog, invalidateTeamCache, refetchTeams]);

    // Delete a team with confirmation
    const handleDeleteTeam = useCallback((teamId: string) => {
        const teamName = lineTeams.find(t => t.id === teamId)?.name || 'tổ này';

        setIsProcessing(true);

        showDialog({
            title: 'Xác nhận xóa tổ',
            description: `Bạn có chắc chắn muốn xóa ${teamName}? Thao tác này không thể hoàn tác.`,
            type: DialogType.DELETE,
            onSubmit: async () => {
                try {
                    await deleteTeam(teamId);
                    await refetchTeams();

                    // Clear selection if it contains the deleted team
                    setSelectedTeams(prev => {
                        const newSelected = new Set(prev);
                        newSelected.delete(teamId);
                        return newSelected;
                    });

                    toast({
                        title: 'Xóa tổ thành công',
                        description: 'Tổ đã được xóa khỏi hệ thống',
                        duration: 2000
                    });

                    setIsProcessing(false);
                    return true;
                } catch (error) {
                    toast({
                        title: 'Lỗi xóa tổ',
                        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tổ',
                        variant: 'destructive',
                        duration: 3000
                    });
                    setIsProcessing(false);
                    return false;
                }
            },
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [lineTeams, deleteTeam, showDialog, refetchTeams]);

    // Batch delete teams
    const handleBatchDeleteTeams = useCallback(() => {
        if (selectedTeams.size === 0) {
            toast({
                title: 'Cảnh báo',
                description: 'Vui lòng chọn ít nhất một tổ để xóa',
                variant: 'destructive',
            });
            return;
        }

        setIsProcessing(true);

        showDialog({
            title: 'Xác nhận xóa tổ',
            description: `Bạn có chắc chắn muốn xóa ${selectedTeams.size} tổ đã chọn? Thao tác này không thể hoàn tác.`,
            type: DialogType.DELETE,
            onSubmit: async () => {
                try {
                    const teamIds = Array.from(selectedTeams);
                    await batchDeleteTeams(teamIds);
                    await refetchTeams();

                    setSelectedTeams(new Set());

                    toast({
                        title: 'Xóa tổ thành công',
                        description: `Đã xóa ${teamIds.length} tổ`,
                        duration: 2000
                    });

                    setIsProcessing(false);
                    return true;
                } catch (error) {
                    toast({
                        title: 'Lỗi xóa tổ',
                        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tổ',
                        variant: 'destructive',
                        duration: 3000
                    });
                    setIsProcessing(false);
                    return false;
                }
            },
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [selectedTeams, batchDeleteTeams, showDialog, refetchTeams]);

    // View team details - Navigate to the team details page within the line structure
    const handleViewTeam = useCallback((teamId: string) => {
        router.push(`/admin/factories/${factoryId}/lines/${lineId}/teams/${teamId}`);
    }, [router, factoryId, lineId]);

    // Table column definitions
    const columns = useMemo<ColumnDef<Team>[]>(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                    className="w-4 h-4"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                    className="w-4 h-4"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 50
        },
        {
            accessorKey: 'code',
            header: 'Mã tổ',
            cell: ({ row }) => <div>{row.original.code}</div>
        },
        {
            accessorKey: 'name',
            header: 'Tên tổ',
            cell: ({ row }) => (
                <div className="font-medium hover:underline cursor-pointer" onClick={() => handleViewTeam(row.original.id)}>
                    {row.original.name}
                </div>
            )
        },
        {
            accessorKey: 'leaders',
            header: 'Tổ trưởng',
            cell: ({ row }) => {
                const team = row.original;
                const primaryLeader = team.leaders?.find(leader => leader.isPrimary);
                return primaryLeader ? (
                    <div>
                        {primaryLeader.user?.fullName || 'Tổ trưởng'}
                        <Badge variant="outline" className="ml-2">Tổ trưởng</Badge>
                    </div>
                ) : (
                    <span className="text-muted-foreground">(Chưa có)</span>
                );
            }
        }
    ], [handleViewTeam]);

    // Handle row actions for DataTable
    const rowActions = useCallback((row: Team) => [
        {
            label: 'Xem chi tiết',
            onClick: () => handleViewTeam(row.id),
            icon: 'eye',
        },
        {
            label: 'Chỉnh sửa',
            onClick: () => handleEditTeam(row),
            icon: 'edit',
        },
        {
            label: 'Xóa',
            onClick: () => handleDeleteTeam(row.id),
            icon: 'trash',
            variant: 'destructive',
        },
    ], [handleViewTeam, handleEditTeam, handleDeleteTeam]);

    // Handle search
    const handleSearch = useCallback(() => {
        // This would be implemented for server-side search
        // For now, we'll use client-side filtering
    }, []);

    // Navigation to go back to line details
    const handleBack = useCallback(() => {
        router.push(`/admin/factories/${factoryId}/lines/${lineId}`);
    }, [router, factoryId, lineId]);

    // Determine loading state
    const isLoading = isLoadingTeams || isTeamActionLoading || isRefreshing || isProcessing;

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
                {/* Header with back button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Quản lý tổ</h1>
                            <p className="text-muted-foreground">
                                Dây chuyền: {lineDetails?.name || lineId}
                            </p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Danh sách tổ</CardTitle>
                            <CardDescription>Các tổ thuộc dây chuyền {lineDetails?.name}</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                onClick={handleCreateTeam}
                                variant="default"
                                disabled={isLoading}
                            >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Thêm tổ mới
                            </Button>
                            {selectedTeams.size > 0 && (
                                <Button
                                    variant="destructive"
                                    onClick={handleBatchDeleteTeams}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Xóa ({selectedTeams.size})
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm tổ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleSearch}
                                className="ml-2"
                                disabled={isLoading}
                            >
                                Tìm kiếm
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleRefresh}
                                className="ml-2"
                                title="Làm mới"
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        <PageLoader
                            isLoading={isLoading}
                            showTableSkeleton={true}
                            skeletonColumns={4}
                            skeletonRows={5}
                        >
                            <DataTable
                                columns={columns}
                                title='Danh sách tổ'
                                data={lineTeams}
                                searchColumn='name'
                                searchPlaceholder='Tìm kiếm tổ...'
                            />
                        </PageLoader>
                    </CardContent>
                </Card>
            </div>
        </ErrorBoundary>
    );
};

export default LineTeamsContainer;