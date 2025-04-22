// "use client";

// import { useId, useState, useEffect, useRef, useCallback, memo } from "react";
// import { Controller, FieldValues, Control, Path } from "react-hook-form";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import clsx from "clsx";
// import { Eye, EyeOff } from "lucide-react";

// interface FieldInputProps<T extends FieldValues> {
//     name: Path<T>;
//     label: string;
//     control: Control<T>;
//     type?: string;
//     placeholder?: string;
//     className?: string;
//     autoComplete?: string;
//     disabled?: boolean;
//     required?: boolean;
//     min?: number;
//     max?: number;
//     step?: number;
//     onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
//     value?: string | number;
// }

// const FieldInputComponent = <T extends FieldValues>({
//     name,
//     label,
//     control,
//     type = "text",
//     placeholder = "",
//     autoComplete,
//     className,
//     disabled = false,
//     required = false,
//     min,
//     max,
//     step,
//     onChange,
//     value: externalValue,
// }: FieldInputProps<T>) => {
//     const id = useId();
//     const [showPassword, setShowPassword] = useState(false);
//     const isPassword = type === "password";

//     // Track the previous value to optimize renders
//     const prevValueRef = useRef<string | number | undefined>();

//     // Debounce timer reference
//     const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

//     // Handler for input changes with debounce
//     const handleDebouncedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (e: any) => void) => {
//         // Call the external onChange immediately if provided
//         if (onChange) {
//             onChange(e);
//         }

//         // Clear previous timer if exists
//         if (debounceTimerRef.current) {
//             clearTimeout(debounceTimerRef.current);
//         }

//         // Set new timer for the form field onChange
//         debounceTimerRef.current = setTimeout(() => {
//             fieldOnChange(e);
//             debounceTimerRef.current = null;
//         }, 100);
//     }, [onChange]);

//     // Clean up debounce timer on unmount
//     useEffect(() => {
//         return () => {
//             if (debounceTimerRef.current) {
//                 clearTimeout(debounceTimerRef.current);
//             }
//         };
//     }, []);

//     // Toggle password visibility
//     const togglePasswordVisibility = useCallback(() => {
//         setShowPassword((prev) => !prev);
//     }, []);

//     return (
//         <Controller
//             control={control}
//             name={name}
//             render={({ field, fieldState: { error } }) => {
//                 // Track the current value in ref
//                 useEffect(() => {
//                     prevValueRef.current = field.value;
//                 }, [field.value]);

//                 // Determine display value - prioritize external value if provided
//                 const displayValue = externalValue !== undefined
//                     ? externalValue
//                     : (typeof field.value === "number" && field.value === 0)
//                         ? ""
//                         : field.value || "";

//                 return (
//                     <div className={clsx("flex flex-col gap-1", className)}>
//                         <Label htmlFor={`${id}-${name}`} className="text-sm font-medium">
//                             {label}
//                             {required && <span className="text-red-500">*</span>}
//                         </Label>
//                         <div className="relative">
//                             <Input
//                                 {...field}
//                                 id={`${id}-${name}`}
//                                 type={isPassword && !showPassword ? "password" : type}
//                                 placeholder={placeholder}
//                                 autoComplete={autoComplete}
//                                 disabled={disabled}
//                                 value={displayValue}
//                                 min={min}
//                                 max={max}
//                                 step={step}
//                                 onChange={(e) => {
//                                     // Use debounced change handler
//                                     handleDebouncedChange(e, field.onChange);
//                                 }}
//                                 className={clsx(
//                                     "border rounded-md px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none w-full",
//                                     disabled && "bg-gray-100 cursor-not-allowed dark:bg-gray-800",
//                                     error ? "border-red-500 focus:ring-red-500" : "border-gray-300"
//                                 )}
//                                 aria-invalid={!!error}
//                             />
//                             {isPassword && (
//                                 <button
//                                     type="button"
//                                     onClick={togglePasswordVisibility}
//                                     className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
//                                 >
//                                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                                 </button>
//                             )}
//                         </div>
//                         {error?.message && (
//                             <p className="text-red-500 text-sm mt-1">{error.message}</p>
//                         )}
//                     </div>
//                 );
//             }}
//         />
//     );
// };

// // Memoize component to prevent unnecessary re-renders
// export const FieldInput = memo(FieldInputComponent) as typeof FieldInputComponent;

// export default FieldInput;




























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
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value?: string | number;
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
    onChange,
    value: externalValue,
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
