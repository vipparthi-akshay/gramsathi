import { useState, useCallback } from 'react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function usePagination(initialLimit: number = 10) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setPagination((prev) => ({
      ...prev,
      total,
      totalPages: Math.ceil(total / prev.limit),
    }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.page >= prev.totalPages) return prev;
      return { ...prev, page: prev.page + 1 };
    });
  }, []);

  const prevPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.page <= 1) return prev;
      return { ...prev, page: prev.page - 1 };
    });
  }, []);

  const reset = useCallback(() => {
    setPagination({ page: 1, limit: initialLimit, total: 0, totalPages: 0 });
  }, [initialLimit]);

  return {
    ...pagination,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    reset,
  };
}
