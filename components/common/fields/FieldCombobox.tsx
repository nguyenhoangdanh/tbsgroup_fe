import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import { Controller, FieldValues, Control, Path } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

//Define option type for combobox
export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
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
  emptyMessage?: string;
  allowCreate?: boolean;
  onCreateOption?: (value: string) => void | Promise<void>;
  createOptionLabel?: string;
  description?: string;
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
  emptyMessage = 'Không tìm thấy kết quả',
  allowCreate = false,
  onCreateOption,
  createOptionLabel = 'Tạo mới',
  description,
}: FieldComboboxProps<T>) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized filtered options for better performance
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return options.filter(option => 
      option.label.toLowerCase().includes(lowerSearchTerm) || 
      option.value.toLowerCase().includes(lowerSearchTerm)
    );
  }, [options, searchTerm]);

  // Handle creating new option
  const handleCreateOption = useCallback(async () => {
    if (!searchTerm || !onCreateOption) return;
    
    try {
      await onCreateOption(searchTerm);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to create option:', error);
    }
  }, [searchTerm, onCreateOption]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Find the label for the current value
        const selectedOption = options.find(option => option.value === field.value);

        return (
          <div className={cn('flex flex-col gap-1 default-theme', className)}>
            <div className="flex justify-between items-center">
              <Label htmlFor={name} className="text-left font-medium">
                {label}
                {required && <span className="text-red-500">*</span>}
              </Label>
            </div>
            
            {description && (
              <p className="text-sm text-muted-foreground -mt-1">{description}</p>
            )}
            
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
                    <CommandEmpty>
                      <div className="py-2 px-2 text-sm">{emptyMessage}</div>
                      
                      {allowCreate && searchTerm && (
                        <CommandItem 
                          onSelect={() => handleCreateOption()}
                          className="flex items-center gap-2 text-green-600 hover:text-green-700"
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span>{createOptionLabel}: "{searchTerm}"</span>
                        </CommandItem>
                      )}
                    </CommandEmpty>
                    
                    <CommandGroup>
                      {filteredOptions.map(option => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          disabled={option.disabled}
                          onSelect={currentValue => {
                            // Update field value and close popover
                            field.onChange(currentValue === field.value ? '' : currentValue);
                            setOpen(false);
                            setSearchTerm(''); // Reset search term
                          }}
                          className={cn(
                            option.disabled && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          <span className="flex-1 truncate">{option.label}</span>
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              field.value === option.value ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    
                    {allowCreate && searchTerm && filteredOptions.length > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandItem 
                          onSelect={() => handleCreateOption()}
                          className="flex items-center gap-2 text-green-600 hover:text-green-700"
                        >
                          <PlusCircle className="h-4 w-4" />
                          <span>{createOptionLabel}: "{searchTerm}"</span>
                        </CommandItem>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {error?.message && <p className="text-red-500 text-sm">{error.message}</p>}
          </div>
        );
      }}
    />
  );
};
