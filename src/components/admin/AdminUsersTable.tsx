'use client';

import { useDeferredValue, useState, useTransition } from "react";

import { Badge } from "@/components/ui/Badge";
import type { Membership, User } from "@/lib/types";

type SortKey = "name" | "phone" | "membership" | "uplinePlatinum" | "status";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "active" | "inactive";

const membershipRank: Record<Membership, number> = {
  general: 0,
  silver: 1,
  platinum: 2,
};

const sortLabels: Record<SortKey, string> = {
  name: "Name",
  phone: "Phone",
  membership: "Membership",
  uplinePlatinum: "Upline",
  status: "Status",
};

const sortOptions: Array<{ key: SortKey; direction: SortDirection; label: string }> = [
  { key: "name", direction: "asc", label: "Name (A-Z)" },
  { key: "name", direction: "desc", label: "Name (Z-A)" },
  { key: "phone", direction: "asc", label: "Phone (Low-High)" },
  { key: "phone", direction: "desc", label: "Phone (High-Low)" },
  { key: "membership", direction: "asc", label: "Membership (General-Platinum)" },
  { key: "membership", direction: "desc", label: "Membership (Platinum-General)" },
  { key: "uplinePlatinum", direction: "asc", label: "Upline (A-Z)" },
  { key: "uplinePlatinum", direction: "desc", label: "Upline (Z-A)" },
  { key: "status", direction: "asc", label: "Status (Active first)" },
  { key: "status", direction: "desc", label: "Status (Inactive first)" },
];

export function AdminUsersTable({ items }: { items: User[] }) {
  const [query, setQuery] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<Membership | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const filteredItems = items
    .filter((item) => {
      if (!normalizedQuery) return true;
      const searchable = [item.name, item.phone, item.membership, item.uplinePlatinum ?? ""]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    })
    .filter((item) => membershipFilter === "all" || item.membership === membershipFilter)
    .filter((item) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return item.active !== false;
      return item.active === false;
    })
    .sort((left, right) => compareUsers(left, right, sortKey, sortDirection));

  const activeSortValue = `${sortKey}:${sortDirection}`;
  const hasFilters = Boolean(normalizedQuery) || membershipFilter !== "all" || statusFilter !== "active";

  return (
    <>
      <div className="toolbar toolbar-users">
        <input
          value={query}
          onChange={(event) => startTransition(() => setQuery(event.target.value))}
          placeholder="Search name, phone, membership, upline"
          aria-label="Search users"
        />
        <select
          value={membershipFilter}
          onChange={(event) => startTransition(() => setMembershipFilter(event.target.value as Membership | "all"))}
          aria-label="Filter by membership"
        >
          <option value="all">All memberships</option>
          <option value="general">General</option>
          <option value="silver">Silver</option>
          <option value="platinum">Platinum</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) => startTransition(() => setStatusFilter(event.target.value as StatusFilter))}
          aria-label="Filter by status"
        >
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
          <option value="all">All status</option>
        </select>
        <select
          value={activeSortValue}
          onChange={(event) => {
            const [nextKey, nextDirection] = event.target.value.split(":") as [SortKey, SortDirection];
            startTransition(() => {
              setSortKey(nextKey);
              setSortDirection(nextDirection);
            });
          }}
          aria-label="Sort users"
        >
          {sortOptions.map((option) => (
            <option key={`${option.key}:${option.direction}`} value={`${option.key}:${option.direction}`}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="list-panel">
        <h2>
          bo_members{" "}
          <span style={{ fontWeight: 400, color: "var(--outline)", fontSize: 10 }}>
            ({filteredItems.length}
            {filteredItems.length !== items.length ? ` / ${items.length}` : ""})
          </span>
        </h2>
        <div className="toolbar-meta">
          <span>{hasFilters ? "Filtered results" : "Showing all matching default status"}</span>
          {isPending ? <span>Updating...</span> : <span>Sorted by {sortLabels[sortKey]}</span>}
        </div>
        <div className="admin-list">
          <div className="admin-table-head admin-table-head-users">
            <SortHeader label="Name" sortKey="name" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
            <SortHeader label="Phone" sortKey="phone" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
            <SortHeader label="Membership" sortKey="membership" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
            <SortHeader label="Upline" sortKey="uplinePlatinum" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
            <SortHeader label="Status" sortKey="status" activeKey={sortKey} direction={sortDirection} onToggle={toggleSort} />
          </div>
          {filteredItems.map((item) => (
            <div className="admin-row admin-row-users" key={item.id}>
              <div className="row-summary row-summary-table row-summary-users">
                <strong data-label="Name">{item.name}</strong>
                <span data-label="Phone">{item.phone || "-"}</span>
                <span data-label="Membership">
                  <Badge tone="neutral">{formatMembership(item.membership)}</Badge>
                </span>
                <span data-label="Upline">{item.uplinePlatinum || "-"}</span>
                <span data-label="Status">
                  <Badge tone={item.active === false ? "neutral" : "dark"}>
                    {item.active === false ? "Inactive" : "Active"}
                  </Badge>
                </span>
              </div>
            </div>
          ))}
          {!filteredItems.length ? <div className="admin-empty">No members match your search or filters.</div> : null}
        </div>
      </div>
    </>
  );

  function toggleSort(nextKey: SortKey) {
    startTransition(() => {
      if (sortKey === nextKey) {
        setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
        return;
      }
      setSortKey(nextKey);
      setSortDirection(nextKey === "status" ? "asc" : "asc");
    });
  }
}

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onToggle,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onToggle: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      className={`admin-sort-button${active ? " active" : ""}`}
      onClick={() => onToggle(sortKey)}
      aria-pressed={active}
      title={active ? `${label}: ${direction === "asc" ? "ascending" : "descending"}` : `Sort by ${label}`}
    >
      <span>{label}</span>
      <i>{active ? (direction === "asc" ? "↑" : "↓") : "↕"}</i>
    </button>
  );
}

function compareUsers(left: User, right: User, sortKey: SortKey, sortDirection: SortDirection) {
  const direction = sortDirection === "asc" ? 1 : -1;
  const leftValue = getSortValue(left, sortKey);
  const rightValue = getSortValue(right, sortKey);

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    if (leftValue !== rightValue) return (leftValue - rightValue) * direction;
  } else {
    const result = String(leftValue).localeCompare(String(rightValue), "th", { sensitivity: "base", numeric: true });
    if (result !== 0) return result * direction;
  }

  return String(left.name).localeCompare(String(right.name), "th", { sensitivity: "base", numeric: true });
}

function getSortValue(item: User, sortKey: SortKey) {
  switch (sortKey) {
    case "membership":
      return membershipRank[item.membership] ?? -1;
    case "status":
      return item.active === false ? 1 : 0;
    case "uplinePlatinum":
      return item.uplinePlatinum || "";
    case "phone":
      return String(item.phone ?? "").replace(/\D/g, "");
    case "name":
    default:
      return item.name || "";
  }
}

function formatMembership(value: Membership) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
