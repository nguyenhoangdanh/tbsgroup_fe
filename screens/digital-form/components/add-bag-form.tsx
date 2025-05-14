// components/enhanced-add-bag-form.tsx
'use client';

import {useState, useCallback, useEffect} from 'react';
import {useForm as useHookForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form';
import {Button} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {useQuery} from '@tanstack/react-query';
import {Loader2} from 'lucide-react';
import SubmitButton from '@/components/SubmitButton';

// Schema validation for form
const addBagSchema = z.object({
  bagId: z.string({required_error: 'Vui lòng chọn túi'}),
  processId: z.string({required_error: 'Vui lòng chọn công đoạn'}),
  colorId: z.string({required_error: 'Vui lòng chọn màu'}),
  timeSlot: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
});

type AddBagFormValues = z.infer<typeof addBagSchema>;

interface AddBagFormProps {
  workerId: string;
  timeSlot?: string; // Optional time slot specification
  onAddBag: (bagInfo: {
    bagId: string;
    bagName: string;
    processId: string;
    processName: string;
    colorId: string;
    colorName: string;
    timeSlot?: string;
    quantity?: number;
  }) => Promise<boolean>;
  onSuccess?: () => void;
  disabled?: boolean;
  allBags?: {id: string; name: string}[]; // Optional pre-loaded bags
  allProcesses?: {id: string; name: string}[]; // Optional pre-loaded processes
  allColors?: {id: string; name: string}[]; // Optional pre-loaded colors
}

export function AddBagForm({
  workerId,
  timeSlot,
  onAddBag,
  onSuccess,
  disabled = false,
  allBags,
  allProcesses,
  allColors,
}: AddBagFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form initialization with default values
  const form = useHookForm<AddBagFormValues>({
    resolver: zodResolver(addBagSchema),
    defaultValues: {
      bagId: '',
      processId: '',
      colorId: '',
      timeSlot: timeSlot || '',
      quantity: timeSlot ? 0 : undefined,
    },
  });

  // Update form values when props change
  useEffect(() => {
    if (timeSlot) {
      form.setValue('timeSlot', timeSlot);
    }
  }, [timeSlot, form]);

  // Fetch bags if not provided
  const {data: bags, isLoading: isLoadingBags} = useQuery({
    queryKey: ['bags'],
    queryFn: async () => {
      // Use provided bags or fetch from API
      if (allBags) return allBags;

      // TODO: Replace with actual API call
      return [
        {id: 'bag1', name: 'Túi xách thời trang A'},
        {id: 'bag2', name: 'Túi xách thời trang B'},
        {id: 'bag3', name: 'Túi du lịch C'},
      ];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !allBags, // Only run if bags not provided
  });

  // Fetch processes if not provided
  const {data: processes, isLoading: isLoadingProcesses} = useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      // Use provided processes or fetch from API
      if (allProcesses) return allProcesses;

      // TODO: Replace with actual API call
      return [
        {id: 'process1', name: 'Cắt'},
        {id: 'process2', name: 'May'},
        {id: 'process3', name: 'Hoàn thiện'},
      ];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !allProcesses, // Only run if processes not provided
  });

  // Fetch colors if not provided
  const {data: colors, isLoading: isLoadingColors} = useQuery({
    queryKey: ['colors'],
    queryFn: async () => {
      // Use provided colors or fetch from API
      if (allColors) return allColors;

      // TODO: Replace with actual API call
      return [
        {id: 'color1', name: 'Đen'},
        {id: 'color2', name: 'Nâu'},
        {id: 'color3', name: 'Đỏ'},
      ];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !allColors, // Only run if colors not provided
  });

  const onSubmit = useCallback(
    async (values: AddBagFormValues) => {
      if (isSubmitting || disabled) return;

      try {
        setIsSubmitting(true);

        // Find the selected entities
        const selectedBag = (allBags || bags)?.find(bag => bag.id === values.bagId);
        const selectedProcess = (allProcesses || processes)?.find(
          process => process.id === values.processId,
        );
        const selectedColor = (allColors || colors)?.find(color => color.id === values.colorId);

        if (!selectedBag || !selectedProcess || !selectedColor) {
          throw new Error('Không tìm thấy thông tin túi/công đoạn/màu');
        }

        // Build bag data object
        const bagData = {
          bagId: values.bagId,
          bagName: selectedBag.name,
          processId: values.processId,
          processName: selectedProcess.name,
          colorId: values.colorId,
          colorName: selectedColor.name,
        };

        // Add time slot and quantity if specified
        if (values.timeSlot) {
          Object.assign(bagData, {
            timeSlot: values.timeSlot,
            quantity: values.quantity || 0,
          });
        }

        // Call the onAddBag handler
        const success = await onAddBag(bagData);

        if (success && onSuccess) {
          onSuccess();
          form.reset(); // Reset form on success
        }
      } catch (error) {
        console.error('Error adding new bag:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      disabled,
      allBags,
      bags,
      allProcesses,
      processes,
      allColors,
      colors,
      onAddBag,
      onSuccess,
      form,
    ],
  );

  const isLoading = isLoadingBags || isLoadingProcesses || isLoadingColors;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="bagId"
          render={({field}) => (
            <FormItem>
              <FormLabel>Loại túi</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại túi" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(allBags || bags)?.map(bag => (
                    <SelectItem key={bag.id} value={bag.id}>
                      {bag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="processId"
          render={({field}) => (
            <FormItem>
              <FormLabel>Công đoạn</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn công đoạn" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(allProcesses || processes)?.map(process => (
                    <SelectItem key={process.id} value={process.id}>
                      {process.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="colorId"
          render={({field}) => (
            <FormItem>
              <FormLabel>Màu sắc</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn màu" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(allColors || colors)?.map(color => (
                    <SelectItem key={color.id} value={color.id}>
                      {color.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Show quantity field if timeSlot is specified */}
        {timeSlot && (
          <FormField
            control={form.control}
            name="quantity"
            render={({field}) => (
              <FormItem>
                <FormLabel>Số lượng cho khung giờ {timeSlot}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Nhập số lượng"
                    value={field.value || 0}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="pt-2 flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <SubmitButton name="Thêm túi mới" isLoading={isSubmitting} />
        </div>
      </form>
    </Form>
  );
}
