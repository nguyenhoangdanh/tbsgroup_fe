import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toast-kit';
import { z } from 'zod';

import { Factory } from '@/common/interface/factory';
import { Line, LineCreateDTO, LineUpdateDTO } from '@/common/interface/line';
import { FieldInput } from '@/components/common/Form/FieldInput';
import { FieldTextarea } from '@/components/common/Form/FieldTextarea';
import FormActions from '@/components/common/Form/FormAction';
import { Form } from '@/components/ui/form';
import { useDialog } from '@/contexts/DialogProvider';
import { useLine } from '@/hooks/line/LineContext';

// Validation schema for line form
const lineSchema = z.object({
  code: z
    .string()
    .min(2, { message: 'Mã dây chuyền phải có ít nhất 2 ký tự' })
    .max(50, { message: 'Mã dây chuyền không được vượt quá 50 ký tự' }),
  name: z
    .string()
    .min(3, { message: 'Tên dây chuyền phải có ít nhất 3 ký tự' })
    .max(100, { message: 'Tên dây chuyền không được vượt quá 100 ký tự' }),
  description: z
    .string()
    .optional()
    .nullable()
    .refine(val => val == null || val.length <= 500, {
      message: 'Mô tả không được vượt quá 500 ký tự',
    }),
  capacity: z.preprocess(
    val => (val === '' || val === null || val === undefined ? null : Number(val)),
    z
      .number()
      .optional()
      .nullable()
      .refine(val => val == null || (val >= 0 && val <= 10000), {
        message: 'Công suất phải nằm trong khoảng 0-10,000',
      }),
  ),
});

type LineFormData = z.infer<typeof lineSchema> & {
  factoryId: string;
  id?: string;
};

interface LineFormProps {
  factoryId: string;
  factory: Partial<Pick<Factory, 'id' | 'name' | 'code'>> & { id?: string };
  line?: Partial<Line>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LineForm: React.FC<LineFormProps> = ({ factoryId, factory, line, onSuccess, onCancel }) => {
  const { mutations, cache } = useLine();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hideDialog } = useDialog();

  const form = useForm<LineFormData>({
    resolver: zodResolver(lineSchema),
    defaultValues: line
      ? {
          id: line.id,
          factoryId,
          code: line.code ?? '',
          name: line.name ?? '',
          description: line.description ?? null,
          capacity: line.capacity ?? null,
        }
      : {
          factoryId,
          code: '',
          name: '',
          description: null,
          capacity: null,
        },
  });

  const handleSubmit = useCallback(
    async (data: LineFormData) => {
      if (isSubmitting) return false;

      setIsSubmitting(true);

      try {
        const submitData: LineCreateDTO | LineUpdateDTO = {
          ...data,
          factoryId,
          capacity: data.capacity ?? undefined,
        };

        // Determine if this is create or update
        if (line?.id) {
          // Update existing line
          await mutations.update({
            id: line.id,
            ...submitData,
          });

          hideDialog();

          toast({
            title: 'Cập nhật dây chuyền thành công',
            description: `Dây chuyền "${data.name}" đã được cập nhật`,
            duration: 2000,
          });

          //  Invalidate cache for this line
          try {
            await cache.invalidateDetails(line.id, { forceRefetch: true });
          } catch (cacheError) {
            console.error('Cache invalidation error:', cacheError);
            // Fallback to direct refetch if needed (could add implementation here)
          }
        } else {
          // Create new line
          const result = await mutations.create(submitData);

          hideDialog();
          toast({
            title: 'Tạo dây chuyền thành công',
            description: `Dây chuyền "${data.name}" đã được tạo`,
            duration: 2000,
          });

          //  Invalidate factory lines cache
          if (result?.id) {
            try {
              await cache.prefetchByFactory(factoryId);
            } catch (cacheError) {
              console.error('Cache prefetch error:', cacheError);
              //  Handle cache error silently
            }
          }
        }

        //  Call success callback if provided
        onSuccess?.();

        return true;
      } catch (error) {
        // Handle submission errors
        toast({
          title: 'Lỗi',
          description: error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định',
          variant: 'error',
          duration: 3000,
        });

        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, factoryId, line?.id, mutations, cache, onSuccess],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Form header */}
        <div className="mb-4">
          <h2 className="text-lg font-medium">
            {line?.id ? 'Cập nhật dây chuyền' : 'Thêm dây chuyền mới'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {factory.name} ({factory.code})
          </p>
        </div>

        {/* Basic information fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            control={form.control}
            name="code"
            label="Mã dây chuyền"
            placeholder="Nhập mã dây chuyền"
            disabled={!!line?.id || isSubmitting}
            required
          />

          <FieldInput
            control={form.control}
            name="name"
            label="Tên dây chuyền"
            placeholder="Nhập tên dây chuyền"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Description field */}
        <FieldTextarea
          control={form.control}
          name="description"
          label="Mô tả"
          placeholder="Nhập mô tả dây chuyền"
          disabled={isSubmitting}
          rows={3}
        />

        {/* Additional details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            control={form.control}
            name="capacity"
            label="Công suất (sản phẩm/ngày)"
            placeholder="Nhập công suất"
            type="number"
            disabled={isSubmitting}
          />
        </div>

        {/* Form actions */}
        <FormActions isSubmitting={isSubmitting} isEdit={!!line?.id} onCancel={onCancel} />
      </form>
    </Form>
  );
};

export default LineForm;
