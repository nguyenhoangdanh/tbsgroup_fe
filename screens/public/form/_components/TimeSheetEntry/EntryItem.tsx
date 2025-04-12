// components/TimeSheetEntry/EntryItem.tsx

"use client";
import React from "react";
import { motion } from "framer-motion";
import { Controller, useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Copy, XCircle, Trash } from "lucide-react";
import { TimeSheetType, TIME_SLOTS, REASON_OPTIONS } from "@/schemas/timesheet";

interface EntryItemProps {
    entry: any;
    index: number;
    isReadOnly?: boolean;
    isSubmitting?: boolean;
    onTimePickerOpen: (entryId: string) => void;
    onDuplicate: (index: number) => void;
    onClearSlots: (index: number) => void;
    onRemove: (index: number) => void;
    fields: any[];
}

const EntryItem: React.FC<EntryItemProps> = ({
    entry,
    index,
    isReadOnly = false,
    isSubmitting = false,
    onTimePickerOpen,
    onDuplicate,
    onClearSlots,
    onRemove,
    fields
}) => {
    // Access form methods from parent form
    const { control, watch } = useFormContext<TimeSheetType>();

    // Watch entry data
    const watchEntries = watch("entries");

    return (
        <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ duration: 0.2 }}
            className="mb-3"
        >
            <Accordion type="single" collapsible className="border rounded-md">
                <AccordionItem value={`item-${index}`} className="border-0">
                    <AccordionTrigger className="px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900">
                        <div className="flex flex-1 items-center justify-between pr-2">
                            <div className="flex items-center">
                                <span className="font-semibold mr-2">#{index + 1}</span>
                                {watchEntries[index]?.taskName ? (
                                    <span>{watchEntries[index].taskName}</span>
                                ) : (
                                    <span className="text-gray-500 italic">Chưa có tên công đoạn</span>
                                )}
                            </div>
                            <Badge variant="secondary" className="ml-2">
                                {watchEntries[index]?.total || 0} giờ
                            </Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="space-y-3">
                                <Controller
                                    control={control}
                                    name={`entries.${index}.taskCode`}
                                    render={({ field }) => (
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">MÃ TÚI</label>
                                            <Input
                                                {...field}
                                                className="h-8 text-sm"
                                                disabled={isReadOnly || isSubmitting}
                                            />
                                        </div>
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name={`entries.${index}.taskId`}
                                    render={({ field }) => (
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">MÃ CÔNG ĐOẠN</label>
                                            <Input
                                                {...field}
                                                className="h-8 text-sm"
                                                disabled={isReadOnly || isSubmitting}
                                            />
                                        </div>
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name={`entries.${index}.taskName`}
                                    render={({ field }) => (
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">TÊN CÔNG ĐOẠN SẢN XUẤT</label>
                                            <Input
                                                {...field}
                                                className="h-8 text-sm"
                                                disabled={isReadOnly || isSubmitting}
                                            />
                                        </div>
                                    )}
                                />
                            </div>

                            <div className="space-y-3">
                                <Controller
                                    control={control}
                                    name={`entries.${index}.target`}
                                    render={({ field }) => (
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">CHỈ TIÊU GIỜ</label>
                                            <Input
                                                {...field}
                                                className="h-8 text-sm"
                                                disabled={isReadOnly || isSubmitting}
                                            />
                                        </div>
                                    )}
                                />

                                <Controller
                                    control={control}
                                    name={`entries.${index}.note`}
                                    render={({ field }) => (
                                        <div>
                                            <label className="text-xs font-medium mb-1 block">ĐÁNH GIÁ</label>
                                            <Input
                                                {...field}
                                                className="h-8 text-sm"
                                                disabled={isReadOnly || isSubmitting}
                                            />
                                        </div>
                                    )}
                                />

                                <div>
                                    <label className="text-xs font-medium mb-1 block">NGUYÊN NHÂN</label>
                                    <div className="flex flex-wrap gap-3">
                                        {REASON_OPTIONS.map((reason) => (
                                            <div key={reason.value} className="flex items-center space-x-1">
                                                {/* The key issue is here - we need type-safe access to the reasons */}
                                                <Controller
                                                    control={control}
                                                    // Type-safe way to access the reasons
                                                    name={`entries.${index}.reasons.${reason.value as 'VT' | 'CN' | 'CL' | 'MM'}`}
                                                    render={({ field }) => {
                                                        // Fix for the checkbox issue by separating properties
                                                        const { onChange, value, ref, ...restField } = field;
                                                        return (
                                                            <Checkbox
                                                                id={`reason-${entry.id}-${reason.value}`}
                                                                checked={!!value}
                                                                onCheckedChange={onChange}
                                                                ref={ref as React.RefObject<HTMLButtonElement>}
                                                                disabled={isReadOnly || isSubmitting}
                                                                className="h-4 w-4"
                                                                {...restField}
                                                            />
                                                        );
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`reason-${entry.id}-${reason.value}`}
                                                    className="text-xs"
                                                >
                                                    {reason.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Time slots */}
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium">THỜI GIAN THỰC HIỆN</label>
                                {!isReadOnly && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => onTimePickerOpen(entry.id)}
                                        disabled={isSubmitting}
                                    >
                                        <Clock className="h-3.5 w-3.5 mr-1" />
                                        Chọn thời gian
                                    </Button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                {TIME_SLOTS.map((slot) => (
                                    <div
                                        key={`${entry.id}-${slot.id}`}
                                        className="flex items-center space-x-2"
                                    >
                                        <Controller
                                            control={control}
                                            name={`entries.${index}.slots.${slot.id}`}
                                            render={({ field }) => {
                                                // Fix for the checkbox issue by separating properties
                                                const { onChange, value, ref, ...restField } = field;
                                                return (
                                                    <Checkbox
                                                        id={`slot-${entry.id}-${slot.id}`}
                                                        checked={!!value}
                                                        onCheckedChange={onChange}
                                                        ref={ref as React.RefObject<HTMLButtonElement>}
                                                        disabled={isReadOnly || isSubmitting}
                                                        className="h-4 w-4"
                                                        {...restField}
                                                    />
                                                );
                                            }}
                                        />
                                        <label
                                            className="text-xs text-gray-600"
                                            htmlFor={`slot-${entry.id}-${slot.id}`}
                                        >
                                            {slot.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Entry actions */}
                        {!isReadOnly && (
                            <div className="flex justify-end gap-2 mt-3">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => onClearSlots(index)}
                                                disabled={isSubmitting}
                                            >
                                                <XCircle className="h-4 w-4 text-orange-500" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Xóa giờ</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => onDuplicate(index)}
                                                disabled={isSubmitting}
                                            >
                                                <Copy className="h-4 w-4 text-green-500" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Nhân bản</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {fields.length > 1 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => onRemove(index)}
                                                    disabled={isSubmitting}
                                                >
                                                    <Trash className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Xóa dòng</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </motion.div>
    );
};

export default EntryItem;