"use client";
import { Button } from "@/components/ui/button";
import { SquarePen, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";
import { toast } from "@/hooks/use-toast";
import { useDialog } from "@/context/DialogProvider";
import { cn } from "@/lib/utils";

interface ButtonGroupActionProps {
  action: string;
  setAction: (action: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefetchData?: () => void;
  editComponent?: React.ReactNode;
}

const ButtonGroupAction = ({
  action,
  setAction,
  onEdit,
  onDelete,
  onRefetchData,
  editComponent,
}: ButtonGroupActionProps) => {
  const { dialog, setDialog } = useDialog();
  const handleDelete = () => {
    if (onDelete) {
      try {
        onDelete();
        toast({
          title: "Xoá dữ liệu thành công",
        });
      } catch (error) {
        toast({
          title: "Xoá dữ liệu thất bại",
        });
      } finally {
        if (onRefetchData) {
          onRefetchData();
        }
        setDialog({ open: false });
      }
    }
  };

  const handleUpdate = () => {
    if (onEdit) {
      try {
        onEdit();
        toast({
          title: "Cập nhật dữ liệu thành công",
        });
      } catch (error) {
        toast({
          title: "Cập nhật dữ liệu thất bại",
        });
      } finally {
        if (onRefetchData) {
          onRefetchData();
        }
        setDialog({ open: false });
      }
    }
  };

  return (
    <div className="flex gap-1">
      <Dialog
        open={dialog.open}
        onOpenChange={() => setDialog({ open: !dialog.open })}
      >
        <DialogTrigger asChild>
          <div className="flex gap-1">
            <Button
              size="icon"
              className="bg-blue-800 hover:bg-blue-900 dark:bg-blue-900 dark:hover:bg-blue-700"
              onClick={() => setAction("edit")}
            >
              <SquarePen />
            </Button>
            <Button
              size="icon"
              className="bg-red-500 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900"
              onClick={() => setAction("delete")}
            >
              <Trash2 />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="w-full">
          {/* <DialogTitle>Xoá dữ liệu</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa dữ liệu này không?
          </DialogDescription>
          <DialogFooter className="flex flex-row justify-end gap-1">
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900"
              onClick={handleDelete}
            >
              Xoá
            </Button>
            <Button
              size="sm"
              className="bg-gray-500 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-900"
              onClick={() => setDialog({ open: false })}
            >
              Huỷ
            </Button>
          </DialogFooter> */}
          <DialogTitle>
            {action === "edit" ? "Chỉnh sửa dữ liệu" : "Xoá dữ liệu"}
          </DialogTitle>
          <DialogDescription>
            {action === "edit"
              ? editComponent
              : "Bạn có chắc chắn muốn xóa dữ liệu này không?"}
          </DialogDescription>
          <DialogFooter className="flex flex-row justify-end gap-1">
            <Button
              size="sm"
              // className="bg-red-500 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900"
              className={cn(
                action === "edit"
                  ? "bg-green-800"
                  : "bg-red-500 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900"
              )}
              onClick={action === "edit" ? handleUpdate : handleDelete}
            >
              {action === "edit" ? "Cập nhật" : "Xoá"}
            </Button>
            <Button
              size="sm"
              className="bg-gray-500 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-900"
              onClick={() => setDialog({ open: false })}
            >
              Huỷ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ButtonGroupAction;
