'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback, useEffect, useMemo, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { AutoForm } from 'react-table-power';
import { z } from 'zod';

import { FieldInput, FieldSelect, FormController, FieldTextarea } from '@/components/common/fields';

const departmentSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(2, { message: 'Mã phòng ban phải có ít nhất 2 ký tự' }),
  name: z.string().min(3, { message: 'Tên phòng ban phải có ít nhất 3 ký tự' }),
  description: z.string().optional().nullable(),
  departmentType: z.enum(['HEAD_OFFICE', 'FACTORY_OFFICE'], {
    errorMap: () => ({ message: 'Loại phòng ban không hợp lệ' })
  }),
  parentId: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type DepartmentSchema = z.infer<typeof departmentSchema>;

const defaultDepartmentValues: DepartmentSchema = {
  code: '',
  name: '',
  description: '',
  departmentType: 'HEAD_OFFICE',
  parentId: null,
};

interface DepartmentFormProps {
  data?: any;
  dialogType?: 'create' | 'edit' | 'view' | 'delete' | 'custom';
  onSubmit?: (data: any) => Promise<boolean> | boolean;
  onClose?: () => void;
  isReadOnly?: boolean;
  loading?: boolean;
  error?: any;
  onFormDirty?: (isDirty: boolean) => void;
  departments?: { id: string; name: string; departmentType: string }[];
  isLoadingDepartments?: boolean;
  delayValidation?: boolean;
  skipInitialValidation?: boolean;
}

// Use forwardRef to handle ref properly, but let AutoForm manage the imperative handle
const DepartmentForm = forwardRef<any, DepartmentFormProps>((props, ref) => {
  const {
    onSubmit,
    isReadOnly = false,
    departments = [],
    data,
    dialogType = 'create',
    onClose,
    error,
    onFormDirty,
    loading,
    isLoadingDepartments = false,
    delayValidation = false,
    skipInitialValidation = false
  } = props;
  
  // Debug data received
  console.log('[DepartmentForm] Received data:', data);
  console.log('[DepartmentForm] DialogType:', dialogType);
  console.log('[DepartmentForm] Has onSubmit:', !!onSubmit);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Check if in edit mode
  const isEditMode = dialogType === 'edit' || !!data?.id;

  // Determine if form should be read-only
  const effectiveReadOnly = isReadOnly || dialogType === 'view';

  // Choose the appropriate schema based on edit mode
  const departmentTypeSchema = departmentSchema;

  console.log('[DepartmentForm] Using schema for mode:', isEditMode ? 'edit' : 'create');

  // Configure validation mode
  const validationMode = 'onTouched';

  // Create default values from data with proper type handling
  const createDefaultValues = () => {
    console.log('[DepartmentForm] Creating default values from:', data);
    
    // Default values for create mode
    if (!data) {
      return {
        code: '',
        name: '',
        description: '',
        departmentType: 'HEAD_OFFICE' as const,
        parentId: null,
      };
    }
    
    // Values for edit mode - ensure ID is preserved
    return {
      id: data.id,
      code: data.code || '',
      name: data.name || '',
      description: data.description || '',
      departmentType: data.departmentType || 'HEAD_OFFICE' as const,
      parentId: data.parentId || null,
    };
  };

  // Initialize form with react-hook-form
  const form = useForm<DepartmentSchema>({
    resolver: zodResolver(departmentTypeSchema),
    mode: validationMode,
    defaultValues: createDefaultValues(),
  });

  // Debug log form and form controller
  console.log('[DepartmentForm] Form instance:', form);
  console.log('[DepartmentForm] Form methods available:', {
    getValues: typeof form.getValues,
    handleSubmit: typeof form.handleSubmit,
    trigger: typeof form.trigger,
    reset: typeof form.reset,
    watch: typeof form.watch,
    setValue: typeof form.setValue,
    formState: !!form.formState
  });
  
  // Basic form state tracking for debugging
  useEffect(() => {
    // Log whenever errors change to help with debugging
    console.log('[DepartmentForm] Current form errors:', form.formState.errors);
    
    // If form is dirty and has no errors, it's valid
    const hasErrors = Object.keys(form.formState.errors).length > 0;
    const isCurrentlyValid = form.formState.isDirty && !hasErrors;
    
    console.log('[DepartmentForm] Form validation status:', { 
      isDirty: form.formState.isDirty,
      isValid: isCurrentlyValid,
      hasErrors: hasErrors,
      submitCount: form.formState.submitCount
    });
    
  }, [form.formState.errors, form.formState.isDirty]);

  // Available parents for department (excluding current department)
  const availableParents = useMemo(() => {
    const filtered = departments.filter(dept => dept.id !== data?.id);
    console.log('[DepartmentForm] Available parents:', {
      originalCount: departments.length,
      filteredCount: filtered.length,
      currentDeptId: data?.id,
      filtered
    });
    return filtered;
  }, [departments, data?.id]);

  // Process form data before submission with additional validation
  const processFormData = React.useCallback((values: DepartmentSchema): DepartmentSchema => {
    console.log('[DepartmentForm] Processing form data:', values);
    setHasInteracted(true);
    
    // For edit mode, ensure ID is preserved
    const processedData = { ...values };
    if (isEditMode && data?.id) {
      processedData.id = data.id;
    }
    
    return processedData;
  }, [isEditMode, data?.id]);

  // Form submission handler with improved validation handling
  const handleFormSubmit = async (values: DepartmentSchema) => {
    if (effectiveReadOnly || isSubmitting) return false;

    try {
      setIsSubmitting(true);
      console.log('[DepartmentForm] Submitting form with values:', values);

      // Process the data
      const processedData = processFormData(values);
      
      if (onSubmit) {
        const result = await onSubmit(processedData);
        console.log('[DepartmentForm] Form submission result:', result);
        return result;
      }
      
      return true;
    } catch (error) {
      console.error('[DepartmentForm] Form submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Department type options
  const departmentTypeOptions = [
    { value: 'HEAD_OFFICE', label: 'Văn phòng điều hành' },
    { value: 'FACTORY_OFFICE', label: 'Văn phòng nhà máy' },
  ];

  // Memoize this callback to avoid recreating it on every render
  const handleFormDirtyChange = useCallback((isDirty: boolean) => {
    console.log('[DepartmentForm] Form dirty state changed:', isDirty);
    if (onFormDirty) {
      onFormDirty(isDirty);
    }
  }, [onFormDirty]);

  // Parent department options with improved handling
  const parentOptions = useMemo(() => {
    const options = availableParents.map(dept => ({
      value: dept.id,
      label: `${dept.name} (${dept.departmentType === 'HEAD_OFFICE' ? 'Văn phòng điều hành' : 'Văn phòng nhà máy'})`
    }));
    
    console.log('[DepartmentForm] Generated parent options:', options);
    return options;
  }, [availableParents]);

  // Clean up departments data to ensure no duplicate keys
  const safeDepartments = useMemo(() => {
    if (!departments || !Array.isArray(departments)) return [];
    
    const uniqueDepartments = departments.filter((dept, index, self) => {
      const firstIndex = self.findIndex(d => d.id === dept.id);
      return firstIndex === index;
    });
    
    console.log('[DepartmentForm] Safe departments:', {
      original: departments.length,
      filtered: uniqueDepartments.length,
      duplicatesRemoved: departments.length - uniqueDepartments.length
    });
    
    return uniqueDepartments;
  }, [departments]);

  // Reset form if data changes - but only when dialog opens with new data
  useEffect(() => {
    if (data && dialogType) {
      console.log('[DepartmentForm] Resetting form with new data for dialog type:', dialogType, data);
      const newValues = createDefaultValues();
      form.reset(newValues);
    }
  }, [data, dialogType, form]);

  // Report validation state changes to parent
  useEffect(() => {
    const subscription = form.watch(() => {
      // Check form state
      const isDirty = form.formState.isDirty;
      // Log form state changes
      console.log('[DepartmentForm] Form state updated:', {
        isDirty,
        isValid: form.formState.isValid,
        touchedFields: Object.keys(form.formState.touchedFields),
        errors: Object.keys(form.formState.errors),
        dialogType: dialogType
      });

      // Notify parent about dirty state
      if (onFormDirty) {
        onFormDirty(isDirty);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, onFormDirty, dialogType]);

  // Calculate effective skipInitialValidation value
  const effectiveSkipInitialValidation = skipInitialValidation || delayValidation;

  console.log('---------Error state:', error, form.formState.errors);

  // Show loading state if departments are being loaded
  if (isLoadingDepartments) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Đang tải danh sách phòng ban...</span>
      </div>
    );
  }

  return (
    <AutoForm
      form={form}
      onSubmit={handleFormSubmit}
      dialogType={dialogType}
      onFormDirty={handleFormDirtyChange}
      skipInitialValidation={effectiveSkipInitialValidation}
      ref={ref}
    >
      <FormController
        form={form}
        onSubmit={handleFormSubmit}
      >
        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldInput
            control={form.control}
            name="code"
            label="Mã phòng ban"
            placeholder="Nhập mã phòng ban"
            disabled={isSubmitting || effectiveReadOnly || !!data?.id}
            required
          />

          <FieldInput
            control={form.control}
            name="name"
            label="Tên phòng ban"
            placeholder="Nhập tên phòng ban"
            disabled={isSubmitting || effectiveReadOnly}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldSelect
            control={form.control}
            name="departmentType"
            label="Loại phòng ban"
            placeholder="Chọn loại phòng ban"
            disabled={isSubmitting || effectiveReadOnly}
            options={departmentTypeOptions}
            required
          />

          <FieldSelect
            control={form.control}
            name="parentId"
            label="Phòng ban cha"
            placeholder={
              parentOptions.length === 0
                ? "Không có phòng ban cha khả dụng"
                : "Chọn phòng ban cha (tùy chọn)"
            }
            disabled={isSubmitting || effectiveReadOnly || isLoadingDepartments || parentOptions.length === 0}
            options={parentOptions}
          />
        </div>

        <FieldTextarea
          control={form.control}
          name="description"
          label="Mô tả"
          placeholder="Nhập mô tả phòng ban"
          disabled={isSubmitting || effectiveReadOnly}
          rows={4}
        />
      </FormController>
    </AutoForm>
  );
});

DepartmentForm.displayName = 'DepartmentForm';

export default DepartmentForm;
