'use client';

import React from 'react';
import { useController, FieldValues } from 'react-hook-form';

import {
  TextField,
  PasswordField,
  TextareaField,
  SelectField,
  ComboboxField,
  CheckboxField,
  RadioField,
  DateField,
  DateTimeField,
  TimeField,
  TimeRangeField,
  DateRangeField,
  ColorField,
  SwitchField,
} from './fieldTypes';
import { UnifiedFormFieldProps } from './types';

/**
 * Unified Form Field Component
 *
 * Renders the appropriate field component based on the specified type
 */
export function UnifiedFormField<T extends FieldValues>({
  name,
  label,
  control,
  type,
  placeholder,
  className,
  disabled = false,
  required = false,

  // Text input props
  autoComplete,
  rows,

  // Select/Radio/Combobox props
  options = [],
  searchPlaceholder,
  orientation = 'vertical',

  // Date/Time props
  minDate,
  maxDate,
  allowSameTime,
  allowSameDateTime,

  // Description
  description,

  allowClear,

  //  Additional props
  ...rest
}: UnifiedFormFieldProps<T>) {
  // Use controller from react-hook-form to handle field registration and events
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
    rules: { required: required ? `${label} là bắt buộc` : false },
    defaultValue: undefined,
  });

  // Render the appropriate field component based on type
  switch (type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <TextField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          autoComplete={autoComplete}
          type={type}
          {...rest}
        />
      );

    case 'password':
      return (
        <PasswordField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          autoComplete={autoComplete}
          {...rest}
        />
      );

    case 'textarea':
      return (
        <TextareaField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          rows={rows}
          {...rest}
        />
      );

    case 'select':
      return (
        <SelectField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          options={options}
          {...rest}
        />
      );

    case 'combobox':
    case 'autocomplete':
      return (
        <ComboboxField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          options={options}
          allowClear={allowClear}
          searchPlaceholder={searchPlaceholder}
          {...rest}
        />
      );

    case 'checkbox':
      return (
        <CheckboxField
          name={name}
          field={field}
          error={error}
          label={label}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          {...rest}
        />
      );

    case 'radio':
      return (
        <RadioField
          name={name}
          field={field}
          error={error}
          label={label}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          options={options}
          orientation={orientation}
          {...rest}
        />
      );

    case 'date':
      return (
        <DateField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          minDate={minDate}
          maxDate={maxDate}
          {...rest}
        />
      );

    case 'datetime':
      return (
        <DateTimeField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          minDate={minDate}
          maxDate={maxDate}
          {...rest}
        />
      );

    case 'time':
      return (
        <TimeField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          {...rest}
        />
      );

    case 'time-range':
      return (
        <TimeRangeField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          allowSameTime={allowSameTime}
          {...rest}
        />
      );

    case 'date-range':
      return (
        <DateRangeField
          name={name}
          field={field}
          error={error}
          label={label}
          placeholder={placeholder}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          minDate={minDate}
          maxDate={maxDate}
          allowSameDateTime={allowSameDateTime}
          {...rest}
        />
      );

    case 'color':
      return (
        <ColorField
          name={name}
          field={field}
          error={error}
          label={label}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          customColors={rest.customColors}
          {...rest}
        />
      );

    case 'switch':
      return (
        <SwitchField
          name={name}
          field={field}
          error={error}
          label={label}
          description={description}
          required={required}
          disabled={disabled}
          className={className}
          onChange={rest.onChange}
          {...rest}
        />
      );

    default:
      return (
        <div className="p-4 border border-red-500 rounded-md bg-red-50 text-red-800">
          <p>Unsupported field type: {type}</p>
        </div>
      );
  }
}

export default UnifiedFormField;
