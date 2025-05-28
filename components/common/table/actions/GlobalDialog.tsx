'use client';

import { Loader } from 'lucide-react';
import React, { memo, useCallback, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import './global-dialog.css';
import { DialogType, useDialog, DialogChildrenProps } from '@/contexts/DialogProvider';

import { toast } from 'react-toast-kit';

const GlobalDialog = memo(() => {
  const { dialog, hideDialog, submit, isSubmitting } = useDialog();

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

  // Improved dialog content component with proper TypeScript support
  const renderDialogContent = () => {
    // Handle function children with proper typing
    if (typeof dialog.children === 'function') {
      try {
        const childrenProps: DialogChildrenProps = {
          data: dialog.data,
          isSubmitting,
          onSubmit: submit,
          onClose: hideDialog,
          isReadOnly: dialog.isReadOnly,
          type: dialog.type,
        };
        
        return dialog.children(childrenProps);
      } catch (error) {
        console.error('[GlobalDialog] Error rendering function children:', error);
        return (
          <div className="p-4 text-red-600">
            Error rendering dialog content. Please check the console for details.
          </div>
        );
      }
    }

    // Direct children render
    if (dialog.children) {
      return dialog.children;
    }

    // Default delete dialog
    if (dialog.type === DialogType.DELETE) {
      return (
        <div className="p-4 space-y-4">
          <p className="text-center">Bạn có chắc chắn muốn xóa?</p>
          <div className="flex justify-center gap-2">
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={async () => {
                try {
                  await submit(dialog.data);
                  toast({
                    title: 'Xóa thành công',
                    variant: 'default',
                  });
                } catch (error) {
                  toast({
                    title: 'Thao tác xóa thất bại',
                    description: error instanceof Error ? error.message : undefined,
                    variant: 'error',
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
                'Xóa'
              )}
            </Button>
            <Button variant="outline" disabled={isSubmitting} onClick={hideDialog}>
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
          <p className="text-center">Bạn có chắc chắn muốn xóa các mục đã chọn?</p>
          <div className="flex justify-center gap-2">
            <Button
              variant="destructive"
              disabled={isSubmitting}
              onClick={async () => {
                try {
                  await submit(dialog.data);
                  toast({
                    title: 'Xóa thành công',
                    variant: 'default',
                  });
                } catch (error) {
                  toast({
                    title: 'Thao tác xóa thất bại',
                    description: error instanceof Error ? error.message : undefined,
                    variant: 'error',
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
                'Xóa'
              )}
            </Button>
            <Button variant="outline" disabled={isSubmitting} onClick={hideDialog}>
              Hủy
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Handle open state changes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open && !isSubmitting && !dialog.preventOutsideClick) {
        hideDialog();
      }
    },
    [hideDialog, isSubmitting, dialog.preventOutsideClick],
  );

  // Early return if dialog is not open
  if (!dialog.open) {
    return null;
  }

  // Determine dialog width based on maxWidth prop
  const getDialogWidth = () => {
    if (dialog.fullWidth) return 'w-[95vw] max-h-[90vh]';

    switch (dialog.maxWidth) {
      case 'xs':
        return 'w-[95vw] sm:max-w-[320px] max-h-[90vh]';
      case 'sm':
        return 'w-[95vw] sm:max-w-[420px] max-h-[90vh]';
      case 'md':
        return 'w-[95vw] sm:max-w-[540px] max-h-[90vh]';
      case 'lg':
        return 'w-[95vw] sm:max-w-[680px] max-h-[90vh]';
      case 'xl':
        return 'w-[95vw] sm:max-w-[800px] max-h-[90vh]';
      case '2xl':
        return 'w-[95vw] sm:max-w-[960px] max-h-[90vh]';
      case '3xl':
        return 'w-[95vw] sm:max-w-[1140px] max-h-[90vh]';
      case 'full':
        return 'w-[98vw] max-h-[95vh]';
      default:
        return 'w-[95vw] sm:max-w-[540px] max-h-[90vh]';
    }
  };

  return (
    <Dialog open={dialog.open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`${getDialogWidth()} overflow-hidden dialog-content`}
        onInteractOutside={
          isSubmitting || dialog.preventOutsideClick ? e => e.preventDefault() : undefined
        }
        onEscapeKeyDown={isSubmitting || dialog.preventOutsideClick ? e => e.preventDefault() : undefined}
      >
        {dialogTitle}
        <div
          className="custom-scrollbar overflow-y-auto pr-1"
          style={{
            maxHeight: 'calc(80vh - 120px)',
            position: 'relative',
            zIndex: 10, // Ensure form content has higher z-index than autocomplete suggestions
          }}
        >
          {renderDialogContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
});

GlobalDialog.displayName = 'GlobalDialog';

export default GlobalDialog;
