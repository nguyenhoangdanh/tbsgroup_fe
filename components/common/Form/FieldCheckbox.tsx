import clsx from 'clsx';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';

interface FieldCheckboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  description?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const FieldCheckbox = <T extends FieldValues>({
  name,
  label,
  control,
  description,
  className,
  disabled = false,
  required = false,
}: FieldCheckboxProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        return (
          <div
            className={clsx(
              'flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4',
              className,
            )}
          >
            <Checkbox
              id={name}
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className={clsx(error ? 'border-red-500' : 'border-gray-300')}
            />
            <div className="space-y-1 leading-none">
              <label
                htmlFor={name}
                className={clsx(
                  'font-medium cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-70',
                )}
              >
                {label}
                {required && <span className="text-red-500">*</span>}
              </label>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              {error?.message && <p className="text-sm text-red-500">{error.message}</p>}
            </div>
          </div>
        );
      }}
    />
  );
};
