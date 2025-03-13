
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  memo
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
  id?: string; // Thêm ID để phân biệt giữa các dialog
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
  isOpen: boolean;
  isSubmitting: boolean;
  showDialog: (config: Partial<Omit<DialogConfig<T>, 'open'>>) => void;
  hideDialog: () => void;
  submit: (data?: T) => Promise<void | boolean>;
  updateDialogData: (newData: T) => void;
}

// Create dialog context
const DialogContext = createContext<DialogContextType>({
  dialog: { open: false },
  isOpen: false,
  isSubmitting: false,
  showDialog: () => { },
  hideDialog: () => { },
  submit: async () => { },
  updateDialogData: () => { }
});

// Provider for managing dialog state
export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Sử dụng useRef để tránh re-renders không cần thiết
  const [dialog, setDialog] = useState<DialogConfig>({
    open: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isClosingRef = useRef(false);

  // Sử dụng ref để theo dõi dữ liệu hiện tại và tránh stale closure
  const currentDataRef = useRef<any>(null);

  // Sử dụng ref để theo dõi thời gian hiển thị dialog để tối ưu hóa hiệu suất
  const dialogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Thêm một ID ref để theo dõi các dialog khác nhau
  const dialogIdRef = useRef<string>("");

  const showDialog = useCallback((config: Partial<Omit<DialogConfig, 'open'>>) => {
    // Dừng timer đóng dialog nếu có
    if (dialogTimerRef.current) {
      clearTimeout(dialogTimerRef.current);
      dialogTimerRef.current = null;
    }

    isClosingRef.current = false;

    // Tạo ID nếu không có
    const dialogId = config.id || `dialog-${Date.now()}`;
    dialogIdRef.current = dialogId;

    // Lưu trữ data trong ref
    if (config.data) {
      currentDataRef.current = config.data;
    } else {
      currentDataRef.current = null;
    }

    // Dùng functional update để đảm bảo state mới nhất
    setDialog(prev => ({
      ...prev,
      ...config,
      id: dialogId,
      open: true
    }));

    // Log cho debugging trong môi trường dev
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DialogProvider] Showing dialog ${dialogId} with data:`, config.data);
    }
  }, []);

  const hideDialog = useCallback(() => {
    // Ngăn đóng nhiều lần
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;

    // Log cho debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DialogProvider] Closing dialog ${dialogIdRef.current}`);
    }

    // Gọi onClose callback nếu có
    if (dialog.onClose) {
      dialog.onClose();
    }

    // Đặt open = false trước
    setDialog(prev => ({ ...prev, open: false }));

    // Đặt timer để clear các dữ liệu khác sau khi animation kết thúc
    dialogTimerRef.current = setTimeout(() => {
      setDialog({ open: false });
      currentDataRef.current = null;
      dialogIdRef.current = "";
      isClosingRef.current = false;

      // Dừng timer sau khi thực hiện
      dialogTimerRef.current = null;
    }, 300); // 300ms cho animation
  }, [dialog]);

  // Cập nhật dữ liệu cho dialog đang mở
  // Modify updateDialogData to be more reliable
  // In DialogProvider.tsx, ensure the updateDialogData function correctly updates the state
  const updateDialogData = useCallback((newData: any) => {
    if (!dialog.open) return;

    // Use functional update to avoid stale closures
    setDialog(prev => {
      return {
        ...prev,
        data: newData
      };
    });
  }, [dialog.open]);

  const submit = useCallback(async (data?: any) => {
    if (!dialog.onSubmit) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Sử dụng dữ liệu từ tham số hoặc từ ref nếu không có
      const dataToSubmit = data || currentDataRef.current;

      // Log cho debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DialogProvider] Submitting dialog ${dialogIdRef.current} with data:`, dataToSubmit);
      }

      // Gọi onSubmit và đợi kết quả
      const result = await dialog.onSubmit(dataToSubmit);

      // Luôn đóng dialog sau khi submit thành công
      hideDialog();

      return result;
    } catch (error) {
      console.error(`[DialogProvider] Dialog ${dialogIdRef.current} submit error:`, error);
      // Không đóng dialog khi có lỗi để người dùng có thể thử lại
      return Promise.reject(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [dialog, hideDialog]);

  // Đảm bảo cleanup khi unmount
  useEffect(() => {
    return () => {
      if (dialogTimerRef.current) {
        clearTimeout(dialogTimerRef.current);
      }
    };
  }, []);

  // Tối ưu hóa context value để tránh re-render không cần thiết
  const contextValue = useMemo(() => ({
    dialog,
    isOpen: dialog.open,
    isSubmitting,
    showDialog,
    hideDialog,
    submit,
    updateDialogData
  }), [dialog, isSubmitting, showDialog, hideDialog, submit, updateDialogData]);

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
};

// Hook to use dialog context - Tối ưu hóa với generic type
export const useDialog = <T = any>() => {
  const context = useContext(DialogContext) as DialogContextType<T>;
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};








































// "use client"
// import React, {
//   createContext,
//   useContext,
//   useState,
//   ReactNode,
//   useCallback,
//   useRef,
//   useEffect
// } from 'react';

// // Enum to define dialog types
// export enum DialogType {
//   CREATE = 'create',
//   EDIT = 'edit',
//   DELETE = 'delete',
//   VIEW = 'view'
// }

// // Generic interface for dialog configuration
// export interface DialogConfig<T = any> {
//   type?: DialogType;
//   open: boolean;
//   title?: string;
//   description?: string;
//   data?: T;
//   children?: React.ReactNode | ((props: DialogChildrenProps<T>) => React.ReactNode);
//   onSubmit?: (data?: T) => Promise<void | boolean>;
//   onClose?: () => void;
//   fullWidth?: boolean;
//   id?: string
// };

// // Interface for dialog children props
// export interface DialogChildrenProps<T = any> {
//   data?: T;
//   isSubmitting: boolean;
//   onSubmit: (data?: T) => Promise<void | boolean>;
//   onClose: () => void;
// }

// // Interface for dialog context
// interface DialogContextType<T = any> {
//   dialog: DialogConfig<T>;
//   isOpen: boolean;
//   isSubmitting: boolean;
//   showDialog: (config: Partial<Omit<DialogConfig<T>, 'open'>>) => void;
//   hideDialog: () => void;
//   submit: (data?: T) => Promise<void | boolean>;
//   updateDialogData: (newData: T) => void;
// }

// // Create dialog context
// const DialogContext = createContext<DialogContextType>({
//   dialog: { open: false },
//   isOpen: false,
//   isSubmitting: false,
//   showDialog: () => { },
//   hideDialog: () => { },
//   submit: async () => { },
//  updateDialogData: () => { }
// });

// // Provider for managing dialog state
// export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [dialog, setDialog] = useState<DialogConfig>({
//     open: false
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isClosing, setIsClosing] = useState(false);

//   const showDialog = useCallback((config: Partial<Omit<DialogConfig, 'open'>>) => {
//     setIsClosing(false);
//     setDialog({
//       ...config,
//       open: true
//     });
//   }, []);

//   const hideDialog = useCallback(() => {
//     // Mark as closing to prevent multiple close attempts
//     if (isClosing) {
//       console.log("[DialogProvider] Dialog already closing, ignoring duplicate call");
//       return;
//     }

//     setIsClosing(true);

//     // Call onClose callback if provided
//     if (dialog.onClose) {
//       console.log("[DialogProvider] Calling dialog onClose callback");
//       dialog.onClose();
//     }

//     // Reset dialog state - first set open to false
//     setDialog((prev) => ({ ...prev, open: false }));

//     // Then clear dialog content after animation completes
//     setTimeout(() => {
//       setDialog({ open: false });
//       setIsClosing(false);
//     }, 300);
//   }, [dialog, isClosing]);

//   const submit = useCallback(async (data?: any) => {
//     if (!dialog.onSubmit) {
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       // Call onSubmit and await result
//       const result = await dialog.onSubmit(data);

//       // IMPORTANT: Always hide dialog after successful submission,
//       // even if onSubmit doesn't return a value (void)
//       hideDialog();

//       return result;
//     } catch (error) {
//       console.error("[DialogProvider] Dialog submit error:", error);
//       // Don't hide dialog on error to allow user to retry
//       return Promise.reject(error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [dialog, hideDialog]);

//   return (
//     <DialogContext.Provider
//       value={{
//         dialog,
//         isOpen: dialog.open,
//         isSubmitting,
//         showDialog,
//         hideDialog,
//         submit
//       }}
//     >
//       {children}
//     </DialogContext.Provider>
//   );
// };

// // Hook to use dialog context
// export const useDialog = <T = any>() => {
//   const context = useContext(DialogContext) as DialogContextType<T>;
//   if (!context) {
//     throw new Error('useDialog must be used within a DialogProvider');
//   }
//   return context;
// };