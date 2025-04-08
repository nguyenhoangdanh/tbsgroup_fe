import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Line, LineCondDTO, LineCreateDTO, LineUpdateDTO, LineManagerDTO } from '@/common/interface/line';
import { BasePaginationParams } from '@/hooks/base/useBaseQueries';
import { useQuery } from '@tanstack/react-query';
import { useLineQueries } from './useLineQueries';
import { useLineMutations } from './useLineMutations';
import { getLineById } from '@/apis/line/line.api';

// Define context type with better organization
interface LineContextType {
    // Queries with better naming
    line: {
        get: (id: string) => ReturnType<typeof useQuery>;
        getWithDetails: ReturnType<typeof useLineQueries>['getLineWithDetails'];
        getByFactory: ReturnType<typeof useLineQueries>['getLinesByFactoryId'];
        getManagers: ReturnType<typeof useLineQueries>['getManagersByLineId'];
        getAccessible: ReturnType<typeof useLineQueries>['getAccessibleLinesForUser'];
        canManage: ReturnType<typeof useLineQueries>['canManageLine'];
        list: (params?: LineCondDTO & BasePaginationParams) => ReturnType<ReturnType<typeof useLineQueries>['listLines']>;
    };

    // Mutations with simplified interface
    mutations: {
        create: (data: LineCreateDTO) => Promise<{ id: string }>;
        update: (data: LineUpdateDTO & { id: string }) => Promise<void>;
        delete: (id: string) => Promise<void>;
        batchDelete: (ids: string[]) => Promise<void>;
        addManager: (lineId: string, managerDTO: LineManagerDTO) => Promise<void>;
        updateManager: (lineId: string, userId: string, data: { isPrimary?: boolean; endDate?: Date | null }) => Promise<void>;
        removeManager: (lineId: string, userId: string) => Promise<void>;
    };

    // Simplified cache operations
    cache: {
        invalidateDetails: (lineId: string, options?: { forceRefetch?: boolean }) => Promise<void>;
        invalidateManagers: (lineId: string, forceRefetch?: boolean) => Promise<void>;
        prefetchDetails: (lineId: string, options?: { includeManagers?: boolean }) => Promise<void>;
        prefetchManagers: (lineId: string) => Promise<void>;
        prefetchList: (params?: LineCondDTO & BasePaginationParams) => Promise<void>;
        updateCache: (lineId: string, updatedData: Partial<Line>) => void;
        batchPrefetch: (lineIds: string[], includeManagers?: boolean) => Promise<void>;
        prefetchByFactory: (factoryId: string, options?: { staleTime?: number }) => Promise<void>;
    };

    // Loading states
    isLoading: {
        create: boolean;
        update: boolean;
        delete: boolean;
        batchDelete: boolean;
        addManager: boolean;
        updateManager: boolean;
        removeManager: boolean;
    };
}

// Create context with null as initial value
const LineContext = createContext<LineContextType | null>(null);

// Props for LineProvider
interface LineProviderProps {
    children: ReactNode;
}

/**
 * Provider for line management context with optimized architecture
 */
export const LineProvider: React.FC<LineProviderProps> = ({ children }) => {
    // Use query and mutation hooks
    const queries = useLineQueries();
    const mutations = useLineMutations();

    // Create a function to get line by ID
    const getLineByIdQuery = (id: string) => {
        return useQuery({
            queryKey: ['line', id],
            queryFn: () => getLineById(id),
            enabled: !!id,
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
        });
    };

    // Create memoized context value to prevent unnecessary re-renders
    const contextValue = useMemo<LineContextType>(() => ({
        line: {
            get: getLineByIdQuery,
            getWithDetails: queries.getLineWithDetails,
            getByFactory: queries.getLinesByFactoryId,
            getManagers: queries.getManagersByLineId,
            getAccessible: queries.getAccessibleLinesForUser,
            canManage: queries.canManageLine,
            list: (params) => queries.listLines(params),
        },

        mutations: {
            create: (data: LineCreateDTO) => mutations.createLineMutation.mutateAsync(data),
            update: (data: LineUpdateDTO & { id: string }) => mutations.updateLineMutation.mutateAsync(data),
            delete: (id: string) => mutations.deleteLineMutation.mutateAsync(id),
            batchDelete: (ids: string[]) => mutations.batchDeleteLinesMutation.mutateAsync(ids),
            addManager: (lineId: string, managerDTO: LineManagerDTO) =>
                mutations.addManagerMutation.mutateAsync({ lineId, managerDTO }),
            updateManager: (lineId: string, userId: string, data) =>
                mutations.updateManagerMutation.mutateAsync({ lineId, userId, data }),
            removeManager: (lineId: string, userId: string) =>
                mutations.removeManagerMutation.mutateAsync({ lineId, userId }),
        },

        cache: {
            invalidateDetails: queries.invalidateLineDetailsCache,
            invalidateManagers: queries.invalidateManagersCache,
            prefetchDetails: queries.prefetchLineDetails,
            prefetchManagers: queries.prefetchLineManagers,
            prefetchList: queries.prefetchLineList,
            updateCache: queries.updateLineCache,
            batchPrefetch: queries.batchPrefetchLines,
            prefetchByFactory: queries.prefetchLinesByFactory,
        },

        isLoading: {
            create: mutations.createLineMutation.isPending,
            update: mutations.updateLineMutation.isPending,
            delete: mutations.deleteLineMutation.isPending,
            batchDelete: mutations.batchDeleteLinesMutation.isPending,
            addManager: mutations.addManagerMutation.isPending,
            updateManager: mutations.updateManagerMutation.isPending,
            removeManager: mutations.removeManagerMutation.isPending,
        },
    }), [
        queries,
        mutations,
    ]);

    return (
        <LineContext.Provider value={contextValue}>
            {children}
        </LineContext.Provider>
    );
};

/**
 * Hook to use LineContext with proper error handling
 */
export const useLine = () => {
    const context = useContext(LineContext);

    if (!context) {
        throw new Error('useLine must be used within a LineProvider');
    }

    return context;
};

/**
 * Custom hook to access a specific line's data
 */
export const useLineData = (lineId?: string) => {
    const { line } = useLine();
    const { data, isLoading, error } = line.get(lineId || '');

    return {
        line: data,
        isLoading,
        error
    };
};

/**
 * Custom hook to access detailed line data with options
 */
export const useLineDetails = (lineId?: string, includeManagers = true) => {
    const { line } = useLine();
    const { data, isLoading, error } = line.getWithDetails(lineId, {
        includeManagers,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        lineDetails: data,
        isLoading,
        error
    };
};

/**
 * Custom hook to access factory lines data
 */
export const useFactoryLines = (factoryId?: string) => {
    const { line } = useLine();
    const {
        data,
        isLoading,
        error,
        refetch
    } = line.getByFactory(factoryId, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false
    });

    return {
        lines: data || [],
        isLoading,
        error,
        refetch
    };
};