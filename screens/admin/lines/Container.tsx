import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import LinesList, { PageHeader } from './LinesList';
import { useFactoryQueries } from "@/hooks/factory/useFactoryQueries";
import { LineProvider, useFactoryLines, useLine } from '@/hooks/line/LineContext';
import { ErrorBoundary } from 'react-error-boundary';
import { DialogType, useDialog } from '@/contexts/DialogProvider';
import LineForm from './LineForm';
import { toast } from '@/hooks/use-toast';
import { LineWithDetails } from '@/common/interface/line';
interface ContainerProps {
    params: {
        factoryId: string
    };
}

// Error fallback component for ErrorBoundary
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

export default function LinesListContainer({ params }: ContainerProps) {
    const factoryId = params.factoryId;
    const router = useRouter();
    const factoryQueries = useFactoryQueries();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showDialog } = useDialog()
    const { mutations, cache } = useLine();

    // Use custom hook for factory lines
    const {
        lines,
        isLoading: isLoadingLines,
        error: linesError,
        refetch: refetchLines
    } = useFactoryLines(factoryId);

    // Fetch factory details with minimal data needed
    const {
        data: factory,
        isLoading: isLoadingFactory,
        error: factoryError,
        refetch: refetchFactory
    } = factoryQueries.getFactoryWithDetails(factoryId, {
        includeManagers: false,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Handle refresh with debounce protection
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await Promise.all([
                refetchLines(),
                refetchFactory()
            ]);
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchLines, refetchFactory, isRefreshing]);

    // Handler for adding a new line
    const handleAddLine = useCallback(() => {
        if (!factory) return;

        setIsProcessing(true);

        showDialog({
            title: 'Thêm dây chuyền sản xuất',
            type: DialogType.CREATE,
            children: () => (
                <LineProvider>
                    <LineForm
                        factoryId={factoryId}
                        factory={factory}
                        onSuccess={async () => {
                            try {
                                await refetchLines();
                                setIsProcessing(false);
                            } catch (error) {
                                console.error('Error refreshing data:', error);
                                setIsProcessing(false);
                            }
                        }}
                        onCancel={() => setIsProcessing(false)}
                    />
                </LineProvider>
            ),
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [factory, factoryId, refetchLines, showDialog]);

    const handleEditLine = useCallback((line: LineWithDetails) => {
        if (!factory) return;

        setIsProcessing(true);

        showDialog({
            title: 'Cập nhật dây chuyền sản xuất',
            type: DialogType.EDIT,
            data: line,
            children: () => (
                <LineProvider>
                    <LineForm
                        factoryId={factoryId}
                        factory={factory}
                        line={line}
                        onSuccess={async () => {
                            if (line.id) {
                                try {
                                    await cache.invalidateDetails(line.id, { forceRefetch: true });
                                    await refetchLines();

                                    toast({
                                        title: 'Cập nhật dây chuyền thành công',
                                        description: `Dây chuyền "${line.name}" đã được cập nhật`,
                                        duration: 2000
                                    });
                                    setIsProcessing(false);
                                } catch (error) {
                                    console.error('Error updating line:', error);
                                    setIsProcessing(false);
                                }
                            }
                        }}
                        onCancel={() => setIsProcessing(false)}
                    />
                </LineProvider>
            ),
            onClose: () => {
                setIsProcessing(false);
            }
        });
    }, [factory, factoryId, cache, refetchLines, showDialog]);

    // Handler for deleting a line
    const handleDeleteLine = useCallback((lineId: string) => {
        const lineName = lines?.find(l => l.id === lineId)?.name || 'dây chuyền này';

        setIsProcessing(true);

        showDialog({
            title: 'Xác nhận xóa dây chuyền',
            description: `Bạn có chắc chắn muốn xóa ${lineName}? Thao tác này không thể hoàn tác.`,
            type: DialogType.DELETE,
            onSubmit: async () => {
                try {
                    await mutations.delete(lineId);
                    await handleRefresh();

                    toast({
                        title: 'Xóa dây chuyền thành công',
                        description: 'Dây chuyền đã được xóa khỏi hệ thống',
                        duration: 2000
                    });

                    setIsProcessing(false);
                    return true;
                } catch (error) {
                    toast({
                        title: 'Lỗi xóa dây chuyền',
                        description: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xóa dây chuyền',
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
    }, [lines, mutations, showDialog, handleRefresh]);

    // Handler for selecting a line
    const handleLineSelect = useCallback((lineId: string) => {
        router.push(`/admin/factories/${factoryId}/lines/${lineId}`);
    }, [router, factoryId]);

    // Determine overall loading state for PageLoader
    const isLoading = isLoadingLines || isLoadingFactory || isRefreshing || isProcessing;

    // Determine error state
    const error = linesError || factoryError;

    // Create description text
    const descriptionText = factory
        ? `Danh sách dây chuyền thuộc nhà máy ${factory.name}`
        : "Đang tải...";

    // Action button component
    const actionButton = (
        <Button onClick={handleAddLine} disabled={isLoading}>
            <PlusIcon className="mr-2 h-4 w-4" /> Thêm dây chuyền
        </Button>
    );

    return (
        <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) =>
                <ErrorFallback error={error} resetErrorBoundary={() => {
                    handleRefresh();
                    resetErrorBoundary();
                }}
                />}
        >
            <div className="container mx-auto p-4">
                <PageHeader
                    title="Dây chuyền sản xuất"
                    description={descriptionText}
                    actionButton={actionButton}
                />

                {!error && (
                    <LinesList
                        lines={lines || []}
                        factoryId={factoryId}
                        factoryName={factory?.name}
                        onLineSelect={handleLineSelect}
                        onEditLine={handleEditLine}
                        onDeleteLine={handleDeleteLine}
                    />
                )}

                {error && (
                    <div className="p-4 border border-red-300 rounded-md bg-red-50">
                        <h3 className="text-lg font-semibold text-red-800">Lỗi tải dữ liệu</h3>
                        <p className="text-red-600">Không thể tải danh sách dây chuyền. Vui lòng thử lại sau.</p>
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            className="mt-4"
                        >
                            Thử lại
                        </Button>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}