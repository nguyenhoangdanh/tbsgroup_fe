"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo
} from "react";
import { HandBag, HandBagCreateDTO, HandBagUpdateDTO, HandBagCondDTO } from "@/common/interface/handbag";
import { BaseResponseData, BasePaginationParams } from "@/hooks/base/useBaseQueries";
import { UseQueryResult } from "@tanstack/react-query";
import { useHandBagMutations } from "./useHandBagMutations";
import { useHandBagHelpers } from "./useHandBagHelpers";
import { useHandBagQueries } from "./useHandBagQueries";
import { toast } from "../use-toast";

interface HandBagContextType {
    listHandBags: (
        params?: HandBagCondDTO & BasePaginationParams,
        options?: any
    ) => UseQueryResult<BaseResponseData<HandBag>, Error>;
    deleteHandBagMutation: ReturnType<typeof useHandBagMutations>['deleteHandBagMutation'];
    setSelectedHandBag: (handbag: HandBag | null) => void;
    selectedHandBag: HandBag | null;
    loading: boolean;
    activeFilters: HandBagCondDTO & BasePaginationParams;
    handleCreateHandBag: (data: Omit<HandBagCreateDTO, 'id'>) => Promise<HandBag>;
    handleUpdateHandBag: (id: string, data: Omit<HandBagUpdateDTO, 'id'>) => Promise<HandBag>;
    resetError: () => void;
    updatePagination: (page: number, limit?: number) => void;
}

const HandBagContext = createContext<HandBagContextType | undefined>(undefined);

export const HandBagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Use stable state initialization
    const [selectedHandBag, setSelectedHandBag] = useState<HandBag | null>(null);
    const [loading, setLoading] = useState(false);

    // Destructure and memoize helpers
    const {
        updateFilter,
        pagination,
        filterValues: activeFilters,
        resetFilters
    } = useHandBagHelpers();

    const {
        listItems: listHandBags,
        getById: getHandBagById
    } = useHandBagQueries();

    const {
        createHandBagMutation,
        updateHandBagMutation,
        deleteHandBagMutation,
        onHandBagMutationSuccess
    } = useHandBagMutations();

    // Memoized and stable create handler
    const handleCreateHandBag = useCallback(async (data: Omit<HandBagCreateDTO, 'id'>) => {
        setLoading(true);
        try {
            await createHandBagMutation.mutateAsync(data);

            // Show success toast
            toast({
                title: 'Tạo túi xách thành công',
                description: `Túi xách "${data.name}" đã được tạo.`,
                duration: 2000,
            });

            // Refetch to get latest data
            const refetchResult = await listHandBags({
                page: 1,
                limit: 1,
                search: data.name
            }).refetch();

            const createdHandBag = refetchResult.data?.data?.[0];

            if (!createdHandBag) {
                throw new Error('Không tìm thấy túi xách vừa tạo');
            }

            // Invalidate cache
            onHandBagMutationSuccess(createdHandBag.id);

            return createdHandBag;
        } catch (error) {
            // Handle error
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            toast({
                title: 'Lỗi tạo túi xách',
                description: errorMessage,
                variant: 'destructive',
                duration: 3000,
            });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [createHandBagMutation, onHandBagMutationSuccess, listHandBags]);

    // Memoized and stable update handler
    const handleUpdateHandBag = useCallback(async (id: string, updateData: Omit<HandBagUpdateDTO, 'id'>) => {
        setLoading(true);
        try {
            await updateHandBagMutation.mutateAsync({
                id,
                data: updateData
            });

            // Show success toast
            toast({
                title: 'Cập nhật túi xách thành công',
                description: `Túi xách "${updateData.name}" đã được cập nhật.`,
                duration: 2000,
            });

            // Refetch to get latest data
            const refetchResult = await listHandBags({
                page: 1,
                limit: 1,
                search: updateData.name
            }).refetch();

            const updatedHandBag = refetchResult.data?.data?.[0];

            if (!updatedHandBag) {
                throw new Error('Không tìm thấy túi xách vừa cập nhật');
            }

            // Invalidate cache
            onHandBagMutationSuccess(id);

            return updatedHandBag;
        } catch (error) {
            // Handle error
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            toast({
                title: 'Lỗi cập nhật túi xách',
                description: errorMessage,
                variant: 'destructive',
                duration: 3000,
            });
            throw error;
        } finally {
            setLoading(false);
        }
    }, [updateHandBagMutation, onHandBagMutationSuccess, listHandBags]);

    // Stable pagination update method
    const updatePagination = useCallback((page: number, limit?: number) => {
        // Prevent unnecessary updates
        updateFilter('page' as keyof HandBagCondDTO, page);
        if (limit) {
            updateFilter('limit' as keyof HandBagCondDTO, limit);
        }
    }, [updateFilter]);

    // Stable reset error method
    const resetError = useCallback(() => {
        resetFilters();
    }, [resetFilters]);

    // Memoize the entire context value to prevent unnecessary re-renders
    const contextValue = useMemo<HandBagContextType>(() => ({
        listHandBags,
        deleteHandBagMutation,
        setSelectedHandBag,
        selectedHandBag,
        loading,
        activeFilters,
        handleCreateHandBag,
        handleUpdateHandBag,
        resetError,
        updatePagination,
    }), [
        listHandBags,
        deleteHandBagMutation,
        setSelectedHandBag,
        selectedHandBag,
        loading,
        activeFilters,
        handleCreateHandBag,
        handleUpdateHandBag,
        resetError,
        updatePagination
    ]);

    return (
        <HandBagContext.Provider value={contextValue}>
            {children}
        </HandBagContext.Provider>
    );
};

// Custom hook to use context with error checking
export const useHandBagContext = () => {
    const context = useContext(HandBagContext);
    if (context === undefined) {
        throw new Error('useHandBagContext must be used within a HandBagProvider');
    }
    return context;
};

export default HandBagContext;