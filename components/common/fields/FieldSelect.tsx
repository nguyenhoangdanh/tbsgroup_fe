'use client';
import clsx from 'clsx';
import { useId } from 'react';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Option {
  value: string | boolean | number;
  label: string;
}

interface FieldSelectProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const FieldSelect = <T extends FieldValues>({
  name,
  label,
  control,
  options,
  placeholder = 'Vui lòng chọn',
  className,
  disabled = false,
  required = false,
}: FieldSelectProps<T>) => {
  const id = useId();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Luôn chuyển đổi giá trị thành string để hoạt động với Select component
        const stringValue =
          field.value !== undefined && field.value !== null
            ? String(field.value)
            : '';

        // Tìm option hiện tại để hiển thị label
        const selectedOption = options.find(
          (opt) => String(opt.value) === stringValue || opt.value === field.value,
        );

        return (
          <div className={clsx('flex flex-col gap-1', className)}>
            <Label htmlFor={`${id}-${name}`} className="text-left font-medium">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Select
                disabled={disabled}
                value={stringValue || undefined}
                onValueChange={(value) => {
                  // Tìm option tương ứng để lấy giá trị gốc (có thể là string, number, boolean)
                  const option = options.find(
                    (opt) => String(opt.value) === value,
                  );
                  // Sử dụng giá trị gốc nếu tìm thấy option, ngược lại dùng string value
                  const finalValue = option ? option.value : value;
                  field.onChange(finalValue);
                  field.onBlur(); // Kích hoạt validation
                }}
              >
                <SelectTrigger
                  id={`${id}-${name}`}
                  className={clsx(
                    'w-full border rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
                    disabled && 'bg-gray-100 cursor-not-allowed',
                    error
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300',
                  )}
                >
                  {selectedOption ? (
                    <span className="block truncate">{selectedOption.label}</span>
                  ) : (
                    <SelectValue placeholder={placeholder} />
                  )}
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="z-[9999] max-h-60 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                  align="start"
                  sideOffset={4}
                >
                  {options.map((option) => (
                    <SelectItem
                      key={`${String(option.value)}-${option.label}`}
                      value={String(option.value)}
                      className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error?.message && (
              <p className="h-5 text-red-500 text-sm">{error.message}</p>
            )}
          </div>
        );
      }}
    />
  );
};
