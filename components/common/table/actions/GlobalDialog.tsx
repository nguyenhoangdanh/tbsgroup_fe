"use client";

import React, { memo, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader, Loader2, LoaderIcon, LoaderPinwheel } from "lucide-react";

const GlobalDialog = memo(() => {
    const { dialog, hideDialog, submit, isSubmitting } = useDialog();

    // Dialog title component
    const dialogTitle = useMemo(() => {
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
    }, [dialog.title, dialog.description]);

    // Dialog content component
    const dialogContent = useMemo(() => {
        // Render function children if provided
        if (typeof dialog.children === 'function') {
            try {
                return dialog.children({
                    data: dialog.data,
                    isSubmitting,
                    onSubmit: submit,
                    onClose: hideDialog
                });
            } catch (error) {
                console.error("Error rendering function children:", error);
                return <div>Error rendering dialog content</div>;
            }
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
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                "Xóa"
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={hideDialog}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            );
        }

        return null;
    }, [dialog.children, dialog.data, dialog.type, isSubmitting, submit, hideDialog]);

    // Handle open state changes
    const handleOpenChange = useCallback((open: boolean) => {
        console.log("Dialog open changed to:", open);
        if (!open) {
            hideDialog();
        }
    }, [hideDialog]);

    // Outside interaction handler
    const handleOutsideInteraction = useCallback((event: React.MouseEvent) => {
        console.log("Outside interaction occurred");
        if (isSubmitting) {
            event.preventDefault();
        }
    }, [isSubmitting]);

    // Escape key handler
    const handleEscapeKey = useCallback((event: React.KeyboardEvent) => {
        console.log("Escape key pressed");
        if (isSubmitting) {
            event.preventDefault();
        }
    }, [isSubmitting]);

    // Early return if dialog is not open
    if (!dialog.open) {
        return null;
    }


    return (
        <Dialog
            open={dialog.open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent
                className={dialog.fullWidth ? "w-[95vw] sm:max-w-[800px]" : "w-[95vw] sm:max-w-[500px]"}
            // onInteractOutside={handleOutsideInteraction}
            // onEscapeKeyDown={handleEscapeKey}
            >
                {dialogTitle}
                {dialogContent}
            </DialogContent>
        </Dialog>
    );
});

GlobalDialog.displayName = "GlobalDialog";

export default GlobalDialog;



















// "use client";
// import React, { useEffect } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { DialogType, useDialog } from "@/context/DialogProvider";
// import { Button } from "@/components/ui/button";
// import { toast } from "@/hooks/use-toast";
// import { Loader2 } from "lucide-react";

// const GlobalDialog = () => {
//     const { dialog, hideDialog, submit, isSubmitting } = useDialog();

//     const renderDialogTitle = () => {
//         if (!dialog.title) {
//             return null;
//         }

//         return (
//             <DialogHeader>
//                 <DialogTitle>{dialog.title}</DialogTitle>
//                 {dialog.description && (
//                     <DialogDescription>{dialog.description}</DialogDescription>
//                 )}
//             </DialogHeader>
//         );
//     };

//     const renderDialogContent = () => {
//         // Render using function if provided
//         if (typeof dialog.children === 'function') {
//             return dialog.children({
//                 data: dialog.data,
//                 isSubmitting,
//                 onSubmit: submit,
//                 onClose: hideDialog
//             });
//         }

//         // Render direct children if provided
//         if (dialog.children) {
//             return dialog.children;
//         }

//         // Default delete dialog
//         if (dialog.type === DialogType.DELETE) {
//             return (
//                 <div className="p-4 text-center">
//                     <p className="mb-4">Bạn có chắc chắn muốn xóa?</p>
//                     <div className="flex justify-center gap-2">
//                         <Button
//                             variant="destructive"
//                             disabled={isSubmitting}
//                             onClick={async () => {
//                                 try {
//                                     await submit(dialog.data);
//                                     toast({
//                                         title: "Xóa thành công",
//                                         variant: "default",
//                                     });
//                                 } catch (error) {
//                                     toast({
//                                         title: "Thao tác xóa thất bại",
//                                         description: error instanceof Error ? error.message : undefined,
//                                         variant: "destructive"
//                                     });
//                                 }
//                             }}
//                         >
//                             {isSubmitting ? (
//                                 <>
//                                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                     Đang xóa...
//                                 </>
//                             ) : (
//                                 "Xóa"
//                             )}
//                         </Button>
//                         <Button
//                             variant="outline"
//                             disabled={isSubmitting}
//                             onClick={() => {
//                                 console.log("Cancel button clicked in delete dialog");
//                                 hideDialog();
//                             }}
//                         >
//                             Hủy
//                         </Button>
//                     </div>
//                 </div>
//             );
//         }

//         return null;
//     };

//     const handleOpenChange = (open: boolean) => {
//         if (!open) {
//             hideDialog();
//         }
//     };

//     return (
//         <Dialog
//             open={dialog.open}
//             onOpenChange={handleOpenChange}
//         >
//             <DialogContent
//                 className={dialog.fullWidth ? "w-[95vw] sm:max-w-[800px]" : "w-[95vw] sm:max-w-[500px]"}
//                 onInteractOutside={(e) => {
//                     console.log("Dialog outside interaction");
//                     if (isSubmitting) {
//                         e.preventDefault();
//                     }
//                 }}
//                 onEscapeKeyDown={(e) => {
//                     console.log("Escape key pressed");
//                     if (isSubmitting) {
//                         e.preventDefault();
//                     }
//                 }}
//             >
//                 {renderDialogTitle()}
//                 {renderDialogContent()}
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default GlobalDialog;