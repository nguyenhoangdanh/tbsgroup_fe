'use client';

import { Eye, EyeOff, Plus, Minus } from 'lucide-react';
import { useState, memo, useId, useMemo } from 'react';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldInputProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  control: Control<T>;
  type?: string;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string | number;
  description?: string;
  prefixAddon?: React.ReactNode;
  suffixAddon?: React.ReactNode;
  showNumberControls?: boolean; // display increment/decrement buttons for number inputs
  autoFocus?: boolean;
  maxLength?: number;
  pattern?: string;
}

export const FieldInput = <T extends FieldValues>({
  name,
  label,
  control,
  type = 'text',
  placeholder = '',
  autoComplete,
  className,
  disabled = false,
  readOnly = false,
  required = false,
  min = undefined,
  max = undefined,
  step = undefined,
  description,
  prefixAddon,
  suffixAddon,
  showNumberControls = false,
  autoFocus = false,
  maxLength,
  pattern,
}: FieldInputProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const isNumber = type === 'number';
  const id = useId();

  // Xử lý số lượng cho trường nhập số
  const handleIncrement = (value: any, onChange: (value: any) => void) => {
    const currentValue = parseFloat(value) || 0;
    const stepValue = step || 1;
    const newValue = currentValue + stepValue;
    if (max !== undefined && newValue > max) return;
    onChange(newValue);
  };

  const handleDecrement = (value: any, onChange: (value: any) => void) => {
    const currentValue = parseFloat(value) || 0;
    const stepValue = step || 1;
    const newValue = currentValue - stepValue;
    if (min !== undefined && newValue < min) return;
    onChange(newValue);
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        const effectiveValue = 
          typeof field.value === 'number' && field.value === 0 
            ? '0' // Hiển thị 0 thay vì chuỗi rỗng cho giá trị 0
            : field.value || '';

        // Tạo class cho wrapper dựa trên loại addon
        const wrapperClass = useMemo(() => {
          return cn(
            'flex flex-col gap-1 default-theme',
            className
          );
        }, [className]);

        // Tạo class cho input container
        const inputContainerClass = useMemo(() => {
          return cn(
            'relative flex w-full',
            (prefixAddon || suffixAddon || (isNumber && showNumberControls)) && 'flex items-center',
            error ? 'has-error' : ''
          );
        }, [prefixAddon, suffixAddon, isNumber, showNumberControls, error]);

        // Calculate the actual input type based on the isPassword flag and showPassword state
        const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

        return (
          <div className={wrapperClass}>
            {label && (
              <Label htmlFor={`${id}-${name}`} className="text-left font-medium">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            
            {description && (
              <p className="text-sm text-muted-foreground -mt-1 mb-1">{description}</p>
            )}
            
            <div className={inputContainerClass}>
              {prefixAddon && (
                <div className="flex items-center justify-center px-3 border border-r-0 border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-l-md">
                  {prefixAddon}
                </div>
              )}
              
              <Input
                {...field}
                id={`${id}-${name}`}
                type={inputType}
                placeholder={placeholder}
                autoComplete={autoComplete}
                disabled={disabled}
                readOnly={readOnly}
                value={effectiveValue}
                min={min}
                max={max}
                step={step}
                autoFocus={autoFocus}
                maxLength={maxLength}
                pattern={pattern}
                className={cn(
                  'flex-grow border transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none w-full',
                  prefixAddon && 'rounded-l-none',
                  suffixAddon && 'rounded-r-none',
                  (isNumber && showNumberControls) && 'rounded-none',
                  disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                  readOnly && 'bg-gray-50 cursor-default dark:bg-gray-900',
                  error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
                )}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-${name}-error` : undefined}
              />
              
              {isNumber && showNumberControls && (
                <div className="flex flex-col border border-l-0 border-gray-300 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => handleIncrement(field.value, field.onChange)}
                    disabled={disabled || readOnly || (max !== undefined && (parseFloat(field.value) || 0) >= max)}
                    className="flex items-center justify-center px-2 py-0 h-[1.35rem] border-b border-gray-300 dark:border-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-tr-md"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecrement(field.value, field.onChange)}
                    disabled={disabled || readOnly || (min !== undefined && (parseFloat(field.value) || 0) <= min)}
                    className="flex items-center justify-center px-2 py-0 h-[1.35rem] bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-br-md"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              )}
              
              {suffixAddon && !isPassword && (
                <div className="flex items-center justify-center px-3 border border-l-0 border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-r-md">
                  {suffixAddon}
                </div>
              )}
              
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
            
            {error?.message && <p className="h-5 text-red-500 text-sm" id={`${id}-${name}-error`}>{error.message}</p>}
          </div>
        );
      }}
    />
  );
};

// Sử dụng memo để tránh re-render không cần thiết
export default memo(FieldInput) as typeof FieldInput;
