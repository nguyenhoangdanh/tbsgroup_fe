import { ColumnDef } from '@tanstack/react-table';
import React, { useCallback, useState, useMemo } from 'react';
import { toast } from 'react-toast-kit';

import { TeamForm } from '../teams/TeamForm';

import { Team } from '@/common/interface/team';
import { DataTable } from '@/components/common/table/data-table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogType, useDialog } from '@/contexts/DialogProvider';
import { TeamProvider, useTeam } from '@/hooks/teams/TeamContext';

interface LineTeamsTabProps {
  factoryId: string;
  lineId: string;
  canManage: boolean;
}

export const LineTeamsTab: React.FC<LineTeamsTabProps> = ({ lineId, canManage }) => {
  const { showDialog, hideDialog } = useDialog();
  const {
    deleteTeam,
    batchDeleteTeams,
    isLoading: isTeamActionLoading,
    queries,
    invalidateTeamCache,
  } = useTeam();

  // const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: lineTeams = [],
    isLoading: isLoadingTeams,
    refetch: refetchTeams,
  } = queries.getTeamsByLineId(lineId, {
    enabled: true,
    refetchOnWindowFocus: false,
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
        duration: 2000,
      });
    } catch (error) {
      console.error('Error refreshing teams:', error);
      toast({
        title: 'Lỗi làm mới',
        description: 'Không thể làm mới danh sách tổ',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchTeams, isRefreshing]);

  // Handle create team - tương thích với DataTable
  const handleCreateTeam = useCallback(() => {
    showDialog({
      title: 'Thêm tổ mới',
      type: DialogType.CREATE,
      children: () => (
        <TeamProvider>
          <TeamForm
            lineId={lineId}
            onSuccess={async teamId => {
              try {
                await Promise.all([invalidateTeamCache(teamId), refetchTeams()]);
              } catch (error) {
                console.error('Error after team creation:', error);
              } finally {
                setIsProcessing(false);
                hideDialog();
              }
            }}
          />
        </TeamProvider>
      ),
    });
  }, [lineId, showDialog, hideDialog, invalidateTeamCache, refetchTeams]);

  //Handle edit team - tương thích với DataTable
  const handleEditTeam = useCallback(
    (team: Team) => {
      showDialog({
        title: 'Cập nhật tổ',
        type: DialogType.EDIT,
        data: team,
        children: () => (
          <TeamProvider>
            <TeamForm
              teamId={team.id}
              lineId={lineId}
              onSuccess={async teamId => {
                try {
                  await Promise.all([invalidateTeamCache(teamId), refetchTeams()]);
                } catch (error) {
                  console.error('Error after team update:', error);
                } finally {
                  hideDialog();
                }
              }}
            />
          </TeamProvider>
        ),
        onClose: () => {
          setIsProcessing(false);
        },
      });
    },
    [lineId, showDialog, hideDialog, invalidateTeamCache, refetchTeams],
  );

  // Xử lý xóa một tổ - tạo hàm async để phù hợp với interface của DataTable
  const handleDeleteTeam = useCallback(
    async (id: string) => {
      const teamName = lineTeams.find(t => t.id === id)?.name || 'tổ này';

      return new Promise<void>((resolve, reject) => {
        showDialog({
          title: 'Xác nhận xóa tổ',
          description: `Bạn có chắc chắn muốn xóa ${teamName}? Thao tác này không thể hoàn tác.`,
          type: DialogType.DELETE,
          onSubmit: async () => {
            try {
              await deleteTeam(id);
              await refetchTeams();

              // Clear selection if it contains the deleted team
              // setSelectedTeams(prev => {
              //   const newSelected = new Set(prev);
              //   newSelected.delete(id);
              //   return newSelected;
              // });

              toast({
                title: 'Xóa tổ thành công',
                description: 'Tổ đã được xóa khỏi hệ thống',
                duration: 2000,
              });

              resolve();
              return true;
            } catch (error) {
              toast({
                title: 'Lỗi xóa tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tổ',
                variant: 'error',
                duration: 3000,
              });

              reject(error);
              return false;
            }
          },
          onClose: () => {
            reject(new Error('User cancelled'));
          },
        });
      });
    },
    [lineTeams, deleteTeam, showDialog, refetchTeams],
  );

  //  Handle batch delete - tương thích với DataTable
  const handleBatchDeleteTeams = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) {
        toast({
          title: 'Cảnh báo',
          description: 'Không có tổ nào được chọn để xóa',
          variant: 'error',
        });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        showDialog({
          title: 'Xác nhận xóa nhiều tổ',
          description: `Bạn có chắc chắn muốn xóa ${ids.length} tổ đã chọn? Thao tác này không thể hoàn tác.`,
          type: DialogType.DELETE,
          onSubmit: async () => {
            try {
              await batchDeleteTeams(ids);
              await refetchTeams();

              // setSelectedTeams(new Set());

              toast({
                title: 'Xóa tổ thành công',
                description: `Đã xóa ${ids.length} tổ`,
                duration: 2000,
              });

              resolve();
              return true;
            } catch (error) {
              toast({
                title: 'Lỗi xóa tổ',
                description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa tổ',
                variant: 'error',
                duration: 3000,
              });

              reject(error);
              return false;
            }
          },
          onClose: () => {
            reject(new Error('User cancelled'));
          },
        });
      });
    },
    [batchDeleteTeams, showDialog, refetchTeams],
  );

  // View team details - Navigate to the team details page
  // const handleViewTeam = useCallback(
  //   (team: Team) => {
  //     router.push(`/admin/factories/${factoryId}/lines/${lineId}/teams/${team.id}`);
  //   },
  //   [router, factoryId, lineId],
  // );

  // Table column definitions
  const columns = useMemo<ColumnDef<Team>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã tổ',
        cell: ({ row }) => <div>{row.original.code}</div>,
      },
      {
        accessorKey: 'name',
        header: 'Tên tổ',
        cell: ({ row }) => (
          <div className="font-medium hover:underline cursor-pointer">{row.original.name}</div>
        ),
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
              <Badge variant="outline" className="ml-2">
                Tổ trưởng
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">(Chưa có)</span>
          );
        },
      },
    ],
    [],
  );

  // Determine loading state
  const isLoading = isLoadingTeams || isTeamActionLoading || isRefreshing || isProcessing;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý tổ sản xuất</CardTitle>
        <CardDescription>Danh sách các tổ trong dây chuyền</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          title="Danh sách tổ"
          description="Danh sách các tổ trong dây chuyền"
          columns={columns}
          data={lineTeams}
          actions={canManage ? ['create', 'edit', 'delete'] : []}
          createClickAction={handleCreateTeam}
          editClickAction={handleEditTeam}
          onEdit={handleEditTeam}
          onDelete={handleDeleteTeam}
          onBatchDelete={handleBatchDeleteTeams}
          // onSelected={ids => setSelectedTeams(new Set(ids))}
          searchColumn="name"
          searchPlaceholder="Tìm kiếm tổ..."
          refetchData={handleRefresh}
          isLoading={isLoading}
          exportData={false}
          initialPageSize={10}
          disablePagination={lineTeams.length <= 10}
        />
      </CardContent>
    </Card>
  );
};

export default LineTeamsTab;
