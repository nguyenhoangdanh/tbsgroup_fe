import React from 'react';
import { Button } from "@/components/ui/button";
import { useLineQueries } from "@/hooks/line/useLineQueries";
import { useFactoryQueries } from "@/hooks/factory/useFactoryQueries";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import LinesList, { PageHeader, LoadingSpinner, ErrorAlert } from './LinesList';

export default function LinesListContainer({ params }: { params: { factoryId: string } }) {
    const factoryId = params.factoryId;
    const lineQueries = useLineQueries();
    const factoryQueries = useFactoryQueries();
    const router = useRouter();

    // Fetch lines for this factory
    const {
        data: lines,
        isLoading: isLoadingLines,
        error: linesError
    } = lineQueries.getLinesByFactoryId(factoryId);

    // Fetch factory details 
    const {
        data: factory,
        isLoading: isLoadingFactory,
        error: factoryError
    } = factoryQueries.getFactoryWithDetails(factoryId, {
        includeManagers: false
    });

    // Handler for adding a new line
    const handleAddLine = () => {
        router.push(`/admin/factories/${factoryId}/lines/add`);
    };

    // Handler for selecting a line
    const handleLineSelect = (lineId: string) => {
        router.push(`/admin/factories/${factoryId}/lines/${lineId}`);
    };

    // Determine loading state
    const isLoading = isLoadingLines || isLoadingFactory;

    // Determine error state
    const error = linesError || factoryError;

    return (
        <div className="container mx-auto p-4">
            <PageHeader
                title="Dây chuyền sản xuất"
                description={factory ? `Danh sách dây chuyền thuộc nhà máy ${factory.name}` : "Đang tải..."}
                actionButton={
                    <Button onClick={handleAddLine}>
                        <PlusIcon className="mr-2 h-4 w-4" /> Thêm dây chuyền
                    </Button>
                }
            />

            {isLoading && <LoadingSpinner />}

            {error && (
                <ErrorAlert
                    message="Không thể tải danh sách dây chuyền. Vui lòng thử lại sau."
                />
            )}

            {lines && (
                <LinesList
                    lines={lines}
                    factoryId={factoryId}
                    onLineSelect={handleLineSelect}
                />
            )}
        </div>
    );
}