import { ControllerRenderProps, FieldValues, Path } from 'react-hook-form';

/**
 * Enhanced version of ControllerRenderProps with additional methods
 * that exist in practice but aren't in the type definition
 */
export interface EnhancedField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> extends ControllerRenderProps<TFieldValues, TName> {
  onFocus?: (e: React.FocusEvent<any>) => void;
}

/**
 * Helper function to cast a standard field to our enhanced field type
 */
export function enhanceField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
>(field: ControllerRenderProps<TFieldValues, TName>): EnhancedField<TFieldValues, TName> {
  return field as EnhancedField<TFieldValues, TName>;
}
