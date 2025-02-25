"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDialog } from "@/context/DialogProvider";
import { on } from "events";
import { set } from "lodash";
import { Plus } from "lucide-react";

interface IProps {
  name: string;
  description?: string;
  children: React.ReactNode;
  refetchData?: () => void;
}

export function CreateActionDialog({
  name,
  description,
  refetchData,
  children,
}: IProps) {
  const { dialog, setDialog } = useDialog();
  const { openCreate: open } = dialog;
  return (
    <Dialog open={open} onOpenChange={() => setDialog({ openCreate: !open })}>
      <DialogTrigger asChild>
        <Button
          className="ml-auto p-2 bg-green-700 text-white hover:bg-green-800 hover:text-white"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Tạo mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tạo {name}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        {/* <DialogFooter>
                    <Button type="submit">
                        Lưu
                    </Button>
                </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
