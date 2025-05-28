import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback } from 'react';
import { toast } from 'react-toast-kit';

import LineForm from '../lines/LineForm';

import { Line } from '@/common/interface/line';
import { DataTable } from '@/components/common/table/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DialogType, useDialog } from '@/contexts/DialogProvider';
import { useFactoryQueries } from '@/hooks/factory/useFactoryQueries';
import { useLineMutations } from '@/hooks/line/useLineMutations';
import { useLineQueries } from '@/hooks/line/useLineQueries';

interface FactoryLinesProps {
  factoryId: string;
}

const FactoryLines: React.FC<FactoryLinesProps> = ({ factoryId }) => {
  const router = useRouter();
  const { showDialog } = useDialog();
  const [activeTab, setActiveTab] = useState('lines');

  //Factory data queries
  const { getFactoryById } = useFactoryQueries();
  const { data: factory, isLoading: isLoadingFactory } = getFactoryById(factoryId, {
    enabled: true,
  });

  // Line queries
  const { getLinesByFactoryId } = useLineQueries();
  const {
    data: lines,
    isLoading: isLoadingLines,
    refetch: refetchLines,
  } = getLinesByFactoryId(factoryId, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  //  Line mutations
  const { deleteLineMutation } = useLineMutations();

  // Navigate back to factory list
  const handleBack = useCallback(() => {
    router.push(`/admin/factories/${factoryId}`);
  }, [router, factoryId]);

  // Create a new line
  const handleCreateLine = useCallback(() => {
    if (!factory) return;

    showDialog({
      title: 'Thêm dây chuyền sản xuất',
      type: DialogType.CREATE,
      data: null,
      children: () => (
        <LineForm
          factoryId={factoryId}
          factory={factory}
          onSuccess={() => {
            refetchLines();
          }}
        />
      ),
    });
  }, [factory, factoryId, refetchLines, showDialog]);

  // Edit a line
  const handleEditLine = useCallback(
    (line: Line) => {
      if (!factory) return;

      showDialog({
        title: 'Cập nhật dây chuyền sản xuất',
        type: DialogType.EDIT,
        data: line,
        children: () => (
          <LineForm
            factoryId={factoryId}
            factory={factory}
            line={line}
            onSuccess={() => {
              refetchLines();
            }}
          />
        ),
      });
    },
    [factory, factoryId, refetchLines, showDialog],
  );

  // Delete a line
  const handleDeleteLine = useCallback(
    (lineId: string) => {
      showDialog({
        title: 'Xác nhận xóa dây chuyền',
        description:
          'Bạn có chắc chắn muốn xóa dây chuyền này không? Thao tác này không thể hoàn tác.',
        type: DialogType.DELETE,
        data: { lineId },
        onSubmit: async data => {
          try {
            await deleteLineMutation.mutateAsync(String(data.lineId));

            toast({
              title: 'Xóa dây chuyền thành công',
              description: 'Dây chuyền đã được xóa khỏi hệ thống',
              duration: 3000,
            });

            refetchLines();
            return true;
          } catch (error) {
            toast({
              title: 'Lỗi xóa dây chuyền',
              description:
                error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa dây chuyền',
              variant: 'error',
              duration: 5000,
            });
            return false;
          }
        },
      });
    },
    [deleteLineMutation, refetchLines, showDialog],
  );

  const columns: ColumnDef<Line>[] = [
    {
      id: 'code',
      header: 'Mã dây chuyền',
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
      accessorKey: 'code',
    },
    {
      id: 'name',
      header: 'Tên dây chuyền',
      cell: ({ row }) => row.original.name,
      accessorKey: 'name',
    },
    {
      id: 'description',
      header: 'Mô tả',
      cell: ({ row }) => row.original.description || '-',
      accessorKey: 'description',
    },
    {
      id: 'capacity',
      header: 'Công suất',
      cell: ({ row }) => (row.original.capacity ? `${row.original.capacity} sản phẩm/ngày` : '-'),
      accessorKey: 'capacity',
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const status = row.original.status;
        let badgeVariant = 'default';
        let statusText = 'Không xác định';

        switch (status) {
          case 'ACTIVE':
            badgeVariant = 'success';
            statusText = 'Hoạt động';
            break;
          case 'INACTIVE':
            badgeVariant = 'secondary';
            statusText = 'Tạm dừng';
            break;
          case 'MAINTENANCE':
            badgeVariant = 'warning';
            statusText = 'Bảo trì';
            break;
        }

        return <Badge variant={badgeVariant as any}>{statusText}</Badge>;
      },
      accessorKey: 'status',
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const line = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/factories/${factoryId}/lines/${line.id}/settings`)}
            >
              <Settings className="mr-1 h-4 w-4" />
              Cài đặt
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEditLine(line)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteLine(line.id)}
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoadingFactory) {
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

  if (!factory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lỗi tải dữ liệu</CardTitle>
          <CardDescription>Không thể tải thông tin nhà máy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">Không tìm thấy nhà máy với ID đã cung cấp</div>
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
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {factory.name}
              <Badge>{factory.code}</Badge>
            </h1>
            <p className="text-muted-foreground">Quản lý dây chuyền sản xuất</p>
          </div>
        </div>
        <div>
          <Button onClick={handleCreateLine}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm dây chuyền
          </Button>
        </div>
      </div>

      <Tabs defaultValue="lines" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="lines">Danh sách dây chuyền</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="lines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dây chuyền sản xuất</CardTitle>
              <CardDescription>
                Quản lý các dây chuyền sản xuất của nhà máy {factory.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                title="Danh sách dây chuyền"
                columns={columns}
                data={lines || []}
                isLoading={isLoadingLines}
                searchColumn="name"
                searchPlaceholder="Tìm kiếm theo tên dây chuyền"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê dây chuyền</CardTitle>
              <CardDescription>Tổng quan về các dây chuyền sản xuất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Tổng số dây chuyền
                  </h3>
                  <p className="text-3xl font-bold">{lines?.length || 0}</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Đang hoạt động</h3>
                  <p className="text-3xl font-bold">
                    {lines?.filter(line => line.status === 'ACTIVE').length || 0}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Đang bảo trì</h3>
                  <p className="text-3xl font-bold">
                    {lines?.filter(line => line.status === 'MAINTENANCE').length || 0}
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-medium mb-4">Công suất theo dây chuyền</h3>
                {lines && lines.length > 0 ? (
                  <div className="space-y-4">
                    {lines.map(line => (
                      <div key={line.id} className="flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{line.name}</span>
                          <span>{line.capacity || 0} sản phẩm/ngày</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5">
                          <div
                            className="bg-primary rounded-full h-2.5"
                            style={{
                              width: `${Math.min(100, (line.capacity || 0) / 10)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Chưa có dữ liệu dây chuyền</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FactoryLines;
