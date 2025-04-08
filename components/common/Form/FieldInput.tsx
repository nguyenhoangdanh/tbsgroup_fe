import { Controller, FieldValues, Control, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import clsx from "clsx";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FieldInputProps<T extends FieldValues> {
    name: Path<T>;
    label: string;
    control: Control<T>;
    type?: string;
    placeholder?: string;
    className?: string;
    autoComplete?: string;
    disabled?: boolean;
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
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
    required = false,
    min = undefined,
    max = undefined,
    step = undefined,
}: FieldInputProps<T>) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState: { error } }) => {
                return (
                    <div className={clsx("flex flex-col gap-1 default-theme", className)}>
                        <Label htmlFor={name} className="text-left font-medium">
                            {label}
                            {required && <span className="text-red-500">*</span>}
                        </Label>
                        <div className="relative">
                            <Input
                                {...field}
                                id={name}
                                type={isPassword && !showPassword ? "password" : "text"}
                                placeholder={placeholder}
                                autoComplete={autoComplete}
                                disabled={disabled}
                                value={(typeof field.value === "number" && field.value === 0) ? "" : field.value || ""}
                                min={min}
                                max={max}
                                step={step}
                                className={clsx(
                                    "border rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none w-full field-input-fix",
                                    disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
                                    error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                                )}
                                aria-invalid={!!error}
                            />
                            {isPassword && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            )}
                        </div>
                        {error?.message && (
                            <p className="h-5 text-red-500 text-sm">{error.message}</p>
                        )}
                    </div>
                )
            }}
        />
    );
};
