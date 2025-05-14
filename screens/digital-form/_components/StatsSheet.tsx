// components/StatsSheet.tsx
'use client';

import { useMemo } from 'react';

import { WorkerStatusBadge } from './worker-status-badge';

import { AttendanceStatus } from '@/common/types/digital-form';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  activeTab: 'summary' | 'production' | 'attendance';
  onTabChange: (tab: string) => void;
}

export function StatsSheet({
  open,
  onOpenChange,
  formData,
  activeTab,
  onTabChange,
}: StatsSheetProps) {
  // Calculate attendance statistics
  const attendanceStats = useMemo(() => {
    if (!formData || !formData.workers) {
      return {
        present: 0,
        absent: 0,
        late: 0,
        earlyLeave: 0,
        leaveApproved: 0,
        presentPercentage: 0,
        total: 0,
      };
    }

    // Group workers by user ID to avoid duplicates
    const uniqueWorkers = new Map();
    formData.workers.forEach(worker => {
      if (worker.user?.id && !uniqueWorkers.has(worker.user.id)) {
        uniqueWorkers.set(worker.user.id, worker);
      }
    });
    const uniqueWorkersList = Array.from(uniqueWorkers.values());

    const totalWorkers = uniqueWorkersList.length;
    const present = uniqueWorkersList.filter(
      w => w.attendanceStatus === AttendanceStatus.PRESENT,
    ).length;
    const absent = uniqueWorkersList.filter(
      w => w.attendanceStatus === AttendanceStatus.ABSENT,
    ).length;
    const late = uniqueWorkersList.filter(w => w.attendanceStatus === AttendanceStatus.LATE).length;
    const earlyLeave = uniqueWorkersList.filter(
      w => w.attendanceStatus === AttendanceStatus.EARLY_LEAVE,
    ).length;
    const leaveApproved = uniqueWorkersList.filter(
      w => w.attendanceStatus === AttendanceStatus.LEAVE_APPROVED,
    ).length;
    const presentPercentage = totalWorkers > 0 ? Math.round((present / totalWorkers) * 100) : 0;

    return {
      present,
      absent,
      late,
      earlyLeave,
      leaveApproved,
      presentPercentage,
      total: totalWorkers,
    };
  }, [formData]);

  // Calculate completion stats for form
  const completionStats = useMemo(() => {
    if (!formData || !formData.workers) {
      return {
        totalSlots: 0,
        filledSlots: 0,
        percentage: 0,
        totalOutput: 0,
        averageOutput: 0,
      };
    }

    // Group workers by user ID to avoid duplicates
    const uniqueWorkers = new Map();
    formData.workers.forEach(worker => {
      if (worker.user?.id && !uniqueWorkers.has(worker.user.id)) {
        uniqueWorkers.set(worker.user.id, worker);
      }
    });
    const uniqueWorkersList = Array.from(uniqueWorkers.values());

    let totalSlots = 0;
    let filledSlots = 0;
    let totalOutput = 0;

    // Calculate total output
    totalOutput = formData.workers.reduce((sum, worker) => sum + (worker.totalOutput || 0), 0);

    // Calculate average
    const averageOutput =
      uniqueWorkersList.length > 0 ? Math.round(totalOutput / uniqueWorkersList.length) : 0;

    // Simplified slot calculation
    formData.workers.forEach(worker => {
      // Skip counting slots for absent workers
      if (worker.attendanceStatus === AttendanceStatus.ABSENT) {
        return;
      }

      const hourlyData = worker.hourlyData || {};
      totalSlots += 8; // Simplification - count 8 slots per worker
      filledSlots += Object.values(hourlyData).filter(value => (value as number) > 0).length;
    });

    const percentage = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

    return {
      totalSlots,
      filledSlots,
      percentage,
      totalOutput,
      averageOutput,
    };
  }, [formData]);

  // Calculate worker production statistics
  const workerProductionStats = useMemo(() => {
    if (!formData || !formData.workers) return [];

    // Group entries by user ID and calculate total output
    const userMap = new Map();

    formData.workers.forEach(worker => {
      if (!worker.user?.id) return;

      const userId = worker.user.id;

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: worker.user.fullName || worker.name || 'Unknown Worker',
          employeeId: worker.user.employeeId || worker.employeeId || 'N/A',
          totalOutput: 0,
          attendanceStatus: worker.attendanceStatus,
        });
      }

      // Add to total output
      const userData = userMap.get(userId);
      userData.totalOutput += worker.totalOutput || 0;
    });

    // Convert to array and sort by total output (highest first)
    return Array.from(userMap.values())
      .filter(worker => worker.attendanceStatus !== AttendanceStatus.ABSENT)
      .sort((a, b) => b.totalOutput - a.totalOutput);
  }, [formData]);

  // Get all bag production data
  const productionData = useMemo(() => {
    if (!formData || !formData.workers) return [];

    const bagMap = new Map();

    // Iterate through all workers
    formData.workers.forEach(worker => {
      if (!worker.hourlyData) return;
      if (!worker.bagId || !worker.processId || !worker.colorId) return;

      // Create unique key for this bag
      const key = `${worker.bagId}-${worker.processId}-${worker.colorId}`;

      if (!bagMap.has(key)) {
        bagMap.set(key, {
          bagId: worker.bagId,
          bagName: worker.handBag ? worker.handBag.name : worker.bagName || 'Unknown Bag',
          processId: worker.processId,
          processName: worker.process
            ? worker.process.name
            : worker.processName || 'Unknown Process',
          colorId: worker.colorId,
          colorName: worker.bagColor?.colorName || worker.colorName || 'Unknown Color',
          totalOutput: 0,
        });
      }

      // Add to total output for this bag
      const bagData = bagMap.get(key);
      bagData.totalOutput += worker.totalOutput || 0;
    });

    return Array.from(bagMap.values()).sort((a, b) => b.totalOutput - a.totalOutput);
  }, [formData]);

  // Calculate hourly distribution of output
  const hourlyOutputDistribution = useMemo(() => {
    if (!formData || !formData.workers) return {};

    const hourlyOutput = {};

    // Initialize with all time slots
    const timeSlots = [
      '07:30-08:30',
      '08:30-09:30',
      '09:30-10:30',
      '10:30-11:30',
      '12:30-13:30',
      '13:30-14:30',
      '14:30-15:30',
      '15:30-16:30',
    ];

    timeSlots.forEach(slot => {
      hourlyOutput[slot] = 0;
    });

    // Sum up output for each time slot
    formData.workers.forEach(worker => {
      if (!worker.hourlyData) return;

      Object.entries(worker.hourlyData).forEach(([timeSlot, output]) => {
        if (hourlyOutput[timeSlot] !== undefined) {
          hourlyOutput[timeSlot] += output;
        }
      });
    });

    return hourlyOutput;
  }, [formData]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg">
        <SheetHeader>
          <SheetTitle>Thống kê biểu mẫu</SheetTitle>
          <SheetDescription>Thống kê chi tiết biểu mẫu: {formData.formName}</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="summary">Tổng quan</TabsTrigger>
              <TabsTrigger value="production">Sản xuất</TabsTrigger>
              <TabsTrigger value="attendance">Chuyên cần</TabsTrigger>
            </TabsList>

            {/* Summary tab */}
            <TabsContent value="summary">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tổng quan sản lượng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/50 p-3 rounded-md text-center">
                        <div className="text-3xl font-bold text-primary">
                          {completionStats.totalOutput}
                        </div>
                        <div className="text-xs text-muted-foreground">Tổng sản lượng</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md text-center">
                        <div className="text-3xl font-bold text-primary">
                          {completionStats.averageOutput}
                        </div>
                        <div className="text-xs text-muted-foreground">Trung bình/người</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tiến độ nhập liệu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span>Đã nhập</span>
                        <span className="font-medium">{completionStats.percentage}%</span>
                      </div>
                      <Progress value={completionStats.percentage} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Đã hoàn thành {completionStats.filledSlots} / {completionStats.totalSlots}{' '}
                      khung giờ
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Thống kê chuyên cần</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-50 p-2 rounded-md">
                        <div className="text-xl font-medium text-green-600">
                          {attendanceStats.present}
                        </div>
                        <div className="text-xs">Có mặt</div>
                      </div>
                      <div className="bg-amber-50 p-2 rounded-md">
                        <div className="text-xl font-medium text-amber-600">
                          {attendanceStats.late}
                        </div>
                        <div className="text-xs">Đi muộn</div>
                      </div>
                      <div className="bg-red-50 p-2 rounded-md">
                        <div className="text-xl font-medium text-red-600">
                          {attendanceStats.absent}
                        </div>
                        <div className="text-xs">Vắng mặt</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Tỷ lệ đi làm: {attendanceStats.presentPercentage}% (
                      {attendanceStats.present + attendanceStats.late}/{attendanceStats.total})
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Production tab */}
            <TabsContent value="production">
              <div className="space-y-4">
                {/* Hourly production chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sản lượng theo giờ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[180px] w-full relative">
                      {Object.entries(hourlyOutputDistribution).map(([slot, output], index) => {
                        const hour = slot.split('-')[0];
                        const maxOutput = Math.max(...Object.values(hourlyOutputDistribution));
                        const percentage =
                          maxOutput > 0 ? ((output as number) / maxOutput) * 100 : 0;
                        return (
                          <div
                            key={slot}
                            className="flex items-end absolute bottom-0"
                            style={{
                              left: `${(index / (Object.keys(hourlyOutputDistribution).length - 1)) * 100}%`,
                              transform: 'translateX(-50%)',
                              height: '100%',
                              width: '8%',
                            }}
                          >
                            <div className="w-full">
                              <div
                                className="bg-primary rounded-t-sm w-full transition-all"
                                style={{ height: `${percentage}%` }}
                              ></div>
                              <div className="text-xs text-center mt-1">{hour}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Bag production ranking */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sản lượng theo loại túi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="py-2">Loại túi</TableHead>
                            <TableHead className="text-right py-2">Sản lượng</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productionData.slice(0, 5).map((bag, index) => (
                            <TableRow key={`${bag.bagId}-${bag.colorId}-${index}`}>
                              <TableCell className="py-2">
                                <div className="font-medium text-sm">{bag.bagName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {bag.processName} - {bag.colorName}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {bag.totalOutput}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {productionData.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        Hiển thị 5/{productionData.length} loại túi
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Worker production ranking */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sản lượng theo công nhân</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="py-2">Công nhân</TableHead>
                            <TableHead className="text-right py-2">Sản lượng</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workerProductionStats.slice(0, 5).map((worker, index) => (
                            <TableRow key={worker.userId}>
                              <TableCell className="py-2">
                                <div className="font-medium text-sm">{worker.userName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {worker.employeeId}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {worker.totalOutput}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {workerProductionStats.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        Hiển thị 5/{workerProductionStats.length} công nhân
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Attendance tab */}
            <TabsContent value="attendance">
              <div className="space-y-4">
                {/* Attendance summary card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tổng quan chuyên cần</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Có mặt</span>
                          <span className="font-medium">{attendanceStats.presentPercentage}%</span>
                        </div>
                        <Progress
                          value={attendanceStats.presentPercentage}
                          className="h-2 bg-gray-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Vắng mặt</span>
                          <span className="font-medium">
                            {attendanceStats.total > 0
                              ? Math.round((attendanceStats.absent / attendanceStats.total) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            attendanceStats.total > 0
                              ? (attendanceStats.absent / attendanceStats.total) * 100
                              : 0
                          }
                          className="h-2 bg-gray-200"
                        />
                      </div>
                    </div>

                    {/* Detailed attendance stats */}
                    <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
                      <div className="bg-green-50 p-2 rounded-md text-center">
                        <div className="font-medium">{attendanceStats.present}</div>
                        <div className="text-green-600">Có mặt</div>
                      </div>
                      <div className="bg-amber-50 p-2 rounded-md text-center">
                        <div className="font-medium">{attendanceStats.late}</div>
                        <div className="text-amber-600">Đi muộn</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-md text-center">
                        <div className="font-medium">{attendanceStats.earlyLeave}</div>
                        <div className="text-blue-600">Về sớm</div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded-md text-center">
                        <div className="font-medium">{attendanceStats.leaveApproved}</div>
                        <div className="text-purple-600">Nghỉ phép</div>
                      </div>
                      <div className="bg-red-50 p-2 rounded-md text-center">
                        <div className="font-medium">{attendanceStats.absent}</div>
                        <div className="text-red-600">Vắng mặt</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Worker attendance list */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Danh sách công nhân</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="py-2">Công nhân</TableHead>
                            <TableHead className="py-2">Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData &&
                            formData.workers &&
                            formData.workers.slice(0, 8).map(worker => (
                              <TableRow key={worker.id}>
                                <TableCell className="py-2">
                                  <div className="font-medium text-sm">
                                    {worker.user?.fullName || worker.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {worker.user?.employeeId || worker.employeeId}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center">
                                    <WorkerStatusBadge status={worker.attendanceStatus} />
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                    {formData && formData.workers && formData.workers.length > 8 && (
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        Hiển thị 8/{formData.workers.length} công nhân
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button variant="outline">Đóng</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
