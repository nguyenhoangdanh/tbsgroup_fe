import React, { createContext, useContext, ReactNode } from 'react';
import { Line, LineCondDTO, LineCreateDTO, LineUpdateDTO, LineManagerDTO } from '@/common/interface/line';
import { BasePaginationParams } from '@/hooks/base/useBaseQueries';
import { getLineById } from '@/apis/line/line.api';
import { useQuery } from '@tanstack/react-query';
import { useLineQueries } from './useLineQueries';
import { useLineMutations } from './useLineMutations';

// Định nghĩa kiểu dữ liệu cho context
interface LineContextType {
    // Queries
    line: {
        get: (id: string) => ReturnType<typeof useQuery>;
        getWithDetails: ReturnType<typeof useLineQueries>['getLineWithDetails'];
        getByFactory: ReturnType<typeof useLineQueries>['getLinesByFactoryId'];
        getManagers: ReturnType<typeof useLineQueries>['getManagersByLineId'];
        getAccessible: ReturnType<typeof useLineQueries>['getAccessibleLinesForUser'];
        canManage: ReturnType<typeof useLineQueries>['canManageLine'];
        list: (params?: LineCondDTO & BasePaginationParams) => ReturnType<ReturnType<typeof useLineQueries>['listLines']>;
    };

    // Mutations
    mutations: {
        create: (data: LineCreateDTO) => Promise<{ id: string }>;
        update: (data: LineUpdateDTO & { id: string }) => Promise<void>;
        delete: (id: string) => Promise<void>;
        batchDelete: (ids: string[]) => Promise<void>;
        addManager: (lineId: string, managerDTO: LineManagerDTO) => Promise<void>;
        updateManager: (lineId: string, userId: string, data: { isPrimary?: boolean; endDate?: Date | null }) => Promise<void>;
        removeManager: (lineId: string, userId: string) => Promise<void>;
    };

    // Cache operations
    cache: {
        invalidateDetails: ReturnType<typeof useLineQueries>['invalidateLineDetailsCache'];
        invalidateManagers: ReturnType<typeof useLineQueries>['invalidateManagersCache'];
        prefetchDetails: ReturnType<typeof useLineQueries>['prefetchLineDetails'];
        prefetchManagers: ReturnType<typeof useLineQueries>['prefetchLineManagers'];
        prefetchList: ReturnType<typeof useLineQueries>['prefetchLineList'];
        updateCache: ReturnType<typeof useLineQueries>['updateLineCache'];
        batchPrefetch: ReturnType<typeof useLineQueries>['batchPrefetchLines'];
    };

    // States
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

// Tạo context với giá trị ban đầu null
const LineContext = createContext<LineContextType | null>(null);

// Props cho LineProvider
interface LineProviderProps {
    children: ReactNode;
}

/**
 * Provider cho context quản lý dây chuyền
 */
export const LineProvider: React.FC<LineProviderProps> = ({ children }) => {
    // Sử dụng hooks
    const queries = useLineQueries();
    const mutations = useLineMutations();

    // Tạo hàm lấy thông tin dây chuyền theo ID
    const getLineByIdQuery = (id: string) => {
        return useQuery({
            queryKey: ['line', id],
            queryFn: () => getLineById(id),
            enabled: !!id
        });
    };

    // Giá trị cho context
    const contextValue: LineContextType = {
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
    };

    return (
        <LineContext.Provider value={contextValue}>
            {children}
        </LineContext.Provider>
    );
};

/**
 * Hook để sử dụng LineContext
 */
export const useLine = () => {
    const context = useContext(LineContext);

    if (!context) {
        throw new Error('useLine must be used within a LineProvider');
    }

    return context;
};

/**
 * Custom hook để sử dụng thông tin một dây chuyền
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
 * Custom hook để sử dụng chi tiết dây chuyền
 */
export const useLineDetails = (lineId?: string, includeManagers = true) => {
    const { line } = useLine();
    const { data, isLoading, error } = line.getWithDetails(lineId, { includeManagers });

    return {
        lineDetails: data,
        isLoading,
        error
    };
};