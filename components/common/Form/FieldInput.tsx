import { Controller, FieldValues, Control, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import clsx from "clsx";

interface FieldInputProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    control: Control<T>;
    type?: string;
    placeholder?: string;
    className?: string;
    autoComplete?: string;
    disabled?: boolean;
}

export const FieldInput = <T extends FieldValues>({
    name,
    label,
    control,
    type = "text",
    placeholder = "",
    autoComplete,
    className,
    disabled = false,
}: FieldInputProps<T>) => {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => (
                <div className={clsx("flex flex-col gap-1", className)}>
                    <Label htmlFor={name} className="text-left font-medium">
                        {label}
                    </Label>
                    <Input
                        {...field}
                        id={name}
                        type={type}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        disabled={disabled}
                        value={field.value || ""}
                        className={clsx(
                            "border rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none",
                            error ? "border-red-500" : "border-gray-300"
                        )}
                        aria-invalid={error ? "true" : "false"}
                    />
                    <p className="h-5 text-red-500 text-sm">
                        {error?.message}
                    </p>
                </div>
            )}
        />
    );
};
