// components/worker-card.tsx
"use client"

import { useState, memo, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Edit, AlertCircle, UserCircle, Package, Briefcase, Palette } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TimeSlot, Worker } from "@/common/types/worker"
import { WorkerStatusBadge } from "./worker-status-badge"
import { TimeSlotStatus } from "./time-slot-status"
import { TIME_SLOTS } from "@/common/constants/time-slots"
import { UpdateProductionForm } from "./update-production-form"
import { useForm } from "@/contexts/form-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"

interface WorkerCardProps {
    worker: Worker
    currentTimeSlot: string | null
}

/**
 * Optimized worker card component with proper memoization
 * Includes performance enhancements for high-scale applications
 */
function WorkerCardComponent({ worker, currentTimeSlot }: WorkerCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { updateHourlyData, updateAttendanceStatus } = useForm()

    // Determine time slot statuses more efficiently
    const getTimeSlotStatus = useCallback((slot: TimeSlot) => {
        if (worker.hourlyData[slot.label]) {
            return "completed"
        }

        if (slot.label === currentTimeSlot) {
            return "current"
        }

        // Check if this time slot is in the past but has no data
        const now = new Date()
        const hours = now.getHours()
        const minutes = now.getMinutes()
        const currentTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

        if (currentTime > slot.end && !worker.hourlyData[slot.label]) {
            return "missing"
        }

        return "pending"
    }, [worker.hourlyData, currentTimeSlot])

    // Calculate completion stats
    const timeSlotStatuses = useMemo(() => {
        return TIME_SLOTS.map(slot => ({
            slot,
            status: getTimeSlotStatus(slot)
        }))
    }, [getTimeSlotStatus])

    const completedSlots = useMemo(() =>
        timeSlotStatuses.filter(item => item.status === "completed").length
        , [timeSlotStatuses])

    const totalSlots = TIME_SLOTS.length
    const completionPercentage = useMemo(() =>
        Math.round((completedSlots / totalSlots) * 100)
        , [completedSlots, totalSlots])

    // Create a memoized hourly data object for optimization
    const hourlyData = useMemo(() => worker.hourlyData, [worker.hourlyData])

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base flex items-center gap-1">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            {worker.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Mã: {worker.employeeId}</p>
                    </div>
                    <WorkerStatusBadge status={worker.attendanceStatus} />
                </div>
            </CardHeader>

            <CardContent className="pb-2">
                {/* Time slot status indicators */}
                <div className="mb-2">
                    <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-muted-foreground">Tiến độ nhập liệu</span>
                        <span>{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-1" />
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                    <TooltipProvider>
                        {TIME_SLOTS.slice(0, expanded ? undefined : 6).map((slot) => (
                            <Tooltip key={slot.id}>
                                <TooltipTrigger asChild>
                                    <div>
                                        <TimeSlotStatus status={getTimeSlotStatus(slot)} />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{slot.label}</p>
                                    <p>Sản lượng: {hourlyData[slot.label] || 0}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                        {!expanded && totalSlots > 6 && (
                            <Badge variant="outline" className="bg-gray-100">
                                +{totalSlots - 6}
                            </Badge>
                        )}
                    </TooltipProvider>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate" title={worker.bagName}>
                            {worker.bagName.length > 15 ? `${worker.bagName.substring(0, 15)}...` : worker.bagName}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate" title={worker.processName}>
                            {worker.processName.length > 15 ? `${worker.processName.substring(0, 15)}...` : worker.processName}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate" title={worker.colorName}>
                            {worker.colorName.length > 15 ? `${worker.colorName.substring(0, 15)}...` : worker.colorName}
                        </span>
                    </div>
                    <div className="font-medium">
                        Tổng SL: {worker.totalOutput}
                    </div>
                </div>

                {worker.issues && worker.issues.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-amber-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{worker.issues.length} vấn đề</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="text-xs">
                    {expanded ? (
                        <>
                            <ChevronUp className="h-4 w-4 mr-1" /> Thu gọn
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-4 w-4 mr-1" /> Mở rộng
                        </>
                    )}
                </Button>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                            <Edit className="h-3 w-3 mr-1" /> Cập nhật
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Cập nhật sản lượng - {worker.name}</DialogTitle>
                        </DialogHeader>
                        <UpdateProductionForm
                            worker={worker}
                            onUpdateHourlyData={updateHourlyData}
                            onUpdateAttendanceStatus={updateAttendanceStatus}
                            currentTimeSlot={currentTimeSlot}
                            onSuccess={() => setDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </CardFooter>
        </Card>
    )
}

// Export memoized component to prevent unnecessary rerenders
export const WorkerCard = memo(WorkerCardComponent);