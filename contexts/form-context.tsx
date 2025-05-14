// contexts/form-context.tsx
"use client"
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FormData } from '@/common/types/worker';
import { AttendanceStatus, DigitalFormEntry, ProductionIssueType, ShiftType } from '@/common/types/digital-form';
// import { useRouter, useParams } from 'next/navigation';
import useOptimizedDigitalForm from '@/hooks/digital-form/useOptimizedDigitalForm';
import { bagColorCondDTOSchema } from '../../TBS Group/bento-nestjs/daily_performance_be/src/modules/handbag/handbag.dto';

interface FormContextProps {
    formData: FormData | null;
    // loading: boolean;
    error: string | null;
    currentTimeSlot: string | null;
    stats: any;
    refreshData: () => Promise<void>;
    submitFormData: () => Promise<boolean>;
    updateHourlyData: (workerId: string, timeSlot: string, quantity: number) => Promise<boolean>;
    updateAttendanceStatus: (workerId: string, status: AttendanceStatus) => Promise<boolean>;
    updateShiftType: (workerId: string, shiftType: ShiftType) => Promise<boolean>;
    addIssue: (workerId: string, issueData: {
        type: ProductionIssueType;
        hour: number;
        impact: number;
        description?: string;
    }) => Promise<boolean>;
    removeIssue: (workerId: string, issueIndex: number) => Promise<boolean>;

    // Multi-bag time slot functionality
    addBagForTimeSlot: (workerId: string, bagData: {
        bagId: string;
        bagName: string;
        processId: string;
        processName: string;
        colorId: string;
        colorName: string;
        timeSlot: string;
        quantity: number;
    }) => Promise<boolean>;

    updateBagTimeSlotOutput: (entryId: string, timeSlot: string, quantity: number) => Promise<boolean>;

    getBagsForTimeSlot: (workerId: string, timeSlot: string) => Array<{
        entryId: string;
        bagId: string;
        bagName: string;
        processId: string;
        processName: string;
        colorId: string;
        colorName: string;
        output: number;
    }>;

    getHourlyDataByTimeSlot: (workerId: string) => Record<string, {
        totalOutput: number;
        bags: Array<{
            entryId: string;
            bagId: string;
            bagName: string;
            processId: string;
            processName: string;
            colorId: string;
            colorName: string;
            output: number;
        }>;
    }>;
}

const FormContext = createContext<FormContextProps | undefined>(undefined);

export function FormProvider({ children, initialFormId }: { children: ReactNode, initialFormId?: string }) {
    const [formId, setFormId] = useState<string | undefined>(initialFormId);

    const {
        formData,
        // loading,
        error,
        currentTimeSlot,
        stats,
        refreshData,
        submitFormData,
        updateHourlyData,
        updateAttendanceStatus,
        updateShiftType,
        addIssue,
        removeIssue,
        addBagForTimeSlot,
        updateBagTimeSlotOutput,
        getBagsForTimeSlot,
        getHourlyDataByTimeSlot,
    } = useOptimizedDigitalForm(formId);

    // Cập nhật formId nếu initialFormId thay đổi
    useEffect(() => {
        if (initialFormId !== formId) {
            setFormId(initialFormId);
        }
    }, [initialFormId]);

    const contextValue: FormContextProps = {
        formData,
        // loading,
        error,
        currentTimeSlot,
        stats,
        refreshData,
        submitFormData,
        updateHourlyData,
        updateAttendanceStatus,
        updateShiftType,
        addIssue,
        removeIssue,

        //multi bag time slot
        addBagForTimeSlot,
        updateBagTimeSlotOutput,
        getBagsForTimeSlot,
        getHourlyDataByTimeSlot
    };

    return (
        <FormContext.Provider value={contextValue}>
            {children}
        </FormContext.Provider>
    );
}

export function useForm() {
    const context = useContext(FormContext);

    if (context === undefined) {
        throw new Error('useForm must be used within a FormProvider');
    }

    return context;
}