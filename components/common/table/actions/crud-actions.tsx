// Đây là phần cần sửa trong file crud-actions.tsx

// Sửa lại hàm này để đảm bảo nó không bị mất dữ liệu khi đóng dialog
import React from "react";
import { BaseData, TActions } from "../data-table";
import { CreateActionDialog } from "./popup-create";
import { EditActionDialog } from "./popup-edit";
import { ViewActionDialog } from "./popup-view";
import { DialogChildrenProps } from "@/contexts/DialogProvider";

interface CrudActionsProps<T extends BaseData = BaseData> {
    name: string;
    description?: string;
    onCreate?: (data?: T) => Promise<void | boolean>;
    onEdit?: (data?: T) => Promise<void | boolean>;
    onRefetch?: () => void;
    createComponent?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
    editComponent?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
    viewComponent?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
    actions: TActions[];
    rowData?: T;
}

/**
 * Component tổng hợp để sử dụng các action CRUD
 * Có thể sử dụng component này ở nhiều nơi khác nhau, không chỉ trong DataTable
 */
export function CrudActions<T extends BaseData = BaseData>({
    name,
    description,
    onCreate,
    onEdit,
    onRefetch,
    createComponent,
    editComponent,
    viewComponent,
    actions,
    rowData,
}: CrudActionsProps<T>) {
    return (
        <div className="flex gap-1">
            {/* Create Button - Hiển thị nếu có action create và không cần rowData */}
            {actions.includes("create") && (
                <CreateActionDialog
                    name={name}
                    description={description}
                    onSubmit={async (data) => {
                        if (onCreate) {
                            await onCreate(data as T);
                            if (onRefetch) onRefetch();
                            return true;
                        }
                        return false;
                    }}
                    children={createComponent}
                />
            )}

            {/* View Button - Cần có rowData */}
            {actions.includes("read-only") && rowData && (
                <ViewActionDialog
                    name={name}
                    description={description}
                    data={rowData}
                    onClose={onRefetch}
                    children={viewComponent}
                />
            )}

            {/* Edit Button - Cần có rowData */}
            {actions.includes("edit") && rowData && (
                <EditActionDialog
                    name={name}
                    description={description}
                    data={rowData}
                    onSubmit={async (data) => {
                        try {
                            if (onEdit) {
                                await onEdit(data as T);
                                if (onRefetch) onRefetch();
                                return true;
                            }
                            return false;
                        } catch (error) {
                            console.error("Error in onEdit:", error);
                            return false;
                        }
                    }}
                    onClose={onRefetch}
                    children={editComponent}
                />
            )}
        </div>
    );
}