import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";
import React from "react";
import { toast } from "@/hooks/use-toast";
import { DialogType, useDialog, DialogChildrenProps } from "@/context/DialogProvider";
import { BaseData } from "../data-table";

interface EditActionDialogProps<T extends BaseData = BaseData> {
    name: string;
    description?: string;
    children?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
    onSubmit?: (data?: T) => Promise<void | boolean>;
    buttonText?: string;
    buttonIcon?: React.ReactNode;
    buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    buttonSize?: "default" | "sm" | "lg" | "icon";
    fullWidth?: boolean;
    disableButton?: boolean;
    onClose?: () => void;
    data: T;
}

export function EditActionDialog<T extends BaseData = BaseData>({
    name,
    description,
    children,
    onSubmit,
    buttonText = "Chỉnh sửa",
    buttonIcon = <SquarePen size={16} />,
    buttonVariant = "default",
    buttonSize = "default",
    fullWidth = false,
    disableButton = false,
    onClose,
    data,
}: EditActionDialogProps<T>) {
    const { showDialog } = useDialog<T>();

    const handleOpenDialog = () => {
        showDialog({
            type: DialogType.EDIT,
            title: `Chỉnh sửa ${name}`,
            description: description,
            fullWidth: fullWidth,
            data: data,
            children: typeof children === 'function'
                ? (props) => {
                    return children({
                        ...props,
                        data: props.data || data,
                        onClose: () => {
                            props.onClose();
                            onClose && onClose();
                        }
                    });
                }
                : children,
            onSubmit: async (formData) => {
                if (onSubmit) {
                    try {
                        await onSubmit(formData as T);
                        toast({
                            title: `Cập nhật ${name.toLowerCase()} thành công`,
                            variant: "default",
                        });

                        return true;
                    } catch (error) {
                        toast({
                            title: `Lỗi khi cập nhật ${name.toLowerCase()}`,
                            description: error instanceof Error ? error.message : "Có lỗi xảy ra",
                            variant: "destructive",
                        });
                        throw error; // Ném lại lỗi để DialogProvider không đóng dialog
                    }
                }
            },
            onClose: () => {
                onClose && onClose();
            }
        });
    };
    const buttonClasses = buttonSize === "icon"
        ? "bg-blue-800 hover:bg-blue-700 text-white h-7 w-7 md:w-8 md:h-8 p-0"
        : `flex items-center gap-1 bg-blue-800 hover:bg-blue-700 text-white ${fullWidth ? 'w-full' : 'sm:w-auto'}`;

    return (
        <Button
            variant={buttonVariant}
            size={buttonSize}
            className={buttonClasses}
            disabled={disableButton}
            onClick={handleOpenDialog}
            title={buttonText || "Chỉnh sửa"}
            aria-label={buttonText || "Chỉnh sửa"}
        >
            {buttonIcon}
            {buttonSize !== "icon" && buttonText}
        </Button>
    );
}