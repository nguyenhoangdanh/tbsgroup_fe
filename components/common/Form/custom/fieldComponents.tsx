'use client';

import React, { memo } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/**
 * Component hiển thị thông báo lỗi
 */
export const ErrorMessage = memo(
  ({ error, name }: { error?: { message?: string }; name?: string }) => {
    if (!error?.message) return null;

    return (
      <p id={name ? `${name}-error` : undefined} className="text-sm text-red-500 mt-1" role="alert">
        {error.message}
      </p>
    );
  },
);
ErrorMessage.displayName = 'ErrorMessage';

/**
 * Component hiển thị label
 */
export const FieldLabel = memo(
  ({ name, label, required }: { name: string; label: string; required?: boolean }) => (
    <Label htmlFor={name} className="font-medium">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  ),
);
FieldLabel.displayName = 'FieldLabel';

/**
 * Component hiển thị mô tả
 */
export const FieldDescription = memo(({ description }: { description?: string }) => {
  if (!description) return null;
  return <p className="text-sm text-muted-foreground">{description}</p>;
});
FieldDescription.displayName = 'FieldDescription';

/**
 * Component container chung cho field
 */
export const FieldContainer = memo(
  ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('form-field-container space-y-2', className)}>{children}</div>
  ),
);
FieldContainer.displayName = 'FieldContainer';

/**
 * Component container cho checkbox/radio
 */
export const CheckFieldContainer = memo(
  ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn('flex items-start space-x-3 space-y-0 rounded-md border p-4', className)}>
      {children}
    </div>
  ),
);
CheckFieldContainer.displayName = 'CheckFieldContainer';
