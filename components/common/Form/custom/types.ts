'use client';

import { FieldValues, Control, Path } from 'react-hook-form';

/**
 * Options cho select, combobox, radio, etc.
 */
export interface FormFieldOption {
  value: string | number | boolean;
  label: string;
}

/**
 * Các loại field được hỗ trợ
 */
export type FormFieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'textarea'
  | 'select'
  | 'combobox'
  | 'autocomplete'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'date'
  | 'datetime'
  | 'time'
  | 'time-range'
  | 'date-range'
  | 'color';

/**
 * Base props cho tất cả form fields
 */
export interface UnifiedFormFieldProps<T extends FieldValues> {
  //Common props
  name: Path<T>;
  label: string;
  control: Control<T>;
  type: FormFieldType;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;

  // Text input props
  autoComplete?: string;
  rows?: number; // For textarea

  // Select/Radio/Combobox props
  options?: FormFieldOption[];
  searchPlaceholder?: string;
  orientation?: 'horizontal' | 'vertical';

  // Date/Time props
  minDate?: Date;
  maxDate?: Date;
  dateOnly?: boolean;
  timeOnly?: boolean;
  allowSameTime?: boolean;
  allowSameDateTime?: boolean;

  //  Color props
  customColors?: string[];

  //  Description
  description?: string;

  // Additional props
  accentColor?: string;

  // onChange
  onChange?: (value: any) => void;
  allowClear?: boolean;
}
