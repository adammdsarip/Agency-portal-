"use client";

import { Search, X } from "lucide-react";
import { FilterChips } from "@/components/ui/FilterChips";
import { Select } from "@/components/ui/Field";
import {
  CATEGORY_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type CategoryFilter,
  type StatusFilter,
} from "../filters";

export interface FilterState {
  search: string;
  category: CategoryFilter;
  status: StatusFilter;
}

export const INITIAL_FILTERS: FilterState = { search: "", category: "all", status: "all" };

export function DeliverableFilters({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" aria-hidden />
          <input
            type="search"
            aria-label="Search deliverables"
            placeholder="Search deliverables"
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            className="h-11 w-full rounded-xl border border-line bg-surface pr-10 pl-10 text-[15px] placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-ink/5 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {value.search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onChange({ ...value, search: "" })}
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-subtle"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select
          aria-label="Filter by status"
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value as StatusFilter })}
          className="w-auto min-w-[8.5rem] shrink-0"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <FilterChips
        label="Filter by category"
        options={CATEGORY_FILTER_OPTIONS}
        value={value.category}
        onChange={(category) => onChange({ ...value, category })}
      />
    </div>
  );
}
