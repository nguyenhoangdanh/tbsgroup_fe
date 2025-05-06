// components/digital-form/FormStats.tsx
"use client"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Users,
    ClipboardList,
    Clock,
    UserCheck,
    AlertTriangle,
    BadgeCheck
} from 'lucide-react';

interface FormStatsProps {
    stats: {
        totalOutput: number;
        averageOutput: number;
        overallCompletionPercentage: number;
        workerCompletionStats?: any[];
        attendance?: {
            present: number;
            absent: number;
            late: number;
            earlyLeave: number;
            leaveApproved: number;
            presentPercentage: number;
        };
    };
}

export default function FormStats({ stats }: FormStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        Tiến độ nhập liệu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold mb-2">{stats.overallCompletionPercentage}%</div>
                    <Progress value={stats.overallCompletionPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                        Tổng số giờ đã nhập / tổng số giờ cần nhập
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                        <ClipboardList className="h-4 w-4 mr-2 text-green-500" />
                        Sản lượng
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOutput}</div>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                            Trung bình
                        </span>
                        <span className="text-sm font-medium">
                            {stats.averageOutput} / người
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                        <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                        Chuyên cần
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.attendance?.presentPercentage || 0}%</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                            <span>Có mặt: {stats.attendance?.present || 0}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                            <span>Vắng: {stats.attendance?.absent || 0}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-amber-500 mr-1"></div>
                            <span>Muộn: {stats.attendance?.late || 0}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mr-1"></div>
                            <span>Về sớm: {stats.attendance?.earlyLeave || 0}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                            <span>Nghỉ phép: {stats.attendance?.leaveApproved || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-amber-500" />
                        Hiệu suất
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">78%</div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Theo dõi hiệu suất làm việc dựa trên số giờ và sản lượng
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}