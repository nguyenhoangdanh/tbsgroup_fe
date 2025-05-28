'use client';
import { Plus } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toast-kit';

import { Button } from '@/components/ui/button';
import { DialogType, useDialog, DialogChildrenProps } from '@/contexts/DialogProvider';

interface CreateActionDialogProps<T = any> {
  name: string;
  description?: string;
  children?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
  onSubmit?: (data?: T) => Promise<void | boolean>;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
  disableButton?: boolean;
  onClose?: () => void;
  onClick?: () => void;
}

export function CreateActionDialog<T = any>({
  name,
  description,
  children,
  onSubmit,
  buttonText = 'Tạo mới',
  buttonIcon = <Plus size={16} />,
  buttonVariant = 'default',
  buttonSize = 'default',
  fullWidth = false,
  disableButton = false,
  onClose,
  onClick,
}: CreateActionDialogProps<T>) {
  const { showDialog } = useDialog<T>();

  const handleOpenDialog = () => {
    // If there's no children component to show in dialog, don't open it
    if (!children) return;

    showDialog({
      type: DialogType.CREATE,
      title: `Tạo mới ${name}`,
      description: description,
      fullWidth: fullWidth,
      children:
        typeof children === 'function'
          ? props => {
              return children({
                ...props,
                onClose: () => {
                  props.onClose();
                  if (onClose) {
                    onClose();
                  }
                },
              });
            }
          : children,
      onSubmit: async formData => {
        if (onSubmit) {
          try {
            const result = await onSubmit(formData);
            toast({
              title: `Tạo mới ${name.toLowerCase()} thành công`,
              variant: 'default',
            });

            if (result === true) {
              if (onClose) {
                onClose();
              }
            }

            return result;
          } catch (error) {
            console.error('[CreateActionDialog] onSubmit error:', error);
            toast({
              title: `Lỗi khi tạo mới ${name.toLowerCase()}`,
              description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
              variant: 'error',
            });
            throw error;
          }
        }
      },
      onClose: () => {
        if (onClose) {
          onClose();
        }
      },
    });
  };

  const handleClick = () => {
    // If onClick is provided, call it
    if (onClick) {
      onClick();
      // Only open dialog if children exists AND onClick doesn't handle dialog opening itself
      if (children) {
        handleOpenDialog();
      }
    } else {
      // If no onClick, open dialog if children exists
      if (children) {
        handleOpenDialog();
      }
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      className={`flex items-center gap-1 bg-green-800 text-white hover:bg-green-700 ${fullWidth ? 'w-full' : 'sm:w-auto'}`}
      disabled={disableButton}
      onClick={handleClick}
    >
      {buttonIcon}
      {buttonText}
    </Button>
  );
}
