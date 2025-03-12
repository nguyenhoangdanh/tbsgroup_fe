import { Button } from "@/components/ui/button";
import { Eye, SquarePen, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "@/hooks/use-toast";
import { DialogType, useDialog, DialogChildrenProps } from "@/context/DialogProvider";
import { BaseData, TActions } from "../data-table";
import { ViewActionDialog } from "./popup-view";
import { EditActionDialog } from "./popup-edit";

interface ButtonGroupActionProps<T extends BaseData = BaseData> {
  actions: TActions[];
  onEdit?: (data: T) => void;
  onDelete?: (id: string) => Promise<void>;
  onView?: (data: T) => void;
  onRefetchData?: () => void;
  editComponent?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
  viewComponent?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
  rowData: T;
}

const ButtonGroupAction = <T extends BaseData>({
  actions,
  onEdit,
  onDelete,
  onView,
  onRefetchData,
  editComponent,
  viewComponent,
  rowData,
}: ButtonGroupActionProps<T>) => {
  const { showDialog } = useDialog<T>();

  const handleDelete = () => {
    showDialog({
      type: DialogType.DELETE,
      title: `Xóa dữ liệu ${rowData.id ? `#${rowData.id}` : ''}`,
      data: rowData,
      onSubmit: async () => {
        if (onDelete) {
          try {
            await onDelete(rowData.id);
            toast({
              title: "Đã xóa dữ liệu",
              variant: "default"
            });

            onRefetchData && onRefetchData();
            return true;
          } catch (error) {
            console.error("Error executing delete action:", error);
            toast({
              title: "Lỗi khi thực hiện thao tác xóa",
              description: error instanceof Error ? error.message : "Lỗi không xác định",
              variant: "destructive"
            });
            throw error;
          }
        }
        return false;
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-1 justify-end md:justify-start">
      {actions.includes("read-only") && (
        <ViewActionDialog
          name=""
          buttonText=""
          buttonSize="icon"
          buttonIcon={<Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          data={rowData}
          children={
            typeof viewComponent === 'function'
              ? (props) => viewComponent({ ...props, data: rowData })
              : viewComponent
          }
          onClose={onRefetchData}
        />
      )}

      {actions.includes("edit") && (
        <EditActionDialog
          name=""
          buttonText=""
          buttonSize="icon"
          buttonIcon={<SquarePen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          data={rowData}
          onSubmit={async (data) => {
            if (onEdit && data) {
              onEdit(data as T);
              if (onRefetchData) onRefetchData();
              return true;
            }
            return false;
          }}
          children={
            typeof editComponent === 'function'
              ? (props) => editComponent({ ...props, data: rowData })
              : editComponent
          }
        />
      )}

      {actions.includes("delete") && (
        <Button
          size="icon"
          className="bg-red-500 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900 h-7 w-7 md:w-8 md:h-8 p-0"
          onClick={handleDelete}
          title="Xóa"
          aria-label="Xóa"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      )}
    </div>
  );
};

export default ButtonGroupAction;