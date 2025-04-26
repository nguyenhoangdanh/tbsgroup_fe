// file: components/common/table/data-table/components/BatchDeleteButton.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { DialogType } from "@/contexts/DialogProvider";
import { toast } from "@/hooks/use-toast";

interface BatchDeleteButtonProps {
    table: any;
    onBatchDelete?: (ids: string[]) => Promise<void>;
    refetchData?: () => void;
    showDialog: any;
}

function BatchDeleteButton({
    table,
    onBatchDelete,
    refetchData,
    showDialog
}: BatchDeleteButtonProps) {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedCount = selectedRows.length;

    if (selectedCount === 0 || !onBatchDelete) return null;

    return (
        <div className="flex items-center gap-2 my-2">
            <span className="text-sm font-medium">
                {selectedCount} dòng đã chọn
            </span>
            <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                    // Lọc ra các ID không phải nhóm
                    const selectedRowIds = selectedRows.map((row: { original: { isGroupRow?: boolean; id: string } }) => {
                        return row.original?.isGroupRow ? null : row.original.id;
                    }).filter((id: string | null) => id !== null) as string[];

                    showDialog({
                        type: DialogType.DELETE,
                        title: `Xóa ${selectedCount} dòng đã chọn?`,
                        description: "Thao tác này không thể hoàn tác.",
                        onSubmit: async () => {
                            try {
                                await onBatchDelete(selectedRowIds);
                                table.resetRowSelection();
                                if (refetchData) refetchData();

                                toast({
                                    title: "Xóa hàng loạt thành công",
                                    description: `${selectedCount} mục đã được xóa`,
                                    variant: "default"
                                });
                                return true;
                            } catch (error) {
                                console.error("Lỗi khi xóa hàng loạt:", error);
                                toast({
                                    title: "Xóa hàng loạt thất bại",
                                    description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
                                    variant: "destructive"
                                });
                                throw error;
                            }
                        }
                    });
                }}
                className="flex items-center gap-1"
            >
                <Trash className="h-4 w-4" />
                <span>Xóa đã chọn</span>
            </Button>
        </div>
    );
}

// Optimize with memo to prevent unnecessary re-renders
export default React.memo(BatchDeleteButton) as typeof BatchDeleteButton;