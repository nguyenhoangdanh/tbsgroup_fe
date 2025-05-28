import { SquarePen } from 'lucide-react';
import React from 'react';
import { toast } from 'react-toast-kit';

import { BaseData } from '../data-table';

import { Button } from '@/components/ui/button';
import { DialogType, useDialog, DialogChildrenProps } from '@/contexts/DialogProvider';

interface EditActionDialogProps<T extends BaseData = BaseData> {
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
  data: T;
  onClick?: ((data: T) => void) | (() => void);
}

export function EditActionDialog<T extends BaseData = BaseData>({
  name,
  description,
  children,
  onSubmit,
  buttonText = 'Chỉnh sửa',
  buttonIcon = <SquarePen size={16} />,
  buttonVariant = 'default',
  buttonSize = 'default',
  fullWidth = false,
  disableButton = false,
  onClose,
  data,
  onClick,
}: EditActionDialogProps<T>) {
  const { showDialog } = useDialog<T>();

  const handleOpenDialog = () => {
    showDialog({
      type: DialogType.EDIT,
      title: `Chỉnh sửa ${name}`,
      description: description,
      fullWidth: fullWidth,
      data: data,
      children:
        typeof children === 'function'
          ? props => {
              return children({
                ...props,
                data: props.data || data,
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
            await onSubmit(formData as T);
            toast({
              title: `Cập nhật ${name.toLowerCase()} thành công`,
              variant: 'default',
            });

            return true;
          } catch (error) {
            toast({
              title: `Lỗi khi cập nhật ${name.toLowerCase()}`,
              description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
              variant: 'error',
            });
            throw error; // Ném lại lỗi để DialogProvider không đóng dialog
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
  const buttonClasses =
    buttonSize === 'icon'
      ? 'bg-blue-800 hover:bg-blue-700 text-white h-7 w-7 md:w-8 md:h-8 p-0'
      : `flex items-center gap-1 bg-blue-800 hover:bg-blue-700 text-white ${fullWidth ? 'w-full' : 'sm:w-auto'}`;

  const handleClick = () => {
    if (onClick) {
      if (onClick.length > 0) {
        (onClick as (data: T) => void)(data);
      } else {
        (onClick as () => void)();
      }
    } else {
      handleOpenDialog();
    }
  };

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      className={buttonClasses}
      disabled={disableButton}
      onClick={handleClick}
      title={buttonText || 'Chỉnh sửa'}
      aria-label={buttonText || 'Chỉnh sửa'}
    >
      {buttonIcon}
      {buttonSize !== 'icon' && buttonText}
    </Button>
  );
}
