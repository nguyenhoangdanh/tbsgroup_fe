import { Controller, FieldValues, Control, Path } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import clsx from "clsx";

interface Option {
    value: string | number;
    label: string;
}

interface FieldRadioProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    options: Option[];
    control: Control<T>;
    description?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    orientation?: 'horizontal' | 'vertical';
}

export const FieldRadio = <T extends FieldValues>({
    name,
    label,
    options,
    control,
    description,
    className,
    disabled = false,
    required = false,
    orientation = 'vertical',
}: FieldRadioProps<T>) => {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => {
                return (
                    <div className={clsx("flex flex-col gap-1", className)}>
                        <Label htmlFor={name} className="text-left font-medium">
                            {label}
                            {required && <span className="text-red-500">*</span>}
                        </Label>
                        {description && <p className="text-sm text-muted-foreground">{description}</p>}
                        <RadioGroup
                            value={field.value?.toString()}
                            onValueChange={field.onChange}
                            disabled={disabled}
                            className={clsx(
                                "mt-2",
                                orientation === 'horizontal' ? "flex flex-row gap-4" : "flex flex-col gap-2"
                            )}
                        >
                            {options.map((option) => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <RadioGroupItem
                                        id={`${name}-${option.value}`}
                                        value={option.value.toString()}
                                        disabled={disabled}
                                        className={clsx(
                                            error ? "border-red-500" : "border-gray-300"
                                        )}
                                    />
                                    <Label
                                        htmlFor={`${name}-${option.value}`}
                                        className={clsx(
                                            disabled && "cursor-not-allowed opacity-70"
                                        )}
                                    >
                                        {option.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                        {error?.message && (
                            <p className="mt-1 text-sm text-red-500">{error.message}</p>
                        )}
                    </div>
                );
            }}
        />
    );
};