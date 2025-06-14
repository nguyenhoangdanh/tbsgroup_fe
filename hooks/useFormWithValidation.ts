import { useEffect, useRef } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useFormHandling } from 'react-table-power';

import { DialogMode } from '../types';

/**
 * A custom hook that integrates React Hook Form with the FormHandlingContext
 * This replaces the need for useImperativeHandle by connecting forms directly to the context
 */
export function useFormWithValidation<TFormValues extends Record<string, any> = any>(
  options: {
    mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all';
    defaultValues?: Partial<TFormValues>;
    resolver?: any;
    dialogType?: DialogMode;
    onSubmit?: (data: TFormValues) => Promise<any> | any;
  }
) {
  // Get the form methods from React Hook Form
  const formMethods = useForm<TFormValues>({
    mode: options.mode || 'onSubmit',
    defaultValues: options.defaultValues,
    resolver: options.resolver,
  });
  
  // Get the FormHandlingContext
  const formHandling = useFormHandling();
  
  // Create a ref to hold form methods and expose custom methods
  const formRef = useRef({
    ...formMethods,
    // Custom methods that DataTable's dialog system expects
    getValidatedValues: async () => {
      try {
        // Trigger validation for all fields
        const isValid = await formMethods.trigger();
        if (!isValid) {
          // Get validation errors and throw them to be caught by dialog system
          const errors = formMethods.formState.errors;
          throw { errors };
        }
        // Return valid data
        return formMethods.getValues();
      } catch (err) {
        throw err;
      }
    },
    reset: (values?: any) => formMethods.reset(values),
    setValues: (values: any) => formMethods.reset(values),
    isDirty: formMethods.formState.isDirty,
    validate: () => formMethods.trigger(),
    submit: async () => {
      try {
        const isValid = await formMethods.trigger();
        if (!isValid) return false;
        
        if (options.onSubmit) {
          await formMethods.handleSubmit(options.onSubmit)();
        }
        return true;
      } catch (err) {
        return false;
      }
    },
  });
  
  // Update the ref when form methods change
  useEffect(() => {
    formRef.current = {
      ...formMethods,
      getValidatedValues: async () => {
        try {
          const isValid = await formMethods.trigger();
          if (!isValid) {
            throw { errors: formMethods.formState.errors };
          }
          return formMethods.getValues();
        } catch (err) {
          throw err;
        }
      },
      reset: (values?: any) => formMethods.reset(values),
      setValues: (values: any) => formMethods.reset(values),
      isDirty: formMethods.formState.isDirty,
      validate: () => formMethods.trigger(),
      submit: async () => {
        try {
          const isValid = await formMethods.trigger();
          if (!isValid) return false;
          
          if (options.onSubmit) {
            await formMethods.handleSubmit(options.onSubmit)();
          }
          return true;
        } catch (err) {
          return false;
        }
      },
    };
  }, [formMethods, options.onSubmit]);
  
  // Register with FormHandlingContext if dialogType is provided
  useEffect(() => {
    if (options.dialogType) {
      formHandling.registerForm(formRef, options.dialogType);
      
      return () => {
        formHandling.unregisterForm(options.dialogType!);
      };
    }
    return undefined;
  }, [formHandling, options.dialogType]);
  
  // Update form status in context when form state changes
  useEffect(() => {
    if (options.dialogType) {
      formHandling.updateFormStatus(options.dialogType, {
        isDirty: formMethods.formState.isDirty,
        isValid: formMethods.formState.isValid,
        isSubmitting: formMethods.formState.isSubmitting
      });
    }
  }, [
    formHandling, 
    options.dialogType, 
    formMethods.formState.isDirty, 
    formMethods.formState.isValid, 
    formMethods.formState.isSubmitting
  ]);
  
  return {
    // Original form methods
    ...formMethods,
    // Add formRef for backward compatibility if needed
    formRef,
  };
}
