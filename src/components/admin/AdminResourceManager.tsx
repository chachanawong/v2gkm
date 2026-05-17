"use client";

/* eslint-disable @next/next/no-img-element */
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { getAdminToken, getStoredAdmin, isAdminRole } from "@/lib/client-session";
import { maskPhone } from "@/lib/format";
import { getPrimaryImage, normalizeCategories, normalizeImageUrl, normalizeImages } from "@/lib/normalize";
import { applyPublishWindow, computeContentStatus, splitByStatus, validatePublishWindow } from "@/lib/publish";
import type { AdminRole, PublishFields } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ImageUploader } from "./ImageUploader";
import { TagSelector } from "./TagSelector";

type Field = {
  key: string;
  label: string;
  type?: "textarea" | "select" | "password" | "checkbox" | "datetime-local" | "status";
  options?: string[];
  adminOnly?: boolean;
};

type Item = Partial<PublishFields> & {
  id: string;
  title?: string;
  name?: string;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export function AdminResourceManager({
  title,
  resource,
  items,
  fields,
  publishable = true,
}: {
  title: string;
  resource: string;
  items: Item[];
  fields: Field[];
  publishable?: boolean;
}) {
  const [rows, setRows] = useState<Item[]>(items);
  const [categoryOptions, setCategoryOptions] = useState(() => fields.find((field) => field.key === "categories")?.options ?? []);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<Item | null>(null);
  const [confirm, setConfirm] = useState<Item | null>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const admin = getStoredAdmin();
  const adminRole: AdminRole = isAdminRole(admin?.role) ? admin.role : "Content";
  const visibleFields = useMemo(() => fields.filter((field) => !field.adminOnly || adminRole === "Admin"), [adminRole, fields]);
  const filterOptions = useMemo(() => buildFilterOptions(rows), [rows]);
  const filtered = useMemo(() => {
    return rows
      .filter((item) => `${item.title ?? item.name ?? item.email ?? item.phone ?? ""}`.toLowerCase().includes(query.toLowerCase()))
      .filter((item) => filter === "all" || itemMatchesFilter(item, filter));
  }, [filter, rows, query]);
  const groups = publishable ? splitByStatus(filtered as (Item & PublishFields)[]) : null;

  async function save(event: FormEvent<HTMLFormElement>, closeAfterSave = true) {
    event.preventDefault();
    if (!active || saving) return;
    return saveItem(active, new FormData(event.currentTarget), closeAfterSave);
  }

  async function saveItem(base: Item, form: FormData, closeAfterSave = true) {
    setError("");
    const next = buildItemFromForm(base, form);
    if (!next) return null;
    setSaving(true);
    const response = await fetch(`/api/admin/${resource}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`,
        "x-admin-name": admin?.name ?? adminRole,
      },
      body: JSON.stringify(next),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Save failed");
      return null;
    }
    setRows((current) => {
      const exists = current.some((item) => item.id === data.item.id);
      return exists ? current.map((item) => (item.id === data.item.id ? data.item : item)) : [data.item, ...current];
    });
    if (closeAfterSave) setActive(null);
    else setActive(data.item);
    return data.item as Item;
  }

  function createItem() {
    setActive({
      id: `${resource}-${crypto.randomUUID()}`,
      status: "draft",
      visibility: "general",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async function preview(item: Item) {
    if (!publishable) return;
    setError("");
    const response = await fetch("/api/admin/preview-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify({ resourceType: resource, resourceId: item.id, data: item }),
    });
    const data = await response.json();
    if (response.ok) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    } else {
      setError(data.error ?? "Preview failed");
    }
  }

  async function previewActive(form: HTMLFormElement | null) {
    if (!active || !form) return;
    const next = buildItemFromForm(active, new FormData(form), false);
    if (next) await preview(next);
  }

  function buildItemFromForm(base: Item, form: FormData, validatePassword = true) {
    const next: Item = {
      ...base,
      updatedAt: new Date().toISOString(),
    };
    visibleFields.forEach((field) => {
      const value = form.get(field.key);
      next[field.key] = field.type === "checkbox" ? value === "on" : normalizeValue(field.key, String(value ?? ""));
    });
    if (publishable) {
      next.status = String(form.get("status") ?? "draft") as PublishFields["status"];
      next.visibility = String(form.get("visibility") ?? "general") as PublishFields["visibility"];
      next.publishTime = String(form.get("publishTime") || "");
      next.publishUntil = String(form.get("publishUntil") || "");
      const publishError = validatePublishWindow(String(next.publishTime || ""), String(next.publishUntil || ""));
      if (publishError) {
        setError(publishError);
        return null;
      }
      next.status = computeContentStatus({
        status: next.status as PublishFields["status"],
        publishTime: String(next.publishTime || ""),
        publishUntil: String(next.publishUntil || ""),
      });
      if (resource === "knowledge") {
        next.thumbnail = next.thumbnail || getYouTubeThumbnail(String(next.youtubeUrl ?? ""));
        next.uploadDate = next.uploadDate || new Date().toISOString().slice(0, 10);
        next.viewCount = Number(next.viewCount ?? 0);
      }
    }
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (validatePassword && (password || confirmPassword)) {
      if (password.length < 6 || password !== confirmPassword) {
        setError("Password must be at least 6 characters and match confirm password.");
        return null;
      }
      next.password = password;
    }
    return next;
  }

  async function createCategories(tags: string[]) {
    if (!tags.length) return;
    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);
    const unique = normalized.filter((tag, index) => normalized.findIndex((item) => item.toLowerCase() === tag.toLowerCase()) === index);
    const missing = unique.filter((tag) => !categoryOptions.some((item) => item.toLowerCase() === tag.toLowerCase()));
    if (!missing.length) return;
    setCategoryOptions((current) => [...current, ...missing].sort((a, b) => a.localeCompare(b)));
    await Promise.all(missing.map((name) => fetch("/api/admin/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAdminToken()}`,
        "x-admin-name": admin?.name ?? adminRole,
      },
      body: JSON.stringify({ id: `categories-${crypto.randomUUID()}`, name, active: true, level: "public", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
    }).catch(() => undefined)));
  }

  async function removeItem() {
    if (!confirm) return;
    const response = await fetch(`/api/admin/${resource}?id=${confirm.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
      },
    });
    if (response.ok) {
      setRows((current) => current.filter((item) => item.id !== confirm.id));
      setConfirm(null);
    }
  }

  const list = publishable
    ? (["published", "scheduled", "draft", "unpublished"] as const).map((status) => ({ title: statusLabel(status), rows: groups?.[status] ?? [] }))
    : [{ title, rows: filtered }];

  return (
    <section className="admin-section">
      <div className="section-head">
        <div>
          <p className="eyebrow">{publishable ? "Content Management" : "Management"}</p>
          <h1>{title}</h1>
        </div>
        <Button size="sm" icon={<Plus size={15} />} onClick={createItem}>
          Add
        </Button>
      </div>
      <div className="toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
        {filterOptions.length ? (
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All filters</option>
            {filterOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : null}
      </div>
      {list.map((group) => (
        <div className="list-panel" key={group.title}>
          <h2>{group.title}</h2>
          <div className="admin-list">
            {group.rows.map((item) => (
              <div className={`admin-row admin-row-${resource}`} key={item.id}>
                <ResourceSummary item={item} resource={resource} />
                {publishable ? (
                  <Badge tone={statusTone(applyPublishWindow(item as Item & PublishFields).status)}>{statusLabel(String(applyPublishWindow(item as Item & PublishFields).status))}</Badge>
                ) : resource === "categories" ? (
                  <span className="category-status">{item.active === false ? "Deactivate" : "Active"}</span>
                ) : (
                  <div className="status-stack">
                    <Badge tone={item.active === false ? "neutral" : "dark"}>{item.active === false ? "Deactivate" : "Active"}</Badge>
                  </div>
                )}
                <div className="row-actions">
                  {publishable ? <Button variant="ghost" size="sm" icon={<Eye size={15} />} tooltip="Preview" onClick={() => preview(item)} /> : null}
                  <Button variant="ghost" size="sm" icon={<Pencil size={15} />} tooltip="Edit" onClick={() => setActive(item)} />
                  <Button variant="danger" size="sm" icon={<Trash2 size={15} />} tooltip="Delete" onClick={() => setConfirm(item)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Modal open={Boolean(active)} title={`${active?.createdAt === active?.updatedAt ? "Create" : "Edit"} ${title}`} onClose={() => setActive(null)}>
        <form className="form-grid" onSubmit={save}>
          {visibleFields.map((field) => (
            <label className={`field field-${field.key}`} key={field.key}>
              <span>{field.label}</span>
              {renderField(field, active, showPassword, categoryOptions, createCategories, () => setShowPassword((value) => !value), (key, value) => {
                setActive((current) => current ? { ...current, [key]: value, updatedAt: new Date().toISOString() } : current);
              })}
            </label>
          ))}
          {publishable ? (
            <>
              <label className="field">
                <span>Status</span>
                <select name="status" defaultValue={active?.status === "scheduled" ? "published" : active?.status ?? "draft"}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </label>
              <label className="field">
                <span>Publish time</span>
                <input
                  name="publishTime"
                  type="datetime-local"
                  defaultValue={toDatetimeLocal(active?.publishTime)}
                />
              </label>
              <label className="field">
                <span>Publish until</span>
                <input
                  name="publishUntil"
                  type="datetime-local"
                  defaultValue={toDatetimeLocal(active?.publishUntil)}
                />
              </label>
            </>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal-foot inline-foot">
            <Button type="button" variant="ghost" size="sm" onClick={() => setActive(null)}>Cancel</Button>
            {publishable ? <Button type="button" variant="secondary" size="sm" icon={<Eye size={14} />} onClick={(event) => previewActive(event.currentTarget.form)}>Preview</Button> : null}
            <Button type="submit" size="sm" icon={saving ? <Loader2 size={14} className="spin-icon" /> : undefined} disabled={saving}>
              {saving ? "Saving" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(confirm)}
        title="Confirm action"
        onClose={() => setConfirm(null)}
        footer={<Button variant="danger" size="sm" onClick={removeItem}>Delete</Button>}
      >
        <p>Confirm delete {String(confirm?.title ?? confirm?.name ?? confirm?.id)}?</p>
      </Modal>
    </section>
  );
}

function renderField(
  field: Field,
  item: Item | null,
  showPassword: boolean,
  categoryOptions: string[],
  createCategories: (tags: string[]) => void,
  togglePassword: () => void,
  updateItem: (key: string, value: unknown) => void,
) {
  const value = item?.[field.key];
  if (field.key === "images") {
    const images = Array.isArray(value) ? value.map(String) : (normalizeValue(field.key, String(value ?? "")) as string[]);
    return (
      <ImageUploader
        name={field.key}
        value={images}
        onChange={(next) => updateItem(field.key, next)}
      />
    );
  }
  if (field.key === "categories") {
    const tags = Array.isArray(value) ? value.map(String) : (normalizeValue(field.key, String(value ?? "")) as string[]);
    return <TagSelector name={field.key} value={tags} options={categoryOptions} onCreate={createCategories} onChange={(next) => updateItem(field.key, next)} />;
  }
  if (field.type === "textarea") return <textarea name={field.key} defaultValue={String(value ?? "")} rows={4} />;
  if (field.type === "select") {
    return (
      <select name={field.key} defaultValue={String(value ?? field.options?.[0] ?? "general")}>
        {(field.options ?? ["general", "silver", "platinum"]).map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }
  if (field.type === "status") {
    return (
      <select name={field.key} defaultValue={value === false || value === "false" || value === "Deactivate" ? "Deactivate" : "Active"}>
        <option value="Active">Active</option>
        <option value="Deactivate">Deactivate</option>
      </select>
    );
  }
  if (field.type === "checkbox") return <input name={field.key} type="checkbox" defaultChecked={Boolean(value ?? true)} />;
  if (field.type === "password") {
    return (
      <div className="password-field">
        <input name={field.key} type={showPassword ? "text" : "password"} defaultValue="" placeholder={field.label} />
        <button type="button" onClick={togglePassword} title="Toggle password">
          <Eye size={14} />
        </button>
      </div>
    );
  }
  return <input name={field.key} type={field.type ?? "text"} defaultValue={Array.isArray(value) ? value.join(", ") : String(value ?? "")} placeholder={field.label} />;
}

function ResourceSummary({ item, resource }: { item: Item; resource: string }) {
  if (resource === "news") {
    const image = getPrimaryImage(item);
    return (
      <div className="row-summary row-summary-content">
        {image ? <SafeImage src={image} alt="" /> : <span className="row-thumb-placeholder" />}
        <div>
          <strong>{String(item.title ?? item.id)}</strong>
          <p className="line-clamp two-line multiline">{String(item.body ?? "")}</p>
          <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          <small>{formatShortDate(item.publishTime ?? item.createdAt)}</small>
        </div>
      </div>
    );
  }
  if (resource === "knowledge") {
    const image = getPrimaryImage(item);
    return (
      <div className="row-summary row-summary-content">
        {image ? <SafeImage src={image} alt="" /> : <span className="row-thumb-placeholder" />}
        <div>
          <strong>{String(item.title ?? item.id)}</strong>
          <p className="line-clamp two-line">{String(item.youtubeUrl ?? "")}</p>
          <div className="tag-row">{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
          <small>{Number(item.viewCount ?? 0).toLocaleString()} views</small>
        </div>
      </div>
    );
  }
  if (resource === "profiles") {
    const image = getPrimaryImage(item);
    return (
      <div className="row-summary row-summary-content">
        {image ? <SafeImage src={image} alt="" /> : <span className="row-thumb-placeholder" />}
        <div>
          <strong>{String(item.name ?? item.title ?? item.id)}</strong>
          <p className="line-clamp two-line multiline">{String(item.bio ?? "")}</p>
          <div className="tag-row"><span className="tag"> {String(item.pin ?? "-")}</span>{normalizeCategories(item.categories).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        </div>
      </div>
    );
  }
  if (resource === "users") {
    return (
      <div className="row-summary row-summary-table row-summary-users">
        <strong data-label="Name">{String(item.name ?? item.id)}</strong>
        <span data-label="Phone">{maskPhone(String(item.phone ?? ""))}</span>
        <span data-label="Membership" className="badge badge-neutral">{String(item.membership ?? "-")}</span>
        <span data-label="Upline">{String(item.uplinePlatinum ?? "-")}</span>
      </div>
    );
  }
  if (resource === "admins") {
    return (
      <div className="row-summary row-summary-table row-summary-admins">
        <strong data-label="Name">{String(item.name ?? item.id)}</strong>
        <span data-label="Email">{String(item.email ?? "-")}</span>
        <span data-label="Role" className="badge badge-neutral">{String(item.role ?? "-")}</span>
      </div>
    );
  }
  if (resource === "categories") {
    return (
      <div className="row-summary row-summary-category">
        <strong>{String(item.name ?? item.id)}</strong>
        <span>{String(item.level ?? "public")}</span>
      </div>
    );
  }
  return (
    <div className="row-summary">
      <strong>{String(item.title ?? item.name ?? item.email ?? item.id)}</strong>
      <span>{String(item.updatedAt ?? item.createdAt ?? "No timestamp")}</span>
    </div>
  );
}

function normalizeValue(key: string, value: string) {
  if (["categories", "images"].includes(key)) return value.split(",").map((item) => item.trim()).filter(Boolean);
  if (key === "active") return value === "Active" || value === "true";
  return value;
}

function getYouTubeThumbnail(url: string) {
  const id = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)?.[1];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

function statusLabel(value: string) {
  if (value === "published") return "Published";
  if (value === "scheduled") return "Scheduled";
  if (value === "draft") return "Draft";
  if (value === "unpublished") return "Unpublished";
  return value;
}

function statusTone(value: unknown): "neutral" | "green" | "amber" | "blue" {
  if (value === "published") return "green";
  if (value === "scheduled") return "blue";
  if (value === "draft") return "amber";
  return "neutral";
}

function SafeImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const normalized = normalizeImageUrl(src);
  if (!normalized || failed) return <span className="row-thumb-placeholder" />;
  return <img src={normalized} alt={alt} onError={() => setFailed(true)} />;
}

function buildFilterOptions(rows: Item[]) {
  const options = new Set<string>();
  rows.forEach((item) => {
    normalizeCategories(item.categories).forEach((category) => options.add(category));
    if (item.visibility) options.add(String(item.visibility));
    if (item.membership) options.add(String(item.membership));
    if (item.role) options.add(String(item.role));
    if (typeof item.active === "boolean") options.add(item.active ? "Active" : "Unactive");
  });
  return [...options].sort();
}

function itemMatchesFilter(item: Item, filter: string) {
  if (normalizeCategories(item.categories).includes(filter)) return true;
  if (String(item.visibility ?? "") === filter) return true;
  if (String(item.membership ?? "") === filter) return true;
  if (String(item.role ?? "") === filter) return true;
  if (filter === "Active") return item.active !== false;
  if (filter === "Unactive") return item.active === false;
  return false;
}

function toDatetimeLocal(value?: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function formatShortDate(value?: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
