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
        // Convert field value to string for Select component
        const stringValue = field.value !== undefined && field.value !== null 
          ? String(field.value) 
          : '';

        return (
          <div className={clsx('flex flex-col gap-1', className)}>
            <Label htmlFor={`${id}-${name}`} className="text-left font-medium">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Select
                disabled={disabled}
                value={stringValue} 
                onValueChange={(selectedValue) => {
                  // Find the matching option and use its original value
                  const option = options.find(opt => String(opt.value) === selectedValue);
                  field.onChange(option ? option.value : selectedValue);
                }}
              >
                <SelectTrigger
                  id={`${id}-${name}`}
                  className={clsx(
                    'w-full border rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
                    disabled && 'bg-gray-100 cursor-not-allowed',
                    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
                  )}
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="z-50 max-h-60"
                  align="start"
                >
                  {options.map((option) => (
                    <SelectItem 
                      key={`${String(option.value)}-${option.label}`} 
                      value={String(option.value)}
                      className="cursor-pointer hover:bg-gray-100"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error?.message && <p className="h-5 text-red-500 text-sm">{error.message}</p>}
          </div>
        );
      }}
    />
  );
};
