import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useDialog } from "@/context/DialogProvider";

interface FormActionsProps {
    isSubmitting: boolean;
    isReadOnly?: boolean;
    isEdit?: boolean;
    onCancel?: () => void;
    submitLabel?: {
        create?: string;
        update?: string;
        loading?: string;
    };
    cancelLabel?: {
        cancel?: string;
        close?: string;
    };
    submitButtonClass?: string;
}

const FormActions: React.FC<FormActionsProps> = ({
    isSubmitting,
    isReadOnly = false,
    isEdit = false,
    onCancel,
    submitLabel = {
        create: "Tạo mới",
        update: "Cập nhật",
        loading: "Đang xử lý..."
    },
    cancelLabel = {
        cancel: "Hủy",
        close: "Đóng"
    },
    submitButtonClass = "bg-green-800 hover:bg-green-700"
}) => {
    const { hideDialog } = useDialog();

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            hideDialog();
        }
    };

    return (
        <div className="flex justify-end space-x-2 pt-4">
            {!isReadOnly && (
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={submitButtonClass}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {submitLabel.loading}
                        </>
                    ) : isEdit ? (
                        submitLabel.update
                    ) : (
                        submitLabel.create
                    )}
                </Button>
            )}

            <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
            >
                {isReadOnly ? cancelLabel.close : cancelLabel.cancel}
            </Button>
        </div>
    );
};

export default FormActions;