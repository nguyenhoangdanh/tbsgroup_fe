'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';

// Enum to define dialog types
export enum DialogType {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  BATCH_DELETE = 'batch_delete',
  VIEW = 'view',
  CUSTOM = 'custom',
}

// Generic interface for dialog configuration
export interface DialogConfig<TData = any> {
  type?: DialogType;
  open: boolean;
  title?: string;
  description?: string;
  data?: TData;
  children?: React.ReactNode | ((props: DialogChildrenProps<TData>) => React.ReactNode);
  onSubmit?: (data?: TData) => Promise<void | boolean>;
  onClose?: () => void;
  fullWidth?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'; // Enhanced size options
  id?: string;
  isReadOnly?: boolean;
  preventOutsideClick?: boolean; // Prevent closing when clicking outside
}

// Interface for dialog children props
export interface DialogChildrenProps<TData = any> {
  data?: TData;
  isSubmitting: boolean;
  onSubmit: (data?: TData) => Promise<void | boolean>;
  onClose: () => void;
  isReadOnly?: boolean;
  type?: DialogType;
}

// Interface for dialog context
interface DialogContextType<TData = any> {
  dialog: DialogConfig<TData>;
  isOpen: boolean;
  isSubmitting: boolean;
  showDialog: (config: Partial<Omit<DialogConfig<TData>, 'open'>>) => void;
  hideDialog: () => void;
  submit: (data?: TData) => Promise<void | boolean>;
  updateDialogData: (newData: Partial<TData>) => void;
  isReadOnly: boolean;
}

// Define a type for the default data structure
export type DefaultDialogData = Record<string, unknown>;

// Default values for context to prevent undefineds
const defaultDialogConfig: DialogConfig = { open: false };

// Create dialog context with default values
const DialogContext = createContext<DialogContextType<DefaultDialogData>>({
  dialog: defaultDialogConfig,
  isOpen: false,
  isSubmitting: false,
  showDialog: () => {},
  hideDialog: () => {},
  submit: async () => {},
  updateDialogData: () => {},
  isReadOnly: false,
});

/**
 * Provider component for managing dialog state
 * This provides a central dialog system that can be used anywhere in the application
 */
export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for dialog configuration
  const [dialog, setDialog] = useState<DialogConfig<DefaultDialogData>>(defaultDialogConfig);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for managing dialog state between renders
  const isClosingRef = useRef(false);
  const currentDataRef = useRef<any>(null);
  const dialogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogIdRef = useRef<string>('');
  const submitInProgressRef = useRef(false);

  // Show dialog with new configuration
  const showDialog = useCallback(
    (config: Partial<Omit<DialogConfig<DefaultDialogData>, 'open'>>) => {
      // Clear any pending close timer
      if (dialogTimerRef.current) {
        clearTimeout(dialogTimerRef.current);
        dialogTimerRef.current = null;
      }

      // Reset closing state
      isClosingRef.current = false;

      // Create unique ID if not provided
      const dialogId = config.id || `dialog-${Date.now()}`;
      dialogIdRef.current = dialogId;

      // Store data reference
      currentDataRef.current = config.data || null;

      // Update dialog state
      setDialog(prev => ({
        ...prev,
        ...config,
        id: dialogId,
        open: true,
      }));
    },
    [],
  );

  // Hide/close dialog
  const hideDialog = useCallback(() => {
    // Prevent multiple close calls
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // Call onClose callback if provided
    if (dialog.onClose) {
      try {
        dialog.onClose();
      } catch (error) {
        console.error('[DialogProvider] Error in onClose handler:', error);
      }
    }

    // Set open to false immediately for animation
    setDialog(prev => ({ ...prev, open: false }));

    // Schedule cleanup after animation completes
    dialogTimerRef.current = setTimeout(() => {
      // Reset dialog state
      setDialog(defaultDialogConfig);
      currentDataRef.current = null;
      dialogIdRef.current = '';
      isClosingRef.current = false;
      dialogTimerRef.current = null;
    }, 300); // Match animation duration
  }, [dialog]);

  // Update data for current dialog
  const updateDialogData = useCallback(
    (newData: Partial<DefaultDialogData>) => {
      if (!dialog.open) return;

      // Update both ref and state
      setDialog(prev => {
        const updatedData = { ...(prev.data || {}), ...newData };
        currentDataRef.current = updatedData;
        return {
          ...prev,
          data: updatedData,
        };
      });
    },
    [dialog.open],
  );

  // Handle form submission
  const submit = useCallback(
    async (data?: any) => {
      // Skip if no submit handler or already submitting
      if (!dialog.onSubmit || submitInProgressRef.current) return;

      // Set submitting state
      submitInProgressRef.current = true;
      setIsSubmitting(true);

      try {
        // Use provided data or fallback to stored data
        const dataToSubmit = data !== undefined ? data : currentDataRef.current;

        // Call onSubmit and await result
        const result = await dialog.onSubmit(dataToSubmit);

        // Close dialog after successful submission if result is true
        if (result === true) {
          hideDialog();
        }

        return result;
      } catch (error) {
        console.error(`[DialogProvider] Dialog ${dialogIdRef.current} submit error:`, error);
        // Propagate error to caller
        return Promise.reject(error);
      } finally {
        // Reset submitting state
        submitInProgressRef.current = false;
        setIsSubmitting(false);
      }
    },
    [dialog, hideDialog],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dialogTimerRef.current) {
        clearTimeout(dialogTimerRef.current);
      }
    };
  }, []);

  // Memoized context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      dialog,
      isOpen: dialog.open,
      isSubmitting,
      showDialog,
      hideDialog,
      submit,
      updateDialogData,
      isReadOnly: dialog.isReadOnly || false,
    }),
    [dialog, isSubmitting, showDialog, hideDialog, submit, updateDialogData],
  );

  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
};

// Custom hook to use dialog context with generic type support
export const useDialog = <T = any,>() => {
  const context = useContext(DialogContext) as DialogContextType<T>;
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
