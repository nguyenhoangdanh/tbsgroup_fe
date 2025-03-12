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
        console.log("[ViewActionDialog] Opening dialog with data:", data);
        showDialog({
            type: DialogType.VIEW,
            title: `Chi tiết ${name} ${data.id ? `#${data.id}` : ''}`,
            description: description,
            fullWidth: fullWidth,
            data: data, // Truyền dữ liệu hiện tại vào dialog
            children: typeof children === 'function'
                ? (props) => {
                    console.log("[ViewActionDialog] Rendering children function");
                    return children({
                        ...props,
                        data: props.data || data, // Đảm bảo luôn có data
                        // isReadOnly: true, // Thêm flag để các form biết đây là chế độ xem
                        onClose: () => {
                            console.log("[ViewActionDialog] children onClose called");
                            props.onClose();
                            onClose && onClose();
                        }
                    });
                }
                : children,
            onClose: () => {
                console.log("[ViewActionDialog] Dialog onClose called");
                onClose && onClose();
            }
        });
    };

    const buttonClasses = buttonSize === "icon"
        ? "bg-blue-500 hover:bg-blue-600 text-white h-7 w-7 md:w-8 md:h-8 p-0"
        : `flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white ${fullWidth ? 'w-full' : 'sm:w-auto'}`;

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