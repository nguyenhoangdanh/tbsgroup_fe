import { Check, ChevronsUpDown } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

//Define option type for combobox
export interface ComboboxOption {
  value: string;
  label: string;
}

interface FieldComboboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  control: Control<T>;
  options: ComboboxOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  searchPlaceholder?: string;
}

export const FieldCombobox = <T extends FieldValues>({
  name,
  label,
  control,
  options = [], // Provide a default empty array
  placeholder = 'Chọn...',
  className,
  disabled = false,
  required = false,
  searchPlaceholder = 'Tìm kiếm...',
}: FieldComboboxProps<T>) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized filtered options
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Find the label for the current value
        const selectedOption = options.find(option => option.value === field.value);

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
                  role="combobox"
                  aria-expanded={open}
                  disabled={disabled}
                  className={cn(
                    'w-full justify-between',
                    disabled && 'bg-gray-100 cursor-not-allowed dark:bg-gray-800',
                    error ? 'border-red-500' : 'border-gray-300',
                  )}
                >
                  {selectedOption ? selectedOption.label : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="h-9"
                  />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy kết quả</CommandEmpty>
                    <CommandGroup>
                      {filteredOptions.map(option => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={currentValue => {
                            // Update field value and close popover
                            field.onChange(currentValue === field.value ? '' : currentValue);
                            setOpen(false);
                            setSearchTerm(''); // Reset search term
                          }}
                        >
                          {option.label}
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              field.value === option.value ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {error?.message && <p className="h-5 text-red-500 text-sm">{error.message}</p>}
          </div>
        );
      }}
    />
  );
};
