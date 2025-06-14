import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface FieldCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  indeterminate?: boolean;
  onIndeterminateChange?: (indeterminate: boolean) => void;
  noBorder?: boolean;
}

export const FieldCheckbox = <T extends FieldValues>({
  name,
  label,
  control,
  description,
  className,
  disabled = false,
  required = false,
  indeterminate = false,
  onIndeterminateChange,
  noBorder = false,
}: FieldCheckboxProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        return (
          <div
            className={cn(
              'flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4',
              className,
              noBorder && 'border-0',
            )}
          >
            <Checkbox
              id={name}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className={cn(error ? 'border-red-500' : 'border-gray-300')}
              aria-invalid={!!error}
              aria-describedby={error ? `${name}-error` : undefined}
              ref={(ref) => {
                if (ref) {
                  // Apply indeterminate state
                  if ('indeterminate' in ref) {
                    (ref as HTMLInputElement).indeterminate = indeterminate;
                  }
                }
              }}
            />
            <div className="space-y-1 leading-none">
              <label
                htmlFor={name}
                className={cn(
                  'font-medium cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-70',
                )}
              >
                {label}
                {required && <span className="text-red-500">*</span>}
              </label>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              {error?.message && <p className="text-sm text-red-500" id={`${name}-error`}>{error.message}</p>}
            </div>
          </div>
        );
      }}
    />
  );
};

export default FieldCheckbox;
