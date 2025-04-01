import React, { useState, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { FieldInput } from '@/components/common/Form/FieldInput';
import { FieldTextarea } from '@/components/common/Form/FieldTextarea';
import { FieldSelect } from '@/components/common/Form/FieldSelect';
import FormActions from '@/components/common/Form/FormAction';
import { useDialog } from '@/context/DialogProvider';
import { Factory } from '@/common/interface/factory';
import { Line, LineCreateDTO, LineUpdateDTO, LineWithDetails } from '@/common/interface/line';
import { Button } from '@/components/ui/button';

// Schema validation for line
const lineSchema = z.object({
    id: z.string().optional(),
    factoryId: z.string(),
    code: z.string().min(2, { message: 'Mã dây chuyền phải có ít nhất 2 ký tự' }),
    name: z.string().min(3, { message: 'Tên dây chuyền phải có ít nhất 3 ký tự' }),
    description: z.string().optional().nullable(),
    capacity: z.number().optional().nullable().transform(val => val ?? undefined),
    status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
    createdAt: z.union([z.string(), z.date()]).optional(),
    updatedAt: z.union([z.string(), z.date()]).optional(),
});

type LineSchema = z.infer<typeof lineSchema>;

interface LineFormProps {
    factoryId: string;
    factory: Pick<Factory, 'id' | 'name' | 'code'>;
    line?: Partial<LineWithDetails>;
    onSuccess?: () => void;
}

const LineForm: React.FC<LineFormProps> = memo(({
    factoryId,
    factory,
    line,
    onSuccess,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { hideDialog, isReadOnly } = useDialog();

    // Status options
    const statusOptions = [
        { value: 'ACTIVE', label: 'Hoạt động' },
        { value: 'INACTIVE', label: 'Tạm dừng' },
        { value: 'MAINTENANCE', label: 'Bảo trì' },
    ];

    // Initialize form with default or existing values
    const form = useForm<LineSchema>({
        resolver: zodResolver(lineSchema),
        defaultValues: line
            ? {
                id: line.id,
                factoryId: factoryId,
                code: line.code ?? '',
                name: line.name ?? '',
                description: line.description ?? '',
                capacity: line.capacity ?? undefined,
                status: line.status ?? 'ACTIVE',
                createdAt: line.createdAt,
                updatedAt: line.updatedAt,
            }
            : {
                factoryId: factoryId,
                code: '',
                name: '',
                description: '',
                capacity: undefined,
                status: 'ACTIVE',
            },
    });

    // Handle form submission
    const handleSubmit = async (values: LineSchema) => {
        if (isReadOnly || isSubmitting) return;

        try {
            setIsSubmitting(true);

            // Numeric handling
            const capacity = values.capacity !== null ? Number(values.capacity) : undefined;

            // Prepare data for submission
            const submitData = {
                ...values,
                capacity,
            };

            // Close dialog and call success callback
            hideDialog();

            if (onSuccess) {
                onSuccess();
            }

            return true;
        } catch (error) {
            console.error('Error saving line data:', error);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="mb-4">
                    <h2 className="text-lg font-medium">
                        {line?.id ? 'Cập nhật dây chuyền' : 'Thêm dây chuyền mới'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {factory.name} ({factory.code})
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="code"
                        label="Mã dây chuyền"
                        placeholder="Nhập mã dây chuyền"
                        disabled={isSubmitting || isReadOnly || !!line?.id}
                        required
                    />

                    <FieldInput
                        control={form.control}
                        name="name"
                        label="Tên dây chuyền"
                        placeholder="Nhập tên dây chuyền"
                        disabled={isSubmitting || isReadOnly}
                        required
                    />
                </div>

                <FieldTextarea
                    control={form.control}
                    name="description"
                    label="Mô tả"
                    placeholder="Nhập mô tả dây chuyền"
                    disabled={isSubmitting || isReadOnly}
                    rows={3}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldInput
                        control={form.control}
                        name="capacity"
                        label="Công suất (sản phẩm/ngày)"
                        placeholder="Nhập công suất"
                        type="number"
                        disabled={isSubmitting || isReadOnly}
                    />

                    <FieldSelect
                        control={form.control}
                        name="status"
                        label="Trạng thái"
                        placeholder="Chọn trạng thái"
                        disabled={isSubmitting || isReadOnly}
                        options={statusOptions}
                    />
                </div>

                <FormActions
                    isSubmitting={isSubmitting}
                    isReadOnly={isReadOnly}
                    isEdit={!!line?.id}
                />
            </form>
        </Form>
    );
});

export default LineForm;