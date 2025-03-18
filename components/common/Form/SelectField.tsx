import { Controller, FieldValues, Control, Path } from "react-hook-form";
import { Label } from "@/components/ui/label";
import clsx from "clsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface Option {
    value: string | boolean | number;
    label: string;
}

interface SelectFieldProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    control: Control<T>;
    options: Option[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
}

export const SelectField = <T extends FieldValues>({
    name,
    label,
    control,
    options,
    placeholder = "Vui lòng chọn",
    className,
    disabled = false,
    required = false,
}: SelectFieldProps<T>) => {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => {
                console.log('error', error);
                console.log('field', field.value);
                return (
                    <div className={clsx("flex flex-col gap-1", className)}>
                        <Label htmlFor={name} className="text-left font-medium">
                            {label} {required && <span className="text-red-500">*</span>}
                        </Label>
                        <div className="relative">
                            <Select
                                disabled={disabled}
                                value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                                onValueChange={(value) => {
                                    // Convert value back to original type if possible
                                    const option = options.find(opt => String(opt.value) === value);
                                    field.onChange(option ? option.value : value);
                                }}
                            >
                                <SelectTrigger
                                    id={name}
                                    className={clsx(
                                        "w-full border rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none",
                                        disabled && "bg-gray-100 cursor-not-allowed",
                                        error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                                    )}
                                >
                                    <SelectValue placeholder={placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((option) => (
                                        <SelectItem
                                            key={String(option.value)}
                                            value={String(option.value)}
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