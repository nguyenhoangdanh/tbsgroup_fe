"use client"
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect
} from 'react';

// Enum to define dialog types
export enum DialogType {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  VIEW = 'view'
}

// Generic interface for dialog configuration
export interface DialogConfig<T = any> {
  type?: DialogType;
  open: boolean;
  title?: string;
  description?: string;
  data?: T;
  children?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
  onSubmit?: (data?: T) => Promise<void | boolean>;
  onClose?: () => void;
  fullWidth?: boolean;
}

// Interface for dialog children props
export interface DialogChildrenProps<T = any> {
  data?: T;
  isSubmitting: boolean;
  onSubmit: (data?: T) => Promise<void | boolean>;
  onClose: () => void;
}

// Interface for dialog context
interface DialogContextType<T = any> {
  dialog: DialogConfig<T>;
  isSubmitting: boolean;
  showDialog: (config: Partial<Omit<DialogConfig<T>, 'open'>>) => void;
  hideDialog: () => void;
  submit: (data?: T) => Promise<void | boolean>;
}

// Create dialog context
const DialogContext = createContext<DialogContextType>({
  dialog: { open: false },
  isSubmitting: false,
  showDialog: () => { },
  hideDialog: () => { },
  submit: async () => { }
});

// Provider for managing dialog state
export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogConfig>({
    open: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const showDialog = useCallback((config: Partial<Omit<DialogConfig, 'open'>>) => {
    setIsClosing(false);
    setDialog({
      ...config,
      open: true
    });
  }, []);

  const hideDialog = useCallback(() => {
    // Mark as closing to prevent multiple close attempts
    if (isClosing) {
      console.log("[DialogProvider] Dialog already closing, ignoring duplicate call");
      return;
    }

    setIsClosing(true);

    // Call onClose callback if provided
    if (dialog.onClose) {
      console.log("[DialogProvider] Calling dialog onClose callback");
      dialog.onClose();
    }

    // Reset dialog state - first set open to false
    setDialog((prev) => ({ ...prev, open: false }));

    // Then clear dialog content after animation completes
    setTimeout(() => {
      setDialog({ open: false });
      setIsClosing(false);
    }, 300);
  }, [dialog, isClosing]);

  const submit = useCallback(async (data?: any) => {
    if (!dialog.onSubmit) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Call onSubmit and await result
      const result = await dialog.onSubmit(data);

      // IMPORTANT: Always hide dialog after successful submission,
      // even if onSubmit doesn't return a value (void)
      hideDialog();

      return result;
    } catch (error) {
      console.error("[DialogProvider] Dialog submit error:", error);
      // Don't hide dialog on error to allow user to retry
      return Promise.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [dialog, hideDialog]);

  return (
    <DialogContext.Provider
      value={{
        dialog,
        isSubmitting,
        showDialog,
        hideDialog,
        submit
      }}
    >
      {children}
    </DialogContext.Provider>
  );
};

// Hook to use dialog context
export const useDialog = <T = any>() => {
  const context = useContext(DialogContext) as DialogContextType<T>;
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};