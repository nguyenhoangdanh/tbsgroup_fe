"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceStatus } from "@/common/types/digital-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";

interface FormEntryCardProps {
    entry: any;
    onEdit: () => void;
    onDelete: () => void;
    isReadOnly: boolean;
}

/**
 * Card component to display a single form entry
 * Shows worker, product, and production details with actions
 */
const FormEntryCard: React.FC<FormEntryCardProps> = ({ entry, onEdit, onDelete, isReadOnly }) => {
    const getAttendanceStatusLabel = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return "Có mặt";
            case AttendanceStatus.ABSENT:
                return "Vắng mặt";
            case AttendanceStatus.LATE:
                return "Đi muộn";
            case AttendanceStatus.EARLY_LEAVE:
                return "Về sớm";
            case AttendanceStatus.LEAVE_APPROVED:
                return "Nghỉ phép";
            default:
                return status;
        }
    };

    const getAttendanceStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return "bg-green-100 text-green-800";
            case AttendanceStatus.ABSENT:
                return "bg-red-100 text-red-800";
            case AttendanceStatus.LATE:
                return "bg-yellow-100 text-yellow-800";
            case AttendanceStatus.EARLY_LEAVE:
                return "bg-orange-100 text-orange-800";
            case AttendanceStatus.LEAVE_APPROVED:
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Calculate efficiency as a percentage 
    const efficiency = entry.hourlyData && Object.keys(entry.hourlyData).length > 0
        ? Math.round((entry.totalOutput / (Object.keys(entry.hourlyData).length * entry.process?.hourlyTarget || 1)) * 100)
        : 0;

    // Get efficiency color
    const getEfficiencyColor = (value: number) => {
        if (value >= 100) return "text-green-600";
        if (value >= 80) return "text-blue-600";
        if (value >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    return (
        <Card className="mb-4">
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <h4 className="font-medium">{entry.worker?.fullName || 'N/A'}</h4>
                        <div className="text-sm text-gray-500">{entry.worker?.employeeId || 'N/A'}</div>
                    </div>
                    <div className="text-right">
                        <Badge className={getAttendanceStatusColor(entry.attendanceStatus)}>
                            {getAttendanceStatusLabel(entry.attendanceStatus)}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                    <div>
                        <span className="font-medium">Túi:</span> {entry.handBag?.name || 'N/A'}
                    </div>
                    <div>
                        <span className="font-medium">Màu:</span> {entry.bagColor?.colorName || 'N/A'}
                    </div>
                    <div>
                        <span className="font-medium">Công đoạn:</span> {entry.process?.name || 'N/A'}
                    </div>
                    <div className="text-right md:text-left">
                        <span className="font-medium">Sản lượng:</span> {entry.totalOutput}
                    </div>
                </div>

                {/* Display efficiency if we have process with hourlyTarget */}
                {entry.process?.hourlyTarget && (
                    <div className="mb-3">
                        <span className="font-medium mr-2">Hiệu suất:</span>
                        <span className={`font-medium ${getEfficiencyColor(efficiency)}`}>
                            {efficiency}%
                        </span>
                    </div>
                )}

                {/* Production by hour */}
                {entry.hourlyData && Object.keys(entry.hourlyData).length > 0 && (
                    <div className="mb-3">
                        <div className="text-sm font-medium mb-1">Chi tiết theo giờ:</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Object.entries(entry.hourlyData).map(([hour, value]) => (
                                <div key={hour} className="text-xs bg-gray-50 p-1 rounded flex justify-between">
                                    <span>{hour}:</span>
                                    <span className="font-medium">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {!isReadOnly && (
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onEdit}
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Sửa
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Xóa
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bạn có chắc chắn muốn xóa dữ liệu công nhân này? Hành động này không thể hoàn tác.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onDelete}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Xóa
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default FormEntryCard;