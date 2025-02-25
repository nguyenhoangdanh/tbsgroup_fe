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

interface ButtonGroupActionProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onRefetchData?: () => void;
}

const ButtonGroupAction = ({
  onEdit,
  onDelete,
  onRefetchData,
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
        setDialog({ openDelete: false });
      }
    }
  };

  return (
    <div className="flex gap-1">
      {onEdit && (
        <Button size="icon" className="bg-green-800" onClick={onEdit}>
          <SquarePen />
        </Button>
      )}
      <Dialog open={dialog.openDelete} onOpenChange={() => setDialog({ openDelete: !dialog.openDelete })}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="bg-red-500 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900"
          >
            <Trash2 />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full">
          <DialogTitle>Xoá dữ liệu</DialogTitle>
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
              onClick={() => setDialog({ openDelete: false })}
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
