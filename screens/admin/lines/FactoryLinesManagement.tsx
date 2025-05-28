import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'react-toast-kit';

import LineForm from './LineForm';
import LinesList, { LoadingSpinner, ErrorAlert } from './LinesList';

import { Line } from '@/common/interface/line';
import { Button } from '@/components/ui/button';
import { DialogType, useDialog } from '@/contexts/DialogProvider';
import { useFactoryQueries } from '@/hooks/factory/useFactoryQueries';
import { useLine } from '@/hooks/line/LineContext';

interface FactoryLinesManagementProps {
  factoryId: string;
}

const ErrorFallback = ({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <div className="p-4 border border-red-300 rounded-md bg-red-50">
    <h3 className="text-lg font-semibold text-red-800">Có lỗi xảy ra</h3>
    <p className="text-red-600">{error.message}</p>
    <Button variant="outline" onClick={resetErrorBoundary} className="mt-4">
      Thử lại
    </Button>
  </div>
);

export const FactoryLinesManagement: React.FC<FactoryLinesManagementProps> = ({ factoryId }) => {
  const router = useRouter();
  const { showDialog } = useDialog();
  const { line: lineQueries, mutations, cache } = useLine();
  const factoryQueries = useFactoryQueries();
  const [isRefetching, setIsRefetching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch lines for this factory with optimized query config
  const {
    data: lines,
    isLoading: isLoadingLines,
    error: linesError,
    refetch: refetchLines,
  } = lineQueries.getByFactory(factoryId, {
    enabled: true,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch factory details with minimal data
  const {
    data: factory,
    isLoading: isLoadingFactory,
    error: factoryError,
  } = factoryQueries.getFactoryWithDetails(factoryId, {
    includeManagers: false,
    // refetchOnWindowFocus: false,
  });

  //  Refetch handler with debounce protection
  const handleRefetch = useCallback(async () => {
    if (isRefetching) return;

    setIsRefetching(true);
    try {
      await refetchLines();
    } catch (error) {
      console.error('Error refetching lines:', error);
    } finally {
      setIsRefetching(false);
    }
  }, [refetchLines, isRefetching]);

  // Invalidate caches with error handling
  const invalidateCache = useCallback(
    async (lineId?: string) => {
      try {
        if (lineId) {
          await cache.invalidateDetails(lineId, { forceRefetch: true });
        }
        await cache.prefetchByFactory(factoryId);
      } catch (error) {
        console.error('Cache invalidation error:', error);
        // Fallback to direct refetch
        await handleRefetch();
      }
    },
    [cache, factoryId, handleRefetch],
  );

  //  Create a new line
  const handleCreateLine = useCallback(() => {
    if (!factory) return;
    setIsProcessing(true);

    showDialog({
      title: 'Thêm dây chuyền sản xuất',
      type: DialogType.CREATE,
      children: () => (
        <LineForm
          factoryId={factoryId}
          factory={factory}
          onSuccess={async () => {
            await invalidateCache();
            setIsProcessing(false);
          }}
        />
      ),
    });
  }, [factory, factoryId, invalidateCache, showDialog]);

  // Edit an existing line
  const handleEditLine = useCallback(
    (line: Line) => {
      if (!factory) return;
      setIsProcessing(true);
      showDialog({
        title: 'Cập nhật dây chuyền sản xuất',
        type: DialogType.EDIT,
        data: line,
        children: () => (
          <LineForm
            factoryId={factoryId}
            factory={factory}
            line={line}
            onSuccess={async () => {
              if (line.id) {
                await invalidateCache(line.id);
              }
            }}
          />
        ),
      });
    },
    [factory, factoryId, invalidateCache, showDialog],
  );

  // Delete a line with optimistic updates
  const handleDeleteLine = useCallback(
    (lineId: string) => {
      const lineName = lines?.find(l => l.id === lineId)?.name || 'dây chuyền này';
      setIsProcessing(true);
      showDialog({
        title: 'Xác nhận xóa dây chuyền',
        description: `Bạn có chắc chắn muốn xóa ${lineName}? Thao tác này không thể hoàn tác.`,
        type: DialogType.DELETE,
        onSubmit: async () => {
          try {
            //  Optimistic update - remove from UI first
            const updatedLines = lines?.filter(l => l.id !== lineId) || [];
            // Optional: Update local cache/state here if you implement optimistic UI

            await mutations.delete(lineId);

            // Invalidate caches after successful deletion
            await invalidateCache();

            toast({
              title: 'Xóa dây chuyền thành công',
              description: 'Dây chuyền đã được xóa khỏi hệ thống',
              duration: 2000,
            });

            return true;
          } catch (error) {
            //  Rollback optimistic update if needed
            await handleRefetch();

            toast({
              title: 'Lỗi xóa dây chuyền',
              description:
                error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa dây chuyền',
              variant: 'error',
              duration: 3000,
            });
            return false;
          }
        },
      });
    },
    [lines, mutations.delete, showDialog, invalidateCache, handleRefetch],
  );

  // Select a line to view details
  const handleLineSelect = useCallback(
    (lineId: string) => {
      router.push(`/admin/factories/${factoryId}/lines/${lineId}`);
    },
    [router, factoryId],
  );

  // Memoize factory name for consistent rendering
  const factoryName = useMemo(() => factory?.name || 'Nhà máy', [factory]);

  // Determine loading and error states
  const isLoading = isLoadingLines || isLoadingFactory;
  const error = linesError || factoryError;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message="Không thể tải danh sách dây chuyền. Vui lòng thử lại sau." />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={handleRefetch}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dây chuyền - {factoryName}</h1>
          <Button onClick={handleCreateLine}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Thêm dây chuyền
          </Button>
        </div>

        <LinesList
          lines={lines || []}
          factoryId={factoryId}
          factoryName={factoryName}
          onLineSelect={handleLineSelect}
          onEditLine={handleEditLine}
          onDeleteLine={handleDeleteLine}
        />
      </div>
    </ErrorBoundary>
  );
};

export default FactoryLinesManagement;
