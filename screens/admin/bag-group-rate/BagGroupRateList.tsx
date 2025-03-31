"use client";

import React, { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { DataTable } from "@/components/common/table/data-table";
import { formatDate } from "@/lib/utils";
import { BagGroupRate } from "@/common/interface/bag-group-rate";
import MultiGroupBatchWrapper from "./MultiGroupBatchWrapper";
import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";
import BatchFormWrapper from "./BatchFormWrapper";
import MultiGroupForm from "./MultiGroupForm";
import { BatchCreateBagGroupRateDTO } from "@/apis/group/bagGroupRate/bag-group-rate.api";

interface BagGroupRateListProps {
    onShowAnalysis?: (handBagId: string) => void;
}

// Wrapper component with Context Bridge
const BagGroupRateList: React.FC<BagGroupRateListProps> = (props) => {
    return (
        <BagGroupRateContextBridge>
            <BagGroupRateListContent {...props} />
        </BagGroupRateContextBridge>
    );
};

// Content component that uses the context
const BagGroupRateListContent: React.FC<BagGroupRateListProps> = ({ onShowAnalysis }) => {
    const {
        bagGroupRates,
        calculatedPaginationMeta,
        isLoading,
        handlePageChange,
        handleDeleteBagGroupRate,
        handleUpdateBagGroupRate,
        handleBagGroupRateFormSubmit,
        handleBatchCreateBagGroupRates,
        handleBatchUpdateBagGroupRates,
    } = useBagGroupRateContext();

    const { showDialog } = useDialog();

    // Callbacks for handling operations
    const handleToggleActive = useCallback(
        async (id: string, currentActive: boolean) => {
            try {
                await handleUpdateBagGroupRate(id, { active: !currentActive });
            } catch (error) {
                console.error("Error toggling active status:", error);
            }
        },
        [handleUpdateBagGroupRate]
    );

    // Show dialog for batch create with MultiGroupForm
    const handleShowBatchForm = useCallback(() => {
        showDialog({
            type: DialogType.CREATE,
            title: "Thêm hàng loạt năng suất theo nhóm",
            children: MultiGroupBatchWrapper
        });
    }, [showDialog]);

    // Define table columns
    const columns: ColumnDef<BagGroupRate>[] = useMemo(() => [
        {
            id: "bagCode",
            header: "Mã túi",
            accessorKey: "handBag.code",
            cell: ({ row }) => {
                const bagCode = row.original?.handBagCode || "N/A";
                const bagName = row.original.handBagName || "";
                return (
                    <div>
                        <div className="font-medium">{bagCode}</div>
                        <div className="text-sm text-muted-foreground">{bagName}</div>
                    </div>
                );
            },
        },
        {
            id: "groupCode",
            header: "Nhóm",
            accessorKey: "group.code",
            cell: ({ row }) => {
                const groupCode = row.original.groupCode || "N/A";
                const groupName = row.original.groupName || "";
                return (
                    <div>
                        <div className="font-medium">{groupCode}</div>
                        <div className="text-sm text-muted-foreground">{groupName}</div>
                    </div>
                );
            },
        },
        {
            id: "outputRate",
            header: "Năng suất (SP/giờ)",
            accessorKey: "outputRate",
            cell: ({ row }) => {
                return (
                    <div className="text-center font-medium">
                        {row.original.outputRate}
                    </div>
                );
            },
        },
        {
            id: "notes",
            header: "Ghi chú",
            accessorKey: "notes",
            cell: ({ row }) => {
                return (
                    <div className="max-w-[200px] truncate">
                        {row.original.notes || "-"}
                    </div>
                );
            },
        },
        {
            id: "active",
            header: "Trạng thái",
            accessorKey: "active",
            cell: ({ row }) => {
                return (
                    <div className="text-center">
                        <Switch
                            checked={row.original.active}
                            onCheckedChange={() => handleToggleActive(row.original.id, row.original.active)}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                );
            },
        },
        {
            id: "updatedAt",
            header: "Cập nhật",
            accessorKey: "updatedAt",
            cell: ({ row }) => {
                return (
                    <div className="text-center text-sm text-muted-foreground">
                        {row.original.updatedAt ? formatDate(row.original.updatedAt) : "-"}
                    </div>
                );
            },
        },
        {
            id: "analysis",
            header: "",
            cell: ({ row }) => {
                return (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onShowAnalysis && onShowAnalysis(row.original.handBagId)}
                        title="Phân tích năng suất"
                    >
                        <BarChart className="h-4 w-4" />
                    </Button>
                );
            },
        },
    ], [handleToggleActive, onShowAnalysis]);

    // Custom delete action handler
    const handleDelete = useCallback(async (id: string) => {
        await handleDeleteBagGroupRate(id);
    }, [handleDeleteBagGroupRate]);

    // Handle pagination change 
    const handleCustomPageChange = useCallback((pageIndex: number, pageSize: number) => {
        handlePageChange(pageIndex, pageSize);
    }, [handlePageChange]);

    const initialPageIndex = useMemo(() =>
        calculatedPaginationMeta.currentPage
            ? calculatedPaginationMeta.currentPage - 1
            : 0,
        [calculatedPaginationMeta.currentPage]
    );

    // Tạo các component cho dialog với đầy đủ props cần thiết
    const createMultiGroupComponent = (props: any) => (
        <MultiGroupBatchWrapper
            {...props}
            isSubmitting={false}
            onSubmit={async (data) => {
                const result = await handleBatchCreateBagGroupRates(data);
                return result && result.length > 0;
            }}
            onClose={props.onClose || (() => { })}
        />
    );

    const editMultiGroupComponent = (props: any) => (
        <MultiGroupBatchWrapper
            {...props}
            isEdit={true}
            isSubmitting={false}
            onSubmit={async (data) => {
                const result = await handleBatchUpdateBagGroupRates(data);
                return result && result.length > 0;
            }}
            onClose={props.onClose || (() => { })}
        />
    );

    const viewMultiGroupComponent = (props: any) => (
        <MultiGroupBatchWrapper
            {...props}
            isReadOnly={true}
            isSubmitting={false}
            onSubmit={async () => false}
            onClose={props.onClose || (() => { })}
        />
    );

    // Add a batch create button component
    const ActionButtons = () => (
        <div className="flex gap-2">
            <Button
                onClick={handleShowBatchForm}
                variant="outline"
                className="flex items-center gap-1"
            >
                Thêm hàng loạt
            </Button>
        </div>
    );

    return (
        <div>
            <DataTable
                columns={columns}
                data={bagGroupRates || []}
                title="Danh sách năng suất nhóm túi"
                description="Quản lý năng suất của các nhóm sản xuất túi"
                actions={["delete", "edit", "create", "read-only"]}
                searchColumn="handBag.code"
                searchPlaceholder="Tìm kiếm theo mã túi..."
                exportData={true}
                exportFormats={["excel", "pdf"]}
                isLoading={isLoading}
                onDelete={handleDelete}
                initialPageIndex={initialPageIndex}
                initialPageSize={calculatedPaginationMeta.pageSize || 10}
                totalItems={calculatedPaginationMeta.totalItems || 0}
                serverSidePagination={true}
                onPageChange={handleCustomPageChange}
                createFormComponent={createMultiGroupComponent}
                editFormComponent={editMultiGroupComponent}
                viewFormComponent={viewMultiGroupComponent}
                children={<ActionButtons />}
            />
        </div>
    );
};

export default BagGroupRateList;




// "use client";

// import React, { useCallback, useMemo } from "react";
// import { ColumnDef } from "@tanstack/react-table";
// import { BarChart } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { useBagGroupRateContext } from "@/hooks/group/bag-group-rate/BagGroupRateContext";
// import { DialogType, useDialog } from "@/context/DialogProvider";
// import { DataTable } from "@/components/common/table/data-table";
// import { formatDate } from "@/lib/utils";
// import BagGroupRateForm, { BagGroupRateSchema } from "./BagGroupRateForm";
// import { BagGroupRate } from "@/common/interface/bag-group-rate";
// import BatchFormWrapper from "./BatchFormWrapper";
// import { BagGroupRateContextBridge } from "./BagGroupRateContextBridge";

// interface BagGroupRateListProps {
//     onShowAnalysis?: (handBagId: string) => void;
// }

// // Wrapper component with Context Bridge
// const BagGroupRateList: React.FC<BagGroupRateListProps> = (props) => {
//     return (
//         <BagGroupRateContextBridge>
//             <BagGroupRateListContent {...props} />
//         </BagGroupRateContextBridge>
//     );
// };

// // Content component that uses the context
// const BagGroupRateListContent: React.FC<BagGroupRateListProps> = ({ onShowAnalysis }) => {
//     const {
//         bagGroupRates,
//         calculatedPaginationMeta,
//         isLoading,
//         handlePageChange,
//         handleDeleteBagGroupRate,
//         handleUpdateBagGroupRate,
//         handleBagGroupRateFormSubmit,
//     } = useBagGroupRateContext();

//     const { showDialog } = useDialog();

//     // Callbacks for handling operations
//     const handleToggleActive = useCallback(
//         async (id: string, currentActive: boolean) => {
//             try {
//                 await handleUpdateBagGroupRate(id, { active: !currentActive });
//             } catch (error) {
//                 console.error("Error toggling active status:", error);
//             }
//         },
//         [handleUpdateBagGroupRate]
//     );

//     // Show dialog for batch create
//     const handleShowBatchForm = useCallback(() => {
//         showDialog({
//             type: DialogType.CREATE,
//             title: "Thêm hàng loạt năng suất theo nhóm",
//             children: BatchFormWrapper
//         });
//     }, [showDialog]);

//     // Define table columns
//     const columns: ColumnDef<BagGroupRate>[] = useMemo(() => [
//         {
//             id: "bagCode",
//             header: "Mã túi",
//             accessorKey: "handBag.code",
//             cell: ({ row }) => {
//                 const bagCode = row.original?.handBagCode || "N/A";
//                 const bagName = row.original.handBagName || "";
//                 return (
//                     <div>
//                         <div className="font-medium">{bagCode}</div>
//                         <div className="text-sm text-muted-foreground">{bagName}</div>
//                     </div>
//                 );
//             },
//         },
//         {
//             id: "groupCode",
//             header: "Nhóm",
//             accessorKey: "group.code",
//             cell: ({ row }) => {
//                 const groupCode = row.original.groupCode || "N/A";
//                 const groupName = row.original.groupName || "";
//                 return (
//                     <div>
//                         <div className="font-medium">{groupCode}</div>
//                         <div className="text-sm text-muted-foreground">{groupName}</div>
//                     </div>
//                 );
//             },
//         },
//         {
//             id: "outputRate",
//             header: "Năng suất (SP/giờ)",
//             accessorKey: "outputRate",
//             cell: ({ row }) => {
//                 return (
//                     <div className="text-center font-medium">
//                         {row.original.outputRate.toFixed(1)}
//                     </div>
//                 );
//             },
//         },
//         {
//             id: "notes",
//             header: "Ghi chú",
//             accessorKey: "notes",
//             cell: ({ row }) => {
//                 return (
//                     <div className="max-w-[200px] truncate">
//                         {row.original.notes || "-"}
//                     </div>
//                 );
//             },
//         },
//         {
//             id: "active",
//             header: "Trạng thái",
//             accessorKey: "active",
//             cell: ({ row }) => {
//                 return (
//                     <div className="text-center">
//                         <Switch
//                             checked={row.original.active}
//                             onCheckedChange={() => handleToggleActive(row.original.id, row.original.active)}
//                             className="data-[state=checked]:bg-green-500"
//                         />
//                     </div>
//                 );
//             },
//         },
//         {
//             id: "updatedAt",
//             header: "Cập nhật",
//             accessorKey: "updatedAt",
//             cell: ({ row }) => {
//                 return (
//                     <div className="text-center text-sm text-muted-foreground">
//                         {row.original.updatedAt ? formatDate(row.original.updatedAt) : "-"}
//                     </div>
//                 );
//             },
//         },
//         {
//             id: "analysis",
//             header: "",
//             cell: ({ row }) => {
//                 return (
//                     <Button
//                         variant="ghost"
//                         size="icon"
//                         onClick={() => onShowAnalysis && onShowAnalysis(row.original.handBagId)}
//                         title="Phân tích năng suất"
//                     >
//                         <BarChart className="h-4 w-4" />
//                     </Button>
//                 );
//             },
//         },
//     ], [handleToggleActive, onShowAnalysis]);

//     // Custom delete action handler
//     const handleDelete = useCallback(async (id: string) => {
//         await handleDeleteBagGroupRate(id);
//     }, [handleDeleteBagGroupRate]);

//     // Handle pagination change 
//     const handleCustomPageChange = useCallback((pageIndex: number, pageSize: number) => {
//         handlePageChange(pageIndex, pageSize);
//     }, [handlePageChange]);

//     const initialPageIndex = useMemo(() =>
//         calculatedPaginationMeta.currentPage
//             ? calculatedPaginationMeta.currentPage - 1
//             : 0,
//         [calculatedPaginationMeta.currentPage]
//     );

//     // Define dialog components for DataTable
//     const createComponent = useMemo(() => (
//         <BagGroupRateForm onSubmit={handleBagGroupRateFormSubmit} />
//     ), [handleBagGroupRateFormSubmit]);

//     const editComponent = useMemo(() => (
//         <BagGroupRateForm onSubmit={handleBagGroupRateFormSubmit} />
//     ), [handleBagGroupRateFormSubmit]);

//     const viewComponent = useMemo(() => (
//         <BagGroupRateForm />
//     ), []);

//     // Add a batch create button component
//     const ActionButtons = () => (
//         <div className="flex gap-2">
//             <Button
//                 onClick={handleShowBatchForm}
//                 variant="outline"
//                 className="flex items-center gap-1"
//             >
//                 Thêm hàng loạt
//             </Button>
//         </div>
//     );

//     return (
//         <div>
//             <DataTable
//                 columns={columns}
//                 data={bagGroupRates || []}
//                 title="Danh sách năng suất nhóm túi"
//                 description="Quản lý năng suất của các nhóm sản xuất túi"
//                 actions={["delete", "edit", "create", "read-only"]}
//                 searchColumn="handBag.code"
//                 searchPlaceholder="Tìm kiếm theo mã túi..."
//                 exportData={true}
//                 exportFormats={["excel", "pdf"]}
//                 isLoading={isLoading}
//                 onDelete={handleDelete}
//                 initialPageIndex={initialPageIndex}
//                 initialPageSize={calculatedPaginationMeta.pageSize || 10}
//                 totalItems={calculatedPaginationMeta.totalItems || 0}
//                 serverSidePagination={true}
//                 onPageChange={handleCustomPageChange}
//                 createFormComponent={createComponent}
//                 editFormComponent={editComponent}
//                 viewFormComponent={viewComponent}
//                 children={<ActionButtons />}
//             />
//         </div>
//     );
// };

// export default BagGroupRateList;