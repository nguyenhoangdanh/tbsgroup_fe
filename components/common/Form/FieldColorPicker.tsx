import { Check } from 'lucide-react';
import React, { useState } from 'react';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Predefined color palette
const COLOR_PALETTE = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FDCB6E', // Yellow
  '#6C5CE7', // Purple
  '#FF8A5B', // Orange
  '#2ECC71', // Green
  '#34495E', // Dark Blue-Gray
  '#A3CB38', // Lime Green
  '#FAD02E', // Mustard
  '#6D214F', // Dark Maroon
  '#182C61', // Dark Navy
];

interface FieldColorPickerProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  customColors?: string[];
}

export const FieldColorPicker = <T extends FieldValues>({
  name,
  label,
  control,
  placeholder = 'Chọn màu',
  className,
  disabled = false,
  required = false,
  customColors,
}: FieldColorPickerProps<T>) => {
  const [open, setOpen] = useState(false);

  //  Use custom colors if provided, otherwise use default palette
  const colors = customColors || COLOR_PALETTE;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        return (
          <div className={cn('flex flex-col gap-1 default-theme', className)}>
            <Label htmlFor={name} className="text-left font-medium">
              {label}
              {required && <span className="text-red-500">*</span>}
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    'w-full justify-between',
                    disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                    error ? 'border-red-500' : 'border-gray-300',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {field.value ? (
                      <>
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: field.value }}
                        />
                        <span>{field.value}</span>
                      </>
                    ) : (
                      placeholder
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-4">
                <div className="grid grid-cols-6 gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        field.onChange(color);
                        setOpen(false);
                      }}
                      className={cn(
                        'w-8 h-8 rounded-full hover:ring-2 hover:ring-offset-2 transition-all',
                        field.value === color ? 'ring-2 ring-blue-500 ring-offset-2' : '',
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    >
                      {field.value === color && (
                        <Check className="w-full h-full text-white p-1" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
                {/* Manual color input */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={field.value || ''}
                    onChange={e => field.onChange(e.target.value)}
                    placeholder="Nhập mã màu (VD: #FF0000)"
                    className={cn(
                      'w-full px-2 py-1 border rounded-md',
                      error ? 'border-red-500' : 'border-gray-300',
                    )}
                  />
                </div>
              </PopoverContent>
            </Popover>
            {error?.message && <p className="h-5 text-red-500 text-sm">{error.message}</p>}
          </div>
        );
      }}
    />
  );
};
