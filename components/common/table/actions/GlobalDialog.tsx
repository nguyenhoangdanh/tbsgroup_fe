"use client";
import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const GlobalDialog = () => {
    const { dialog, hideDialog, submit, isSubmitting } = useDialog();

    // Debug dialog state
    useEffect(() => {
        console.log("GlobalDialog rendered, open:", dialog.open);
    }, [dialog.open]);

    const renderDialogTitle = () => {
        if (!dialog.title) {
            return null;
        }

        return (
            <DialogHeader>
                <DialogTitle>{dialog.title}</DialogTitle>
                {dialog.description && (
                    <DialogDescription>{dialog.description}</DialogDescription>
                )}
            </DialogHeader>
        );
    };

    const renderDialogContent = () => {
        // Render using function if provided
        if (typeof dialog.children === 'function') {
            return dialog.children({
                data: dialog.data,
                isSubmitting,
                onSubmit: submit,
                onClose: hideDialog
            });
        }

        // Render direct children if provided
        if (dialog.children) {
            return dialog.children;
        }

        // Default delete dialog
        if (dialog.type === DialogType.DELETE) {
            return (
                <div className="p-4 text-center">
                    <p className="mb-4">Bạn có chắc chắn muốn xóa?</p>
                    <div className="flex justify-center gap-2">
                        <Button
                            variant="destructive"
                            disabled={isSubmitting}
                            onClick={async () => {
                                try {
                                    await submit(dialog.data);
                                    toast({
                                        title: "Xóa thành công",
                                        variant: "default",
                                    });
                                } catch (error) {
                                    toast({
                                        title: "Thao tác xóa thất bại",
                                        description: error instanceof Error ? error.message : undefined,
                                        variant: "destructive"
                                    });
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                "Xóa"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => {
                                console.log("Cancel button clicked in delete dialog");
                                hideDialog();
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            );
        }

        return null;
    };

    const handleOpenChange = (open: boolean) => {
        console.log("Dialog open state changed to:", open);
        if (!open) {
            console.log("Dialog closing via open change");
            hideDialog();
        }
    };

    return (
        <Dialog
            open={dialog.open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent
                className={dialog.fullWidth ? "w-[95vw] sm:max-w-[800px]" : "w-[95vw] sm:max-w-[500px]"}
                onInteractOutside={(e) => {
                    console.log("Dialog outside interaction");
                    if (isSubmitting) {
                        e.preventDefault();
                    }
                }}
                onEscapeKeyDown={(e) => {
                    console.log("Escape key pressed");
                    if (isSubmitting) {
                        e.preventDefault();
                    }
                }}
            >
                {renderDialogTitle()}
                {renderDialogContent()}
            </DialogContent>
        </Dialog>
    );
};

export default GlobalDialog;