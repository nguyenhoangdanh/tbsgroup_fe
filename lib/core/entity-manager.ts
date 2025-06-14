import { UseQueryResult, UseInfiniteQueryResult, UseMutationResult } from '@tanstack/react-query';
import { useMemo } from 'react';

// Base interfaces for standardization
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EntityQueries<T extends BaseEntity, P extends ListParams> {
  getById: (id?: string, options?: { enabled?: boolean }) => UseQueryResult<T, Error>;
  getList: (params?: P, options?: any) => UseQueryResult<ListResponse<T>, Error>;
  getInfinite: (limit?: number, filters?: Omit<P, 'page' | 'limit'>) => UseInfiniteQueryResult<ListResponse<T>, Error>;
  prefetchById: (id: string) => Promise<void>;
  prefetchList: (params?: P) => Promise<void>;
  invalidateCache: (forceRefetch?: boolean) => Promise<void>;
}

export interface EntityMutations<T extends BaseEntity, CreateData, UpdateData> {
  create: UseMutationResult<T, Error, CreateData, any>;
  update: UseMutationResult<void, Error, { id: string; data: UpdateData }, any>;
  delete: UseMutationResult<void, Error, string, any>;
  batchDelete?: UseMutationResult<void, Error, string[], any>;
}

export interface EntityHelpers<T extends BaseEntity, P extends ListParams, CreateData, UpdateData> {
  selectedEntity: T | null;
  setSelectedEntity: (entity: T | null) => void;
  loading: boolean;
  error: Error | null;
  resetError: () => void;
  filterValues: Omit<P, 'page' | 'limit' | 'sortBy' | 'sortOrder'>;
  activeFilters: P;
  pagination: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  updateFilter: (key: string, value: any) => void;
  resetFilters: () => void;
  updatePagination: (page: number, limit: number, sortBy?: string, sortOrder?: 'asc' | 'desc') => void;
  handleCreate: (data: CreateData) => Promise<T>;
  handleUpdate: (id: string, data: UpdateData) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
}

/**
 * Factory function to create standardized entity management hooks
 */
export function createEntityManager<
  T extends BaseEntity,
  P extends ListParams,
  CreateData,
  UpdateData
>(entityName: string) {
  const manager = {
    useQueries: (): EntityQueries<T, P> => {
      throw new Error(`${entityName}Queries hook not implemented`);
    },
    useMutations: (): EntityMutations<T, CreateData, UpdateData> => {
      throw new Error(`${entityName}Mutations hook not implemented`);
    },
    useHelpers: (): EntityHelpers<T, P, CreateData, UpdateData> => {
      throw new Error(`${entityName}Helpers hook not implemented`);
    },
    useEntity: () => {
      const queries = manager.useQueries();
      const mutations = manager.useMutations();
      const helpers = manager.useHelpers();

      return useMemo(() => ({
        ...queries,
        ...mutations,
        ...helpers,
        queries,
        mutations,
        helpers,
      }), [queries, mutations, helpers]);
    }
  };

  return manager;
}
