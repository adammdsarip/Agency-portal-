"use client";

import { Layers, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";
import { Alert, EmptyState, friendlyError } from "@/components/ui/feedback";
import { useCurrentClient } from "@/features/clients/hooks";
import { DeliverableCard } from "@/features/deliverables/components/DeliverableCard";
import { DeliverableDetailSheet } from "@/features/deliverables/components/DeliverableDetailSheet";
import {
  DeliverableFilters,
  INITIAL_FILTERS,
  type FilterState,
} from "@/features/deliverables/components/DeliverableFilters";
import { filterDeliverables } from "@/features/deliverables/filters";
import { useClientDeliverables } from "@/features/deliverables/hooks";

export default function ClientDeliverablesPage() {
  const { clientId } = useCurrentClient();
  const { data, loading, error } = useClientDeliverables(clientId);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => filterDeliverables(data, filters), [data, filters]);
  // Look up by id so the open sheet stays in sync with live updates.
  const open = data.find((d) => d.id === openId) ?? null;

  return (
    <div>
      <PageHeader
        title="Deliverables"
        description={loading ? "Loading…" : `${data.length} ${data.length === 1 ? "item" : "items"} shared with you`}
      />

      <DeliverableFilters value={filters} onChange={setFilters} />

      <div className="mt-5">
        {error ? (
          <Alert>{friendlyError(error)}</Alert>
        ) : loading ? (
          <CardGridSkeleton />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No deliverables yet"
            description="When our team shares designs, videos, photos or files with you, they'll appear here."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matches"
            description="Try a different search or filter."
            action={
              <Button variant="secondary" size="sm" onClick={() => setFilters(INITIAL_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((d) => (
              <li key={d.id}>
                <DeliverableCard deliverable={d} onOpen={() => setOpenId(d.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <DeliverableDetailSheet deliverable={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line/70 bg-surface">
          <div className="aspect-[16/10] animate-pulse bg-subtle" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-subtle" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}
