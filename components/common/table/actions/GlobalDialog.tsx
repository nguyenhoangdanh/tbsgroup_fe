"use client";

import React, { memo, useCallback, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DialogType, useDialog } from "@/context/DialogProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import './global-dialog.css';

const GlobalDialog = memo(() => {
    const { dialog, hideDialog, submit, isSubmitting, } = useDialog();
    const contentRef = useRef<HTMLDivElement>(null);

    // Xử lý vấn đề cuộn trên mobile
    useEffect(() => {
        if (dialog.open && contentRef.current) {
            const handleTouchMove = (e: TouchEvent) => {
                // Cho phép cuộn nếu đang trong vùng scrollable 
                if (contentRef.current && contentRef.current.contains(e.target as Node)) {
                    const scrollableWrapper = contentRef.current.querySelector('.dialog-scrollable-wrapper');
                    if (scrollableWrapper && scrollableWrapper.contains(e.target as Node)) {
                        // Cho phép cuộn trong scrollable area
                        e.stopPropagation();
                    }
                }
            };

            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            return () => {
                document.removeEventListener('touchmove', handleTouchMove);
            };
        }
    }, [dialog.open]);

    // Dialog title component
    const dialogTitle = useMemo(() => {
        if (!dialog.title) {
            return null;
        }

        return (
            <DialogHeader className="pb-4">
                <DialogTitle className="text-xl">{dialog.title}</DialogTitle>
                {dialog.description && (
                    <DialogDescription className="text-sm mt-1">{dialog.description}</DialogDescription>
                )}
            </DialogHeader>
        );
    }, [dialog.title, dialog.description]);

    // Dialog content component with error handling
    const dialogContent = useMemo(() => {
        // Render function children if provided
        if (typeof dialog.children === 'function') {
            try {
                const renderedContent = dialog.children({
                    data: dialog.data,
                    isSubmitting,
                    onSubmit: submit,
                    onClose: hideDialog,
                    isReadOnly: dialog.isReadOnly
                });

                // Check if we're dealing with a form that needs special handling
                const isFormContent =
                    React.isValidElement(renderedContent) &&
                    (renderedContent.type === 'form' ||
                        (renderedContent.props && renderedContent.props.children &&
                            React.isValidElement(renderedContent.props.children) &&
                            renderedContent.props.children.type === 'form'));

                // If it's already using DialogFormWrapper, return as is
                const alreadyWrapped =
                    React.isValidElement(renderedContent) &&
                    renderedContent.props &&
                    renderedContent.props.className &&
                    typeof renderedContent.props.className === 'string' &&
                    renderedContent.props.className.includes('dialog-content-container');

                if (alreadyWrapped) {
                    return renderedContent;
                }

                if (isFormContent) {
                    return (
                        <div className="dialog-content-container">
                            <div className="dialog-scrollable-wrapper">
                                <div className="fixed-form-wrapper">
                                    {renderedContent}
                                </div>
                            </div>
                        </div>
                    );
                }

                return renderedContent;

            } catch (error) {
                console.error("Error rendering function children:", error);
                return (
                    <div className="p-4 text-red-500">
                        Error rendering dialog content. Please try again or contact support.
                    </div>
                );
            }
        }

        // Render direct children if provided
        if (dialog.children) {
            // Check if children is already wrapped in our special container
            const alreadyWrapped =
                React.isValidElement(dialog.children) &&
                dialog.children.props &&
                dialog.children.props.className &&
                typeof dialog.children.props.className === 'string' &&
                dialog.children.props.className.includes('dialog-content-container');

            if (alreadyWrapped) {
                return dialog.children;
            }

            // If children is a React element, check if it's a form
            if (React.isValidElement(dialog.children)) {
                const isFormContent =
                    dialog.children.type === 'form' ||
                    (dialog.children.props && dialog.children.props.children &&
                        React.isValidElement(dialog.children.props.children) &&
                        dialog.children.props.children.type === 'form');

                if (isFormContent) {
                    return (
                        <div className="dialog-content-container">
                            <div className="dialog-scrollable-wrapper">
                                <div className="fixed-form-wrapper">
                                    {dialog.children}
                                </div>
                            </div>
                        </div>
                    );
                }
            }

            return dialog.children;
        }

        // Default delete dialog
        if (dialog.type === DialogType.DELETE) {
            return (
                <div className="p-4 space-y-4">
                    {/* <p className="text-center">
                        {dialog.title ? dialog.title : "Bạn có chắc chắn muốn xóa?"}
                    </p> */}
                    <div className="flex justify-end gap-2">
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

        // Handle batch delete dialog
        if (dialog.type === DialogType.BATCH_DELETE) {
            return (
                <div className="p-4 space-y-4">
                    {/* <p className="text-center">Bạn có chắc chắn muốn xóa các mục đã chọn?</p> */}
                    <div className="flex justify-end gap-2">
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
    }, [dialog.children, dialog.data, dialog.type, dialog.isReadOnly, isSubmitting, submit, hideDialog]);

    // Handle dialog open state changes
    const handleOpenChange = useCallback((open: boolean) => {
        if (!open && !isSubmitting && !dialog.preventOutsideClick) {
            hideDialog();
        }
    }, [hideDialog, isSubmitting, dialog.preventOutsideClick]);

    // Early return if dialog is not open
    if (!dialog.open) {
        return null;
    }

    // Get dialog width class based on size preference and device
    const getDialogSizeClass = () => {
        if (dialog.fullWidth) return "w-[95vw] md:w-full max-h-[90vh]";

        // Enhanced responsive sizing with better tablet support
        switch (dialog.maxWidth) {
            case 'xs': return "w-[95vw] sm:w-[85vw] md:w-[35%] lg:w-[20%] max-h-[90vh]";
            case 'sm': return "w-[95vw] sm:w-[85vw] md:w-[45%] lg:w-[25%] max-h-[90vh]";
            case 'md': return "w-[95vw] sm:w-[85vw] dialog-md-width max-h-[90vh]"; // Default size
            case 'lg': return "w-[95vw] sm:w-[90vw] md:w-[65%] lg:w-[50%] max-h-[90vh]";
            case 'xl': return "w-[95vw] sm:w-[90vw] md:w-[75%] lg:w-[60%] max-h-[90vh]";
            case '2xl': return "w-[95vw] sm:w-[90vw] md:w-[85%] lg:w-[75%] max-h-[90vh]";
            case '3xl': return "w-[95vw] sm:w-[90vw] md:w-[90%] lg:w-[85%] max-h-[90vh]";
            case 'full': return "w-[95vw] sm:w-[95vw] md:w-[95%] max-h-[90vh]";
            default: return "w-[95vw] sm:w-[85vw] dialog-md-width max-h-[90vh]"; // Default
        }
    };

    return (
        <Dialog
            open={dialog.open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent
                ref={contentRef}
                className={`${getDialogSizeClass()} overflow-hidden dialog-animation scroll-container`}
                onInteractOutside={isSubmitting || dialog.preventOutsideClick ? (e) => e.preventDefault() : undefined}
                onEscapeKeyDown={isSubmitting || dialog.preventOutsideClick ? (e) => e.preventDefault() : undefined}
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

// import React, { memo, useCallback, useMemo } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// import { DialogType, useDialog } from "@/context/DialogProvider";
// import { Button } from "@/components/ui/button";
// import { toast } from "@/hooks/use-toast";
// import { Loader } from "lucide-react";
// import './global-dialog.css';

// const GlobalDialog = memo(() => {
//     const { dialog, hideDialog, submit, isSubmitting } = useDialog();

//     // Dialog title component
//     const dialogTitle = useMemo(() => {
//         if (!dialog.title) {
//             return null;
//         }

//         return (
//             <DialogHeader className="pb-4">
//                 <DialogTitle className="text-xl">{dialog.title}</DialogTitle>
//                 {dialog.description && (
//                     <DialogDescription className="text-sm mt-1">{dialog.description}</DialogDescription>
//                 )}
//             </DialogHeader>
//         );
//     }, [dialog.title, dialog.description]);

//     // Dialog content component
//     const dialogContent = useMemo(() => {
//         // Render function children if provided
//         if (typeof dialog.children === 'function') {
//             try {
//                 return dialog.children({
//                     data: dialog.data,
//                     isSubmitting,
//                     onSubmit: submit,
//                     onClose: hideDialog,
//                     isReadOnly: dialog.isReadOnly
//                 });
//             } catch (error) {
//                 console.error("Error rendering function children:", error);
//                 return <div>Error rendering dialog content</div>;
//             }
//         }

//         // Render direct children if provided
//         if (dialog.children) {
//             return dialog.children;
//         }

//         // Default delete dialog
//         if (dialog.type === DialogType.DELETE) {
//             return (
//                 <div className="p-4 space-y-4">
//                     <p className="text-center">Bạn có chắc chắn muốn xóa?</p>
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
//                                     <Loader className="mr-2 h-4 w-4 animate-spin" />
//                                     Đang xóa...
//                                 </>
//                             ) : (
//                                 "Xóa"
//                             )}
//                         </Button>
//                         <Button
//                             variant="outline"
//                             disabled={isSubmitting}
//                             onClick={hideDialog}
//                         >
//                             Hủy
//                         </Button>
//                     </div>
//                 </div>
//             );
//         }

//         // Handle batch delete dialog
//         if (dialog.type === DialogType.BATCH_DELETE) {
//             return (
//                 <div className="p-4 space-y-4">
//                     <p className="text-center">Bạn có chắc chắn muốn xóa các mục đã chọn?</p>
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
//                                     <Loader className="mr-2 h-4 w-4 animate-spin" />
//                                     Đang xóa...
//                                 </>
//                             ) : (
//                                 "Xóa"
//                             )}
//                         </Button>
//                         <Button
//                             variant="outline"
//                             disabled={isSubmitting}
//                             onClick={hideDialog}
//                         >
//                             Hủy
//                         </Button>
//                     </div>
//                 </div>
//             );
//         }

//         return null;
//     }, [dialog.children, dialog.data, dialog.type, dialog.isReadOnly, isSubmitting, submit, hideDialog]);

//     // Handle open state changes
//     const handleOpenChange = useCallback((open: boolean) => {
//         if (!open && !isSubmitting) {
//             hideDialog();
//         }
//     }, [hideDialog, isSubmitting]);

//     // Early return if dialog is not open
//     if (!dialog.open) {
//         return null;
//     }

//     // Determine dialog width based on maxWidth prop
//     const getDialogWidth = () => {
//         if (dialog.fullWidth) return "w-[95vw] max-h-[90vh]";

//         switch (dialog.maxWidth) {
//             case 'sm': return "w-[95vw] sm:max-w-[420px] max-h-[90vh]";
//             case 'md': return "w-[95vw] sm:max-w-[540px] max-h-[90vh]";
//             case 'lg': return "w-[95vw] sm:max-w-[680px] max-h-[90vh]";
//             case 'xl': return "w-[95vw] sm:max-w-[800px] max-h-[90vh]";
//             case '2xl': return "w-[95vw] sm:max-w-[960px] max-h-[90vh]";
//             default: return "w-[95vw] sm:max-w-[540px] max-h-[90vh]";
//         }
//     };

//     return (
//         <Dialog
//             open={dialog.open}
//             onOpenChange={handleOpenChange}
//         >
//             <DialogContent
//                 className={`${getDialogWidth()} overflow-hidden`}
//                 onInteractOutside={isSubmitting || dialog.preventOutsideClick ? (e) => e.preventDefault() : undefined}
//                 onEscapeKeyDown={isSubmitting ? (e) => e.preventDefault() : undefined}
//             >
//                 {dialogTitle}
//                 <div
//                     className="custom-scrollbar overflow-y-auto pr-1"
//                     style={{
//                         maxHeight: 'calc(80vh - 120px)',
//                         position: 'relative',
//                         zIndex: 10 // Ensure form content has higher z-index than autocomplete suggestions
//                     }}
//                 >
//                     {dialogContent}
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// });

// GlobalDialog.displayName = "GlobalDialog";

// export default GlobalDialog;