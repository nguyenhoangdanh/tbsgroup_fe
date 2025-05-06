// components/ui/multi-select.tsx
'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface MultiSelectProps {
    values: string[];
    onValuesChange: (values: string[]) => void;
    children: React.ReactNode;
}

export const MultiSelect = ({
    values,
    onValuesChange,
    children,
}: MultiSelectProps) => {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            {children}
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Tìm kiếm..." />
                    <CommandList>
                        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
                        <CommandGroup>
                            {React.Children.map(
                                (children as React.ReactElement).props.children,
                                (child) => {
                                    if (React.isValidElement(child) && child.type === MultiSelectItem) {
                                        const value = child.props.value;
                                        const isSelected = values.includes(value);

                                        return React.cloneElement(child, {
                                            onSelect: () => {
                                                if (isSelected) {
                                                    onValuesChange(values.filter((v) => v !== value));
                                                } else {
                                                    onValuesChange([...values, value]);
                                                }
                                            },
                                            selected: isSelected,
                                        });
                                    }
                                    return child;
                                }
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

interface MultiSelectTriggerProps {
    children: React.ReactNode;
    id?: string;
    className?: string;
}

export const MultiSelectTrigger = ({
    children,
    id,
    className,
}: MultiSelectTriggerProps) => {
    return (
        <PopoverTrigger asChild>
            <Button
                id={id}
                variant="outline"
                role="combobox"
                className={cn('w-full justify-between', className)}
            >
                {children}
            </Button>
        </PopoverTrigger>
    );
};

interface MultiSelectValueProps {
    placeholder: string;
}

export const MultiSelectValue = ({ placeholder }: MultiSelectValueProps) => {
    const { values } = React.useContext(MultiSelectContext);

    if (!values || values.length === 0) {
        return <span className="text-muted-foreground">{placeholder}</span>;
    }

    return (
        <div className="flex items-center gap-1 overflow-hidden">
            <span className="truncate">{values.length} đã chọn</span>
        </div>
    );
};

interface MultiSelectItemProps {
    value: string;
    children: React.ReactNode;
    onSelect?: () => void;
    selected?: boolean;
}

export const MultiSelectItem = ({
    value,
    children,
    onSelect,
    selected,
}: MultiSelectItemProps) => {
    return (
        <CommandItem
            value={value}
            onSelect={onSelect}
            className="flex items-center justify-between"
        >
            {children}
            {selected && <Check className="h-4 w-4" />}
        </CommandItem>
    );
};

// Context for MultiSelect
const MultiSelectContext = React.createContext<{
    values: string[];
}>({
    values: [],
});

export const MultiSelectContent = SelectPrimitive.Content;