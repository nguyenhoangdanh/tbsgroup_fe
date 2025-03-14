import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import React from "react";
import { DialogType, useDialog, DialogChildrenProps } from "@/context/DialogProvider";
import { BaseData } from "../data-table";

interface ViewActionDialogProps<T extends BaseData = BaseData> {
    name: string;
    description?: string;
    children?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
    buttonText?: string;
    buttonIcon?: React.ReactNode;
    buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    buttonSize?: "default" | "sm" | "lg" | "icon";
    fullWidth?: boolean;
    disableButton?: boolean;
    onClose?: () => void;
    data: T;
}

export function ViewActionDialog<T extends BaseData = BaseData>({
    name,
    description,
    children,
    buttonText = "Xem chi tiết",
    buttonIcon = <Eye size={16} />,
    buttonVariant = "outline",
    buttonSize = "default",
    fullWidth = false,
    disableButton = false,
    onClose,
    data,
}: ViewActionDialogProps<T>) {
    const { showDialog } = useDialog<T>();

    const handleOpenDialog = () => {
        showDialog({
            type: DialogType.VIEW,
            title: `Chi tiết ${name}`,
            description: description,
            fullWidth: fullWidth,
            isReadOnly: true,
            data: data, // Truyền dữ liệu hiện tại vào dialog
            children: typeof children === 'function'
                ? (props) => {
                    return children({
                        ...props,
                        data: props.data || data, // Đảm bảo luôn có data
                        onClose: () => {
                            props.onClose();
                            onClose && onClose();
                        }
                    });
                }
                : children,
            onClose: () => {
                onClose && onClose();
            }
        });
    };

    const buttonClasses = buttonSize === "icon"
        ? "bg-gray-400 hover:bg-gray-500 text-white h-7 w-7 md:w-8 md:h-8 p-0"
        : `flex items-center gap-1 bg-gray-400 hover:bg-gray-500 text-white ${fullWidth ? 'w-full' : 'sm:w-auto'}`;

    return (
        <Button
            variant={buttonVariant}
            size={buttonSize}
            className={buttonClasses}
            disabled={disableButton}
            onClick={handleOpenDialog}
            title={buttonText || "Xem chi tiết"}
            aria-label={buttonText || "Xem chi tiết"}
        >
            {buttonIcon}
            {buttonSize !== "icon" && buttonText}
        </Button>
    );
}