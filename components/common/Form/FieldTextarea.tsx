import { Controller, FieldValues, Control, Path } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import clsx from "clsx";

interface FieldTextareaProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    control: Control<T>;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    rows?: number;
}

export const FieldTextarea = <T extends FieldValues>({
    name,
    label,
    control,
    placeholder = "",
    className,
    disabled = false,
    required = false,
    rows = 3,
}: FieldTextareaProps<T>) => {
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
                        <Textarea
                            {...field}
                            id={name}
                            placeholder={placeholder}
                            disabled={disabled}
                            value={field.value ?? ""}
                            rows={rows}
                            className={clsx(
                                "resize-none border rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none",
                                disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                                error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                            )}
                            aria-invalid={!!error}
                        />
                        {error?.message && (
                            <p className="h-5 text-red-500 text-sm">{error.message}</p>
                        )}
                    </div>
                )
            }}
        />
    );
};