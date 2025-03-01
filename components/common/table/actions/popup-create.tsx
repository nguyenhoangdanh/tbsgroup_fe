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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import React, { Dispatch, SetStateAction } from "react";

type TAction = "create" | "edit" | "delete" | "read-only";
interface IProps {
  name: string;
  description?: string;
  children?: React.ReactNode;
}

export function CreateActionDialog({ name, description, children }: IProps) {
  const actionTitle = (action: TAction) => {
    switch (action) {
      case "create":
        return `Tạo mới ${name}`;
      case "edit":
        return `Chỉnh sửa ${name}`;
      case "delete":
        return `Xoá ${name}`;
      case "read-only":
        return `Xem chi tiết ${name}`;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-1 bg-green-800 text-white"
        >
          <Plus size={16} />
          Tạo mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{`Taọ mới ${name}`}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
