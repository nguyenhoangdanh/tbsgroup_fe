import { useState, useCallback, useEffect } from 'react';
import { useHandBagQueries } from './useHandBagQueries';
import { useHandBagMutations } from './useHandBagMutations';
import {  HandBagWithDetails } from './useHandBagDetails';
import { BagColor, BagColorProcess } from '@/common/interface/handbag';
import { toast } from '../use-toast';

/**
 * Hook for working with the hierarchical relationship between HandBags, BagColors, and BagColorProcesses
 */
export const useHandBagHierarchy = (handBagId?: string) => {
  // State for tracking selected items in the hierarchy
  const [selectedHandBag, setSelectedHandBag] = useState<HandBagWithDetails | null>(null);
  const [selectedBagColor, setSelectedBagColor] = useState<BagColor & { processes: BagColorProcess[] } | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<BagColorProcess | null>(null);

  // Queries
  const { getHandBagWithDetails, invalidateHandBagDetailsCache } = useHandBagQueries();
  const { data: handBagDetails, isLoading, error, refetch } = getHandBagWithDetails(handBagId, { enabled: !!handBagId });

  // Mutations
  const { 
    onHandBagMutationSuccess,
    onBagColorMutationSuccess,
    onBagColorProcessMutationSuccess
  } = useHandBagMutations();

  // Effect to update selected handbag when details load
  useEffect(() => {
    if (handBagDetails && !selectedHandBag) {
      setSelectedHandBag(handBagDetails);
    }
  }, [handBagDetails, selectedHandBag]);

  // Select a specific color
  const selectColor = useCallback((colorId: string) => {
    if (!handBagDetails) return;
    
    const color = handBagDetails.colors.find(c => c.id === colorId);
    if (color) {
      setSelectedBagColor(color);
      setSelectedProcess(null); // Reset selected process
    } else {
      toast({
        title: 'Không tìm thấy màu túi',
        description: 'Màu túi đã chọn không tồn tại trong túi này',
        variant: 'destructive',
        duration: 2000,
      });
    }
  }, [handBagDetails]);

  // Select a specific process
  const selectProcess = useCallback((processId: string) => {
    if (!selectedBagColor) return;
    
    const process = selectedBagColor.processes.find(p => p.id === processId);
    if (process) {
      setSelectedProcess(process);
    } else {
      toast({
        title: 'Không tìm thấy công đoạn',
        description: 'Công đoạn đã chọn không tồn tại trong màu túi này',
        variant: 'destructive',
        duration: 2000,
      });
    }
  }, [selectedBagColor]);

  // Reset selected items
  const resetSelection = useCallback(() => {
    setSelectedBagColor(null);
    setSelectedProcess(null);
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    if (handBagId) {
      await invalidateHandBagDetailsCache(handBagId, true);
      refetch();
    }
  }, [handBagId, invalidateHandBagDetailsCache, refetch]);

  // Get the colors of the current handbag
  const getColors = useCallback(() => {
    return handBagDetails?.colors || [];
  }, [handBagDetails]);

  // Get the processes of the selected color
  const getProcesses = useCallback(() => {
    return selectedBagColor?.processes || [];
  }, [selectedBagColor]);

  return {
    // State
    handBagDetails,
    selectedHandBag,
    selectedBagColor,
    selectedProcess,
    isLoading,
    error,
    
    // Selectors
    selectColor,
    selectProcess,
    resetSelection,
    
    // Data access
    getColors,
    getProcesses,
    
    // Actions
    refreshData,
    
    // Mutation callbacks
    onHandBagMutationSuccess,
    onBagColorMutationSuccess,
    onBagColorProcessMutationSuccess
  };
};