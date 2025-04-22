"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode, useRef } from "react";
import { RecordStatus, ShiftType, DigitalForm, DigitalFormEntry } from "@/common/types/digital-form";
import { DigitalFormCondition, PaginationParams, ApiResponse, ListApiResponse } from "@/services/form/digitalFormService";
import { TDigitalFormCreate, TDigitalFormUpdate, TDigitalFormSubmit, TDigitalFormEntry } from "@/schemas/digital-form.schema";
import { useDigitalForms } from "@/hooks/digital-form/useDigitalForms";
import { useDigitalFormComposite } from "@/hooks/digital-form/useDigitalFormComposite";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// Context Type Definition - Strong typing for better developer experience
interface DigitalFormContextType {
    // State
    selectedForm: DigitalForm | null;
    filters: DigitalFormCondition & PaginationParams;
    isSubmitting: boolean;
    isLoadingAny: boolean;

    // Form CRUD operations
    createForm: (data: TDigitalFormCreate) => Promise<ApiResponse<{ id: string }> | null>;
    updateForm: (id: string, data: TDigitalFormUpdate) => Promise<void>;
    deleteForm: (id: string) => Promise<void>;
    batchDeleteForms: (formIds: string[]) => Promise<{ count: number }>;
    viewForm: (id: string) => void;
    printForm: (id: string) => void;
    exportForms: (formIds: string[]) => Promise<void>;

    // Data management
    fetchFormData: (id: string, withEntries?: boolean) => Promise<{ form: DigitalForm; entries?: DigitalFormEntry[] } | null>;
    fetchForms: (newFilters?: Partial<DigitalFormCondition & PaginationParams>) => Promise<void>;

    // Entry operations
    addFormEntry: (formId: string, data: TDigitalFormEntry) => Promise<string>;
    deleteFormEntry: (formId: string, entryId: string) => Promise<void>;
    processBatchEntries: (formId: string, entries: TDigitalFormEntry[]) => Promise<{ success: number, errors: number, total: number }>;

    // Form workflow operations
    submitForm: (formId: string, data?: TDigitalFormSubmit) => Promise<void>;
    approveForm: (formId: string) => Promise<void>;
    rejectForm: (formId: string) => Promise<void>;

    // Filter operations
    updateFilter: <K extends keyof (DigitalFormCondition & PaginationParams) >(key: K, value: (DigitalFormCondition & PaginationParams)[K]) => void;
    resetFilters: () => void;
    updatePagination: (page: number, limit?: number) => void;
    syncFiltersToUrl: () => void;
    loadFiltersFromUrl: () => void;

    // Cache operations 
    refreshFormData: (formId: string) => Promise<void>;
    prefetchFormsData: (formIds: string[]) => Promise<void>;

    // Utility functions
    formatDateString: (date: Date | null) => string;
    parseFilterDate: (dateString: string | null) => Date | null;
    getStatusLabel: (status: RecordStatus) => string;
    getStatusColor: (status: RecordStatus) => string;
    getShiftLabel: (shiftType: ShiftType) => string;
    getFormTemplate: (lineId: string, date: string, shiftType: ShiftType) => TDigitalFormCreate;
}

// Default filter values
const defaultFilters: DigitalFormCondition & PaginationParams = {
    search: "",
    dateFrom: null,
    dateTo: null,
    status: undefined,
    shiftType: undefined,
    lineId: undefined,
    createdById: undefined,
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc"
};

// Status display mappings
const STATUS_LABELS: Record<RecordStatus, string> = {
    [RecordStatus.DRAFT]: "Nháp",
    [RecordStatus.PENDING]: "Chờ duyệt",
    [RecordStatus.CONFIRMED]: "Đã duyệt",
    [RecordStatus.REJECTED]: "Bị từ chối",
};

const STATUS_COLORS: Record<RecordStatus, string> = {
    [RecordStatus.DRAFT]: "blue",
    [RecordStatus.PENDING]: "orange",
    [RecordStatus.CONFIRMED]: "green",
    [RecordStatus.REJECTED]: "red",
};

const SHIFT_LABELS: Record<ShiftType, string> = {
    [ShiftType.REGULAR]: "Ca Chính (7h30-16h30)",
    [ShiftType.EXTENDED]: "Ca Kéo Dài (16h30-18h)",
    [ShiftType.OVERTIME]: "Ca Tăng Ca (18h-20h)",
};

// Create the context with undefined default to enforce Provider usage
const DigitalFormContext = createContext<DigitalFormContextType | undefined>(undefined);

// Provider Props
interface DigitalFormProviderProps {
    children: ReactNode;
    initialFilters?: Partial<DigitalFormCondition & PaginationParams>;
    syncUrlFilters?: boolean;
}

/**
 * DigitalForm Provider Component
 * Centralizes digital form management logic and state
 * Optimized for performance with 5000+ users
 */
export const DigitalFormProvider: React.FC<DigitalFormProviderProps> = ({
    children,
    initialFilters = {},
    syncUrlFilters = true
}) => {
    // Get Next.js router for URL manipulation
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get the hooks
    const digitalForms = useDigitalForms();
    const composite = useDigitalFormComposite();

    // State
    const [selectedForm, setSelectedForm] = useState<DigitalForm | null>(null);
    const [filters, setFilters] = useState<DigitalFormCondition & PaginationParams>({
        ...defaultFilters,
        ...initialFilters
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs for timers to properly clean them up
    const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            // Clear all timeouts when component unmounts
            Object.values(timeoutRefs.current).forEach(clearTimeout);
        };
    }, []);

    // Helper to set timeouts that can be cleaned up
    const setTimeoutWithCleanup = useCallback((callback: () => void, delay: number, key: string) => {
        // Clear existing timeout with the same key if it exists
        if (timeoutRefs.current[key]) {
            clearTimeout(timeoutRefs.current[key]);
        }

        // Set new timeout and store its reference
        timeoutRefs.current[key] = setTimeout(() => {
            callback();
            // Remove the reference once executed
            delete timeoutRefs.current[key];
        }, delay);
    }, []);

    // Derived state
    const isLoadingAny = useMemo(() =>
        isSubmitting || digitalForms.isLoading() || digitalForms.hasPendingMutations(),
        [isSubmitting, digitalForms]
    );

    // Utility functions

    /**
     * Format date string helper
     */
    const formatDateString = useCallback((date: Date | null): string => {
        if (!date) return "";
        return date.toISOString().split("T")[0]; // YYYY-MM-DD format
    }, []);

    /**
     * Parse date from filter string
     */
    const parseFilterDate = useCallback((dateString: string | null): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }, []);

    /**
     * Get form template
     */
    const getFormTemplate = useCallback((lineId: string, date: string, shiftType: ShiftType): TDigitalFormCreate => {
        return {
            lineId,
            date,
            shiftType,
            formName: `Phiếu công đoạn - ${date} - ${getShiftLabel(shiftType)}`,
            description: '',
        };
    }, []);

    // Filter operations

    /**
     * Update a single filter
     */
    const updateFilter = useCallback(<K extends keyof (DigitalFormCondition & PaginationParams)>(
        key: K,
        value: (DigitalFormCondition & PaginationParams)[K]
    ) => {
        setFilters(prev => {
            // Reset to first page when filter changes (except when the page itself is being updated)
            const newFilters = { ...prev, [key]: value };
            if (key !== "page") {
                newFilters.page = 1;
            }

            return newFilters;
        });

        // If URL sync is enabled, update after a short delay to avoid too many history entries
        if (syncUrlFilters) {
            setTimeoutWithCleanup(() => syncFiltersToUrl(), 300, 'syncFilters');
        }
    }, [syncUrlFilters, setTimeoutWithCleanup]);

    /**
     * Reset filters to default values
     */
    const resetFilters = useCallback(() => {
        setFilters(defaultFilters);

        // If URL sync is enabled, update immediately
        if (syncUrlFilters) {
            setTimeoutWithCleanup(() => syncFiltersToUrl(), 100, 'resetFilters');
        }
    }, [syncUrlFilters, setTimeoutWithCleanup]);

    /**
     * Update pagination parameters
     */
    const updatePagination = useCallback((page: number, limit?: number) => {
        setFilters(prev => ({
            ...prev,
            page,
            limit: limit || prev.limit
        }));

        // If URL sync is enabled, update after a short delay
        if (syncUrlFilters) {
            setTimeoutWithCleanup(() => syncFiltersToUrl(), 100, 'updatePagination');
        }
    }, [syncUrlFilters, setTimeoutWithCleanup]);

    /**
     * Synchronize filters to URL query parameters
     */
    const syncFiltersToUrl = useCallback(() => {
        if (!syncUrlFilters || !pathname) return;

        try {
            const params = new URLSearchParams();

            // Add only non-default and non-empty values to URL
            Object.entries(filters).forEach(([key, value]) => {
                // Skip null, undefined, empty string values
                if (value !== null && value !== undefined && value !== '') {
                    // Handle date objects
                    if (value instanceof Date) {
                        params.set(key, formatDateString(value));
                    } else {
                        params.set(key, String(value));
                    }
                }
            });

            // Update URL with new query parameters
            const newUrl = `${pathname}?${params.toString()}`;
            router.replace(newUrl);
        } catch (error) {
            console.warn('Failed to sync filters to URL:', error);
        }
    }, [filters, pathname, router, formatDateString, syncUrlFilters]);

    /**
  * Load filters from URL query parameters
  */
    const loadFiltersFromUrl = useCallback(() => {
        if (!syncUrlFilters || !searchParams) return;

        try {
            const newFilters = { ...defaultFilters };

            // Sử dụng forEach thay vì for...of để tránh lỗi với URLSearchParamsIterator
            searchParams.forEach((value, key) => {
                if (key in defaultFilters) {
                    // Convert numeric values
                    if (['page', 'limit'].includes(key)) {
                        (newFilters as any)[key] = parseInt(value, 10) || defaultFilters[key as keyof typeof defaultFilters];
                    }
                    // Handle dates
                    else if (['dateFrom', 'dateTo'].includes(key)) {
                        const dateValue = parseFilterDate(value);
                        if (key === 'dateFrom') {
                            newFilters.dateFrom = dateValue;
                        } else {
                            newFilters.dateTo = dateValue;
                        }
                    }
                    // Handle enum values
                    else if (key === 'status' && Object.values(RecordStatus).includes(value as RecordStatus)) {
                        newFilters.status = value as RecordStatus;
                    }
                    else if (key === 'shiftType' && Object.values(ShiftType).includes(value as ShiftType)) {
                        newFilters.shiftType = value as ShiftType;
                    }
                    // Handle sort order
                    else if (key === 'sortOrder' && ['asc', 'desc'].includes(value)) {
                        newFilters.sortOrder = value as 'asc' | 'desc';
                    }
                    // Handle all other string values
                    else {
                        (newFilters as any)[key] = value;
                    }
                }
            });

            setFilters(newFilters);
        } catch (error) {
            console.warn('Failed to load filters from URL:', error);
        }
    }, [searchParams, syncUrlFilters, parseFilterDate]);

    // Load filters from URL on mount
    useEffect(() => {
        if (syncUrlFilters) {
            loadFiltersFromUrl();
        }
    }, [loadFiltersFromUrl, syncUrlFilters]);

    // Form CRUD operations

    /**
     * Create a new form
     */
    const createForm = useCallback(async (data: TDigitalFormCreate): Promise<ApiResponse<{ id: string }> | null> => {
        setIsSubmitting(true);
        try {
            const result = await digitalForms.createForm(data);
            setIsSubmitting(false);
            return result;
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms]);

    /**
     * Update an existing form
     */
    const updateForm = useCallback(async (id: string, data: TDigitalFormUpdate): Promise<void> => {
        setIsSubmitting(true);
        try {
            await digitalForms.updateForm(id, data);
            setIsSubmitting(false);
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms]);

    /**
     * Delete a form
     */
    const deleteForm = useCallback(async (id: string): Promise<void> => {
        setIsSubmitting(true);
        try {
            await digitalForms.deleteForm(id);

            // If the deleted form was selected, clear selection
            if (selectedForm?.id === id) {
                setSelectedForm(null);
            }

            setIsSubmitting(false);
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms, selectedForm]);

    /**
     * Batch delete multiple forms
     */
    const batchDeleteForms = useCallback(async (formIds: string[]): Promise<{ count: number }> => {
        if (!formIds.length) return { count: 0 };

        setIsSubmitting(true);
        try {
            const result = await digitalForms.batchDeleteForms(formIds);

            // Clear selected form if it was deleted
            if (selectedForm && formIds.includes(selectedForm.id)) {
                setSelectedForm(null);
            }

            setIsSubmitting(false);
            return { count: result.data?.count || 0 };
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms, selectedForm]);

    /**
     * Export forms to Excel
     */
    const exportForms = useCallback(async (formIds: string[]): Promise<void> => {
        if (!formIds.length) return;

        setIsSubmitting(true);
        try {
            await digitalForms.exportFormsToExcel(formIds);
            setIsSubmitting(false);
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms]);

    // View and print form (navigation functions)

    /**
     * Navigate to form detail view
     */
    const viewForm = useCallback((id: string): void => {
        if (typeof window !== "undefined") {
            router.push(`/digital-forms/${id}`);
        }
    }, [router]);

    /**
     * Open form print view
     */
    const printForm = useCallback((id: string): void => {
        if (typeof window !== "undefined") {
            window.open(`/digital-forms/${id}/print`, "_blank");
        }
    }, []);

    // Data fetching operations

    /**
     * Fetch a single form with or without entries
     */
    const fetchFormData = useCallback(async (
        id: string,
        withEntries: boolean = false
    ): Promise<{ form: DigitalForm; entries?: DigitalFormEntry[] } | null> => {
        if (!id) return null;

        try {
            if (withEntries) {
                const result = digitalForms.getFormWithEntries(id);
                await result.refetch();
                if (result.data?.data) {
                    return result.data.data;
                }
            } else {
                const result = digitalForms.getForm(id);
                await result.refetch();
                if (result.data?.data) {
                    return { form: result.data.data };
                }
            }
            return null;
        } catch (error) {
            console.error(`Error fetching form data for ID ${id}:`, error);
            throw error;
        }
    }, [digitalForms]);

    /**
 * Fetch forms with current or updated filters
 */
    const fetchForms = useCallback(async (newFilters?: Partial<DigitalFormCondition & PaginationParams>): Promise<void> => {
        try {
            // If new filters are provided, update the filters state first
            if (newFilters) {
                const updatedFilters = {
                    ...filters,
                    ...newFilters,
                    // Reset to page 1 if any non-pagination filter changes
                    page: Object.keys(newFilters).some(key => key !== 'page' && key !== 'limit') ? 1 : (newFilters.page || filters.page)
                };

                // Update filters
                setFilters(updatedFilters);

                // Sync to URL if enabled
                if (syncUrlFilters) {
                    setTimeoutWithCleanup(() => syncFiltersToUrl(), 100, 'fetchForms');
                }

                digitalForms.listForms(updatedFilters);
            } else {
                digitalForms.listForms(filters);
            }
        } catch (error) {
            console.error('Error fetching forms:', error);
            throw error;
        }
    }, [digitalForms, filters, syncUrlFilters, syncFiltersToUrl, setTimeoutWithCleanup]);
    // Form entry operations

    /**
     * Add an entry to a form
     */
    const addFormEntry = useCallback(async (formId: string, data: TDigitalFormEntry): Promise<string> => {
        setIsSubmitting(true);
        try {
            const result = await digitalForms.addFormEntry(formId, data);
            setIsSubmitting(false);
            return result.data?.id || '';
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms]);

    /**
     * Delete an entry from a form
     */
    const deleteFormEntry = useCallback(async (formId: string, entryId: string): Promise<void> => {
        setIsSubmitting(true);
        try {
            await digitalForms.deleteFormEntry(formId, entryId);
            setIsSubmitting(false);
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms]);

    /**
     * Process batch entries with error handling
     */
    const processBatchEntries = useCallback(async (
        formId: string,
        entries: TDigitalFormEntry[]
    ): Promise<{ success: number, errors: number, total: number }> => {
        if (!formId || !entries.length) return { success: 0, errors: 0, total: 0 };

        setIsSubmitting(true);
        try {
            const result = await composite.processBatchEntries(formId, entries);
            setIsSubmitting(false);
            return result;
        } catch (error) {
            setIsSubmitting(false);
            console.error('Error processing batch entries:', error);
            return { success: 0, errors: entries.length, total: entries.length };
        }
    }, [composite]);

    // Form workflow operations

    /**
     * Submit form for approval
     */
    const submitForm = useCallback(async (formId: string, data: TDigitalFormSubmit = {}): Promise<void> => {
        setIsSubmitting(true);
        try {
            await digitalForms.submitForm(formId, data);
            setIsSubmitting(false);
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms]);

    /**
     * Approve a form
     */
    const approveForm = useCallback(async (formId: string): Promise<void> => {
        setIsSubmitting(true);
        try {
            await digitalForms.approveForm(formId);
            setIsSubmitting(false);
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms]);

    /**
     * Reject a form
     */
    const rejectForm = useCallback(async (formId: string): Promise<void> => {
        setIsSubmitting(true);
        try {
            await digitalForms.rejectForm(formId);
            setIsSubmitting(false);
        } catch (error) {
            setIsSubmitting(false);
            throw error;
        }
    }, [digitalForms]);

    // Cache operations

    /**
     * Refresh form data
     */
    const refreshFormData = useCallback(async (formId: string): Promise<void> => {
        if (!formId) return;

        try {
            // Invalidate and refetch detailed data for the form
            await digitalForms.invalidateFormWithEntries(formId, true);
            await digitalForms.invalidateFormData(formId, true);
        } catch (error) {
            console.error("Error refreshing form data:", error);
        }
    }, [digitalForms]);

    /**
     * Prefetch multiple forms' data
     */
    const prefetchFormsData = useCallback(async (formIds: string[]): Promise<void> => {
        if (!formIds.length) return;

        try {
            await digitalForms.batchPrefetchForms(formIds);
        } catch (error) {
            console.warn('Failed to prefetch forms data:', error);
        }
    }, [digitalForms]);

    // Status and shift helpers

    /**
     * Get label for status
     */
    const getStatusLabel = useCallback((status: RecordStatus): string => {
        return STATUS_LABELS[status] || status;
    }, []);

    /**
     * Get color for status
     */
    const getStatusColor = useCallback((status: RecordStatus): string => {
        return STATUS_COLORS[status] || "gray";
    }, []);

    /**
     * Get label for shift type
     */
    const getShiftLabel = useCallback((shiftType: ShiftType): string => {
        return SHIFT_LABELS[shiftType] || shiftType;
    }, []);

    // Create the context value
    const contextValue: DigitalFormContextType = {
        // State
        selectedForm,
        filters,
        isSubmitting,
        isLoadingAny,

        // Form CRUD
        createForm,
        updateForm,
        deleteForm,
        batchDeleteForms,
        viewForm,
        printForm,
        exportForms,

        // Data management
        fetchFormData,
        fetchForms,

        // Entries
        addFormEntry,
        deleteFormEntry,
        processBatchEntries,

        // Workflow
        submitForm,
        approveForm,
        rejectForm,

        // Filters
        updateFilter,
        resetFilters,
        updatePagination,
        syncFiltersToUrl,
        loadFiltersFromUrl,

        // Cache
        refreshFormData,
        prefetchFormsData,

        // Utility
        formatDateString,
        parseFilterDate,
        getStatusLabel,
        getStatusColor,
        getShiftLabel,
        getFormTemplate
    };

    return (
        <DigitalFormContext.Provider value={contextValue}>
            {children}
        </DigitalFormContext.Provider>
    );
};

/**
 * Hook to use Digital Form Context
 * Ensures it's only called within child components of DigitalFormProvider
 */
export const useDigitalFormContext = (): DigitalFormContextType => {
    const context = useContext(DigitalFormContext);

    if (context === undefined) {
        throw new Error("useDigitalFormContext must be used within a DigitalFormProvider");
    }

    return context;
};

export default DigitalFormContext;