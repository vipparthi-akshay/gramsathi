import { useState, useCallback } from "react";

export interface FilterState {
  search: string;
  status: string;
  category: string;
  department: string;
  state: string;
  district: string;
  dateFrom: string;
  dateTo: string;
  [key: string]: string;
}

const defaultFilters: FilterState = {
  search: "",
  status: "",
  category: "",
  department: "",
  state: "",
  district: "",
  dateFrom: "",
  dateTo: "",
};

export function useFilters(initial?: Partial<FilterState>) {
  const [filters, setFiltersState] = useState<FilterState>({
    ...defaultFilters,
    ...initial,
  } as FilterState);

  const setFilter = useCallback((key: string, value: string) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setMultipleFilters = useCallback((partial: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }) as FilterState);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return {
    filters,
    setFilter,
    setMultipleFilters,
    clearFilters,
    hasActiveFilters,
  };
}
