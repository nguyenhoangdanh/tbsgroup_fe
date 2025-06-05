'use client';
import { useState, useCallback } from 'react';
import { BaseTableData } from '../types';

export type DialogMode = 'create' | 'edit' | 'view' | 'delete' | 'custom';

interface DialogState<T = any> {
  open: boolean;
  mode: DialogMode;
  data?: T;
  title?: string;
  loading?: boolean;
}

export function useTableDialog<T extends BaseTableData>() {
  const [dialogState, setDialogState] = useState<DialogState<T>>({
    open: false,
    mode: 'create',
  });

  const openDialog = useCallback((mode: DialogMode, data?: T, title?: string) => {
    setDialogState({
      open: true,
      mode,
      data,
      title,
      loading: false,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      open: false,
      loading: false,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setDialogState(prev => ({
      ...prev,
      loading,
    }));
  }, []);

  const updateData = useCallback((data: T) => {
    setDialogState(prev => ({
      ...prev,
      data,
    }));
  }, []);

  return {
    dialogState,
    openDialog,
    closeDialog,
    setLoading,
    updateData,
  };
}