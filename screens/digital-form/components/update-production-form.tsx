// components/update-production-form.tsx
'use client';

import {useState, useCallback, useEffect, useMemo} from 'react';
import {useForm as useHookForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/components/ui/tabs';
import {Worker, AttendanceStatus} from '@/common/types/worker';
import {TIME_SLOTS} from '@/common/constants/time-slots';
import {ShiftType} from '@/common/types/digital-form';
import {
  attendanceSchema,
  productionSchema,
  shiftTypeSchema,
  TAttendanceFormEntry,
  TShiftTypeFormEntry,
} from '@/schemas/digital-form.schema';
import SubmitButton from '@/components/SubmitButton';

// Extend production schema to include entryId
const enhancedProductionSchema = productionSchema.extend({
  entryId: z.string().optional(),
});

type EnhancedProductionFormEntry = z.infer<typeof enhancedProductionSchema>;

interface UpdateProductionFormProps {
  worker: Worker;
  onUpdateHourlyData: (workerId: string, timeSlot: string, quantity: number) => Promise<boolean>;
  onUpdateAttendanceStatus: (
    workerId: string,
    status: AttendanceStatus,
    attendanceNote?: string,
  ) => Promise<boolean>;
  onUpdateShiftType: (workerId: string, shiftType: ShiftType) => Promise<boolean>;
  currentTimeSlot: string | null;
  onSuccess?: () => void;
  disabled?: boolean;
  workerEntries?: Worker[]; // Thêm tất cả entry của worker
}

export function UpdateProductionForm({
  worker,
  onUpdateHourlyData,
  onUpdateAttendanceStatus,
  onUpdateShiftType,
  currentTimeSlot,
  onSuccess,
  disabled = false,
  workerEntries = [],
}: UpdateProductionFormProps) {
  // State for active tab and loading states
  const [activeTab, setActiveTab] = useState<'production' | 'attendance' | 'shiftType'>(
    'production',
  );
  const [isSubmittingProduction, setIsSubmittingProduction] = useState<boolean>(false);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState<boolean>(false);
  const [isSubmittingShiftType, setIsSubmittingShiftType] = useState<boolean>(false);

  // Lấy danh sách các túi độc nhất mà worker đang làm
  const uniqueBags = useMemo(() => {
    if (workerEntries.length === 0) {
      return [
        {
          id: worker.id,
          bagId: worker.bagId,
          bagName: worker.bagName,
          processId: worker.processId,
          processName: worker.processName,
          colorId: worker.colorId,
          colorName: worker.colorName,
        },
      ];
    }

    // Tạo map các túi độc nhất dựa vào bagId, processId, và colorId
    const bagsMap = new Map();
    workerEntries.forEach(entry => {
      const key = `${entry.bagId}-${entry.processId}-${entry.colorId}`;
      if (!bagsMap.has(key)) {
        bagsMap.set(key, {
          id: entry.id,
          bagId: entry.bagId,
          bagName: entry.bagName,
          processId: entry.processId,
          processName: entry.processName,
          colorId: entry.colorId,
          colorName: entry.colorName,
        });
      }
    });

    return Array.from(bagsMap.values());
  }, [worker, workerEntries]);

  // Initialize production form with defaults
  const productionForm = useHookForm<EnhancedProductionFormEntry>({
    resolver: zodResolver(enhancedProductionSchema),
    defaultValues: {
      entryId: uniqueBags.length > 0 ? uniqueBags[0].id : worker.id,
      timeSlot: currentTimeSlot || TIME_SLOTS[0].label,
      quantity: 0,
    },
  });

  // Initialize attendance form with current status
  const attendanceForm = useHookForm<TAttendanceFormEntry>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      status: worker.attendanceStatus,
      attendanceNote: worker.attendanceNote,
    },
  });

  const shiftTypeForm = useHookForm<TShiftTypeFormEntry>({
    resolver: zodResolver(shiftTypeSchema),
    defaultValues: {
      shiftType: worker.shiftType,
    },
  });

  // Selected values
  const selectedTimeSlot = productionForm.watch('timeSlot');
  const selectedEntryId = productionForm.watch('entryId');

  // Effect to update current value when time slot or entry changes
  useEffect(() => {
    if (selectedTimeSlot && selectedEntryId) {
      // Find the selected entry
      const entry = workerEntries.find(e => e.id === selectedEntryId) || worker;

      // Get current value for the selected time slot
      const currentValue = entry.hourlyData?.[selectedTimeSlot] || 0;

      // Update the form value
      productionForm.setValue('quantity', currentValue);
    }
  }, [selectedTimeSlot, selectedEntryId, workerEntries, worker, productionForm]);

  // Handler for production update
  const onSubmitProduction = useCallback(
    async (values: EnhancedProductionFormEntry) => {
      if (isSubmittingProduction || disabled) return;

      try {
        setIsSubmittingProduction(true);

        const entryId = values.entryId || worker.id;

        const success = await onUpdateHourlyData(entryId, values.timeSlot, values.quantity);

        if (success) {
          // Reset only the quantity field
          productionForm.setValue('quantity', 0);
          productionForm.clearErrors('quantity');

          // Call onSuccess callback if provided
          if (onSuccess) onSuccess();

          return true;
        }

        return false;
      } catch (error) {
        console.error('Error updating production:', error);
        return false;
      } finally {
        setIsSubmittingProduction(false);
      }
    },
    [isSubmittingProduction, disabled, onUpdateHourlyData, worker.id, productionForm, onSuccess],
  );

  // Handler for attendance status update
  const onSubmitAttendance = useCallback(
    async (values: z.infer<typeof attendanceSchema>) => {
      if (isSubmittingAttendance || disabled) return;

      // Skip if status hasn't changed
      if (
        values.status === worker.attendanceStatus &&
        values.attendanceNote === worker.attendanceNote
      ) {
        if (onSuccess) onSuccess();
        return;
      }

      try {
        setIsSubmittingAttendance(true);

        const success = await onUpdateAttendanceStatus(
          worker.id,
          values.status,
          values.attendanceNote,
        );

        if (success && onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error updating attendance status:', error);
      } finally {
        setIsSubmittingAttendance(false);
      }
    },
    [
      isSubmittingAttendance,
      disabled,
      onUpdateAttendanceStatus,
      worker.id,
      worker.attendanceStatus,
      worker.attendanceNote,
      onSuccess,
    ],
  );

  // Handler for shift type update
  const onSubmitShiftType = useCallback(
    async (values: z.infer<typeof shiftTypeSchema>) => {
      if (isSubmittingShiftType || disabled) return;

      // Skip if status hasn't changed
      if (values.shiftType === worker.shiftType) {
        if (onSuccess) onSuccess();
        return;
      }

      try {
        setIsSubmittingShiftType(true);

        const success = await onUpdateShiftType(worker.id, values.shiftType);

        if (success && onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error updating shift type:', error);
      } finally {
        setIsSubmittingShiftType(false);
      }
    },
    [isSubmittingShiftType, disabled, onUpdateShiftType, worker.id, worker.shiftType, onSuccess],
  );

  // Determine if there's a current value for the selected time slot and entry
  const getCurrentValue = useCallback(() => {
    if (!selectedTimeSlot || !selectedEntryId) return 0;

    // Find the selected entry
    const entry = workerEntries.find(e => e.id === selectedEntryId) || worker;

    // Return the current value
    return entry.hourlyData?.[selectedTimeSlot] || 0;
  }, [selectedTimeSlot, selectedEntryId, workerEntries, worker]);

  const currentValue = getCurrentValue();

  return (
    <Tabs
      value={activeTab}
      onValueChange={value => setActiveTab(value as 'production' | 'attendance' | 'shiftType')}
    >
      <TabsList className="flex items-center justify-between">
        <TabsTrigger value="production">Sản lượng</TabsTrigger>
        <TabsTrigger value="attendance">Trạng thái</TabsTrigger>
        <TabsTrigger value="shiftType">Ca làm việc</TabsTrigger>
      </TabsList>

      <TabsContent value="production">
        <Form {...productionForm}>
          <form onSubmit={productionForm.handleSubmit(onSubmitProduction)} className="space-y-4">
            {/* Select between multiple bags if worker works on multiple bags */}
            {uniqueBags.length > 1 && (
              <FormField
                control={productionForm.control}
                name="entryId"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Loại túi</FormLabel>
                    <Select
                      onValueChange={value => {
                        field.onChange(value);
                        // Cập nhật giá trị số lượng khi thay đổi túi
                        const entry = workerEntries.find(e => e.id === value) || worker;
                        const currentSlot = productionForm.getValues('timeSlot');
                        const currentOutput = entry.hourlyData?.[currentSlot] || 0;
                        productionForm.setValue('quantity', currentOutput);
                      }}
                      value={field.value}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại túi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {uniqueBags.map(bag => (
                          <SelectItem key={bag.id} value={bag.id}>
                            {bag.bagName} - {bag.processName} - {bag.colorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={productionForm.control}
              name="timeSlot"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Khung giờ</FormLabel>
                  <Select
                    onValueChange={value => {
                      field.onChange(value);
                      // Cập nhật giá trị số lượng khi thay đổi khung giờ
                      const entryId = productionForm.getValues('entryId');
                      const entry = workerEntries.find(e => e.id === entryId) || worker;
                      const currentOutput = entry.hourlyData?.[value] || 0;
                      productionForm.setValue('quantity', currentOutput);
                    }}
                    value={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khung giờ" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot.id} value={slot.label}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedTimeSlot && (
              <div className="text-sm">
                Sản lượng hiện tại: <span className="font-medium">{currentValue}</span>
              </div>
            )}

            <FormField
              control={productionForm.control}
              name="quantity"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Số lượng</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      min="0"
                      step="1"
                      autoComplete="off"
                      inputMode="numeric"
                      disabled={disabled}
                      onChange={e => {
                        const value = parseInt(e.target.value) || 0;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton
              name="Cập nhật sản lượng"
              isLoading={isSubmittingProduction}
              className="w-full"
            />
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="attendance">
        <Form {...attendanceForm}>
          <form onSubmit={attendanceForm.handleSubmit(onSubmitAttendance)} className="space-y-4">
            <FormField
              control={attendanceForm.control}
              name="status"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Trạng thái chuyên cần</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={value => field.onChange(value as AttendanceStatus)}
                      value={field.value}
                      className="space-y-2"
                      disabled={disabled}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={AttendanceStatus.PRESENT} id="present" />
                        <label htmlFor="present" className="text-sm">
                          Có mặt
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={AttendanceStatus.ABSENT} id="absent" />
                        <label htmlFor="absent" className="text-sm">
                          Vắng mặt
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={AttendanceStatus.LATE} id="late" />
                        <label htmlFor="late" className="text-sm">
                          Đi muộn
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={AttendanceStatus.EARLY_LEAVE} id="early-leave" />
                        <label htmlFor="early-leave" className="text-sm">
                          Về sớm
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={AttendanceStatus.LEAVE_APPROVED}
                          id="leave-approved"
                        />
                        <label htmlFor="leave-approved" className="text-sm">
                          Nghỉ phép
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={attendanceForm.control}
              name="attendanceNote"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ghi chú về điểm danh"
                      {...field}
                      value={field.value || ''}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SubmitButton
              name="Cập nhật trạng thái"
              isLoading={isSubmittingAttendance}
              className="w-full"
            />
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="shiftType">
        <Form {...shiftTypeForm}>
          <form onSubmit={shiftTypeForm.handleSubmit(onSubmitShiftType)} className="space-y-4">
            <FormField
              control={shiftTypeForm.control}
              name="shiftType"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Ca làm việc</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={value => field.onChange(value as ShiftType)}
                      value={field.value}
                      className="space-y-2"
                      disabled={disabled}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={ShiftType.REGULAR} id="regular" />
                        <label htmlFor="regular" className="text-sm">
                          Ca thường
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={ShiftType.EXTENDED} id="extended" />
                        <label htmlFor="extended" className="text-sm">
                          Giãn ca
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={ShiftType.OVERTIME} id="overtime" />
                        <label htmlFor="overtime" className="text-sm">
                          Tăng ca
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton
              name="Cập nhật ca làm việc"
              isLoading={isSubmittingShiftType}
              className="w-full"
            />
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
