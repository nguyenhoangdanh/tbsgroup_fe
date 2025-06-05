'use client';

import React, { memo } from 'react';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface FieldSwitchProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  reversed?: boolean; // Đảo ngược vị trí của switch và label
  onChangeEffect?: (checked: boolean) => void; // Callback khi giá trị thay đổi
  size?: 'default' | 'sm' | 'lg';
  labelClass?: string;
}

export const FieldSwitch = <T extends FieldValues>({
  name,
  label,
  control,
  description,
  className,
  disabled = false,
  required = false,
  reversed = false,
  onChangeEffect,
  size = 'default',
  labelClass,
}: FieldSwitchProps<T>) => {
  // Xác định các lớp CSS dựa trên kích thước
  const getSizeClass = (size: string) => {
    switch (size) {
      case 'sm':
        return 'h-4 w-8';
      case 'lg':
        return 'h-7 w-14';
      default:
        return 'h-5 w-10';
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Handle changes including any side effects
        const handleChange = (checked: boolean) => {
          field.onChange(checked);
          if (onChangeEffect) {
            onChangeEffect(checked);
          }
        };

        return (
          <div
            className={cn(
              'flex items-center space-x-2 rounded-md p-3',
              error ? 'border border-red-500' : 'border',
              className
            )}
          >
            {reversed ? (
              <>
                <div className="flex flex-col flex-grow">
                  <Label htmlFor={name} className={cn("font-medium", labelClass)}>
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
                  {error?.message && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
                </div>
                <Switch
                  id={name}
                  checked={field.value === true}
                  onCheckedChange={handleChange}
                  disabled={disabled}
                  className={cn(getSizeClass(size))}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${name}-error` : undefined}
                />
              </>
            ) : (
              <>
                <Switch
                  id={name}
                  checked={field.value === true}
                  onCheckedChange={handleChange}
                  disabled={disabled}
                  className={cn(getSizeClass(size))}
                  aria-invalid={!!error}
                  aria-describedby={error ? `${name}-error` : undefined}
                />
                <div className="flex flex-col flex-grow">
                  <Label htmlFor={name} className={cn("font-medium", labelClass)}>
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
                  {error?.message && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
                </div>
              </>
            )}
          </div>
        );
      }}
    />
  );
};

export default memo(FieldSwitch) as typeof FieldSwitch;