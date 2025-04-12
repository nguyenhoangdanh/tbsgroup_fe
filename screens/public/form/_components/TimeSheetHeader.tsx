// components/TimeSheetHeader.tsx
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays, Clock } from "lucide-react";
import { TimeSheetType } from "@/schemas/timesheet";
import { FieldInput } from "@/components/common/Form/FieldInput";

interface TimeSheetHeaderProps {
    totalHours: number;
    isReadOnly?: boolean;
    isSubmitting?: boolean;
    formattedDate: string;
    onCustomTimeClick: () => void;
}

const TimeSheetHeader: React.FC<TimeSheetHeaderProps> = ({
    totalHours,
    isReadOnly = false,
    isSubmitting = false,
    formattedDate,
    onCustomTimeClick,
}) => {
    // Get form methods
    const { control } = useFormContext<TimeSheetType>();

    return (
        <>
            {/* Card Header */}
            <div className="pb-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold">PHIẾU THEO DÕI CÔNG ĐOẠN</h2>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            GIAO CHỈ TIÊU CÁ NHÂN - MS: P11H1HB034
                        </p>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-2 md:mt-0">
                        BĐ, ngày {formattedDate}
                    </div>
                </div>
            </div>

            {/* Employee Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                <div className="space-y-3">
                    <FieldInput
                        control={control}
                        name="employeeName"
                        label="HỌ TÊN"
                        placeholder="Nhập họ tên"
                        disabled={isReadOnly || isSubmitting}
                        required
                    />

                    <FieldInput
                        control={control}
                        name="employeeId"
                        label="MÃ SỐ THẺ"
                        placeholder="Nhập mã số thẻ"
                        disabled={isReadOnly || isSubmitting}
                        required
                    />
                </div>

                <div className="space-y-3">
                    <FieldInput
                        control={control}
                        name="department"
                        label="ĐƠN VỊ"
                        placeholder="Nhập đơn vị"
                        disabled={isReadOnly || isSubmitting}
                        required
                    />

                    <FieldInput
                        control={control}
                        name="level"
                        label="TRÌNH ĐỘ"
                        placeholder="Nhập trình độ"
                        disabled={isReadOnly || isSubmitting}
                    />
                </div>
            </div>

            {/* Date Selection and Summary */}
            <div className="flex flex-wrap justify-between items-center gap-2 py-2 mt-4">
                <Badge variant="outline" className="px-3 py-1 text-sm">
                    Tổng số giờ: <span className="font-bold ml-1">{totalHours}</span>
                </Badge>

                <div className="flex flex-wrap items-center gap-2">
                    {!isReadOnly && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onCustomTimeClick}
                            className="flex items-center gap-1"
                            disabled={isReadOnly || isSubmitting}
                        >
                            <Clock className="h-4 w-4" />
                            <span>Chọn TG</span>
                        </Button>
                    )}

                    <div className="flex items-center w-40 md:w-48">
                        <CalendarDays className="mr-2 h-4 w-4 text-gray-500" />
                        <Controller
                            control={control}
                            name="date"
                            render={({ field }) => (
                                <Input
                                    type="date"
                                    {...field}
                                    className="h-9"
                                    disabled={isReadOnly || isSubmitting}
                                />
                            )}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default TimeSheetHeader;