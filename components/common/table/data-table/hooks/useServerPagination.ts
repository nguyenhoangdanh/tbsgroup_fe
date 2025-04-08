
// file: components/common/table/data-table/hooks/useServerPagination.ts
import { useRef, useState, useEffect, useCallback } from 'react';

export function useServerPagination({
  initialPageIndex = 0,
  initialPageSize = 10,
  serverSidePagination = false,
  onPageChange,
  serverPageSize = 20
}: {
  initialPageIndex?: number;
  initialPageSize?: number;
  serverSidePagination?: boolean;
  onPageChange?: (pageIndex: number, pageSize: number) => void;
  serverPageSize?: number;
}) {
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [isDataFetching, setIsDataFetching] = useState(false);
  
  const isFirstRender = useRef(true);
  const isPaginationChange = useRef(false);

  // Calculate which server page we need based on client page
  const getServerPageForClientPage = useCallback((clientPageIndex: number, clientPageSize: number) => {
    if (!serverSidePagination) return 0;

    const firstItemIndex = clientPageIndex * clientPageSize;
    const serverPageIndex = Math.floor(firstItemIndex / serverPageSize);

    return serverPageIndex;
  }, [serverPageSize, serverSidePagination]);

  // Effect for pagination changes
  useEffect(() => {
    if (!serverSidePagination || !onPageChange) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      const initialServerPage = getServerPageForClientPage(initialPageIndex, initialPageSize);
      onPageChange(initialServerPage, serverPageSize);
      return;
    }

    const serverPageIndex = getServerPageForClientPage(pageIndex, pageSize);

    // Only set fetching state, don't trigger full page loader
    setIsDataFetching(true);

    // Call API with server pagination params
    onPageChange(serverPageIndex, serverPageSize);

    // Safety timeout to reset loading state
    const timeoutId = setTimeout(() => {
      setIsDataFetching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    pageIndex,
    pageSize,
    serverSidePagination,
    onPageChange,
    serverPageSize,
    getServerPageForClientPage,
    initialPageIndex,
    initialPageSize
  ]);

  // Reset data fetching state when data changes
  const resetDataFetching = useCallback(() => {
    isPaginationChange.current = false;
    setIsDataFetching(false);
  }, []);

  return {
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    isDataFetching,
    isPaginationChange,
    resetDataFetching
  };
}