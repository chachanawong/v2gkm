"use client";

/* eslint-disable @next/next/no-img-element */
import { CheckCircle2, Eye, Loader2, Pencil, Plus, Send, Trash2 } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useId, useMemo, useRef, useState } from "react";
import { normalizeCategoryType } from "@/lib/category-settings";
import { getAdminToken, getStoredAdmin, isAdminRole } from "@/lib/client-session";
import { maskPhone } from "@/lib/format";
import { getPrimaryImage, normalizeCategories, normalizeImageUrl, normalizeImages } from "@/lib/normalize";
import { requestGlobalConfirm, withGlobalLoading } from "@/lib/overlay";
import { applyPublishWindow, computeContentStatus, splitByStatus, validatePublishWindow } from "@/lib/publish";
import type { AdminRole, PublishFields } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ImageUploader } from "./ImageUploader";
import { TagSelector } from "./TagSelector";

type FieldOption = string | { value: string; label: string };

type Field = {
  key: string;
  label: string;
  type?: "textarea" | "select" | "select-other" | "password" | "checkbox" | "datetime-local" | "date" | "time-range" | "status";
  options?: FieldOption[];
  adminOnly?: boolean;
  required?: boolean;
  placeholder?: string;
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
  defaultValues,
  fixedValues,
  eyebrow,
}: {
  title: string;
  resource: string;
  items: Item[];
  fields: Field[];
  publishable?: boolean;
  defaultValues?: Partial<Item>;
  fixedValues?: Partial<Item>;
  eyebrow?: string | null;
}) {
  const [rows, setRows] = useState<Item[]>(items);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(() =>
    (fields.find((field) => field.key === "categories")?.options ?? []).map((o) => typeof o === "string" ? o : o.value),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<Item | null>(null);
  const [lineTarget, setLineTarget] = useState<Item | null>(null);
  const [lineMessage, setLineMessage] = useState("");
  const [lineGroupId, setLineGroupId] = useState("");
  const [lineSending, setLineSending] = useState(false);
  const [lineResult, setLineResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState<{ title: string; detail: string } | null>(null);
  const formId = useId();
  const formRef = useRef<HTMLFormElement | null>(null);
  const admin = getStoredAdmin();
  const adminRole: AdminRole = isAdminRole(admin?.role) ? admin.role : "Content";
  const visibleFields = fields.filter((field) => !field.adminOnly || adminRole === "Admin");
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
    const isCreate = !rows.some((item) => item.id === base.id);
    const next = buildItemFromForm(base, form);
    if (!next) return null;
    setSaving(true);
    const { response, data } = await withGlobalLoading(async () => {
      const nextResponse = await fetch(`/api/admin/${resource}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
          "x-admin-name": admin?.name ?? adminRole,
        },
        body: JSON.stringify(next),
      });
      return { response: nextResponse, data: await nextResponse.json() };
    }, isCreate ? `กำลังสร้าง ${title}` : `กำลังบันทึก ${title}`);
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Save failed");
      return null;
    }
    setRows((current) => {
      const exists = current.some((item) => item.id === data.item.id);
      return exists ? current.map((item) => (item.id === data.item.id ? data.item : item)) : [data.item, ...current];
    });
    showSaveSuccessOverlay(resource, data.item, isCreate, setSuccessOverlay);
    if (closeAfterSave) setActive(null);
    else setActive(data.item);
    return data.item as Item;
  }

  function createItem() {
    setActive({
      ...defaultValues,
      id: `${resource}-${crypto.randomUUID()}`,
      status: "draft",
      visibility: "general",
      active: defaultValues?.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async function preview(item: Item) {
    if (!publishable) return;
    setError("");
    const { response, data } = await withGlobalLoading(async () => {
      const nextResponse = await fetch("/api/admin/preview-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({ resourceType: resource, resourceId: item.id, data: item }),
      });
      return { response: nextResponse, data: await nextResponse.json() };
    }, "กำลังสร้าง preview");
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
    const selectOtherError = validateSelectOtherFields(visibleFields, next);
    if (selectOtherError) {
      setError(selectOtherError);
      return null;
    }
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
      if (resource === "news") {
        next.eventDate = formatThaiDisplayDate(String(form.get("eventDate") ?? ""));
        next.eventTime = formatThaiTimeRange(String(form.get("eventTime") ?? ""));
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
    if (fixedValues) {
      Object.assign(next, fixedValues);
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
    const type = normalizeCategoryType(resource);
    await withGlobalLoading(async () => {
      await Promise.all(missing.map((name) => fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
          "x-admin-name": admin?.name ?? adminRole,
        },
        body: JSON.stringify({ id: `categories-${crypto.randomUUID()}`, name, active: true, type, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
      }).catch(() => undefined)));
    }, "กำลังสร้างหมวดหมู่");
  }

  async function removeItem(target: Item) {
    const confirmed = await requestGlobalConfirm({
      title: "Confirm Delete",
      message: `ยืนยันการลบ ${String(target.title ?? target.name ?? target.id)} ใช่หรือไม่?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;
    const response = await withGlobalLoading(async () => fetch(`/api/admin/${resource}?id=${target.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
      },
    }), `กำลังลบ ${title}`);
    if (response.ok) {
      setRows((current) => current.filter((item) => item.id !== target.id));
    }
  }

  function openLinePublish(item: Item) {
    setLineTarget(item);
    setLineMessage(buildLineMessage(resource, item));
    setLineGroupId("");
    setLineResult(null);
  }

  async function publishToLine() {
    if (!lineTarget || lineSending) return;
    setLineSending(true);
    setLineResult(null);
    try {
      const response = await withGlobalLoading(async () => fetch("/api/admin/broadcast-line", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({ message: lineMessage, groupId: lineGroupId || undefined }),
      }), "กำลังส่งข้อความไป LINE");
      const data = await response.json() as { error?: string };
      if (response.ok) {
        setLineResult({ ok: true, message: "Sent to LINE group successfully." });
      } else {
        setLineResult({ ok: false, message: data.error ?? "LINE publish failed." });
      }
    } catch {
      setLineResult({ ok: false, message: "Unable to connect to LINE publish service." });
    } finally {
      setLineSending(false);
    }
  }

  const list = publishable
    ? (["published", "scheduled", "draft", "unpublished"] as const).map((status) => ({ title: statusLabel(status), rows: groups?.[status] ?? [] }))
    : [{ title, rows: filtered }];
  const eyebrowText = eyebrow === undefined ? (publishable ? "Content Management" : "Management") : eyebrow;

  return (
    <section className="admin-section">
      {successOverlay ? (
        <div className="success-overlay" aria-live="polite" role="status">
          <div className="success-card">
            <CheckCircle2 size={30} />
            <strong>{successOverlay.title}</strong>
            <small>{successOverlay.detail}</small>
          </div>
        </div>
      ) : null}
      <div className="section-head">
        <div>
          {eyebrowText ? <p className="eyebrow">{eyebrowText}</p> : null}
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
          <h2>{group.title} <span style={{ fontWeight: 400, color: "var(--outline)", fontSize: 10 }}>({group.rows.length})</span></h2>
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
                  {(resource === "news" || resource === "knowledge") ? (
                    <Button variant="ghost" size="sm" icon={<Send size={15} />} tooltip="Publish to LINE group" onClick={() => openLinePublish(item)} />
                  ) : null}
                  <Button variant="ghost" size="sm" icon={<Pencil size={15} />} tooltip="Edit" onClick={() => setActive(item)} />
                  <Button variant="danger" size="sm" icon={<Trash2 size={15} />} tooltip="Delete" onClick={() => void removeItem(item)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <Modal
        open={Boolean(active)}
        title={`${active?.createdAt === active?.updatedAt ? "Create" : "Edit"} ${title}`}
        onClose={() => setActive(null)}
        footer={active ? (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => setActive(null)}>Cancel</Button>
            {publishable ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Eye size={14} />}
                onClick={() => previewActive(formRef.current)}
              >
                Preview
              </Button>
            ) : null}
            <Button type="submit" form={formId} size="sm" icon={saving ? <Loader2 size={14} className="spin-icon" /> : undefined} disabled={saving}>
              {saving ? "Saving" : "Save"}
            </Button>
          </>
        ) : null}
      >
        <form id={formId} ref={formRef} className="form-grid" onSubmit={save}>
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
        </form>
      </Modal>
      <Modal
        open={Boolean(lineTarget)}
        title={`Publish to LINE: ${String(lineTarget?.title ?? lineTarget?.name ?? "")}`}
        onClose={() => setLineTarget(null)}
        footer={lineResult?.ok ? (
          <Button size="sm" onClick={() => setLineTarget(null)}>Close</Button>
        ) : (
          <Button size="sm" icon={<Send size={14} />} onClick={publishToLine} disabled={lineSending}>
            {lineSending ? "Sending..." : "Send to LINE group"}
          </Button>
        )}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label className="field">
            <span>
              LINE Group ID{" "}
              <span style={{ fontWeight: 400, color: "var(--secondary)", fontSize: 11 }}>
                (optional, falls back to `LINE_GROUP_ID`)
              </span>
            </span>
            <input
              type="text"
              placeholder="C1234567890abcdef..."
              value={lineGroupId}
              onChange={(event) => setLineGroupId(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea
              rows={10}
              value={lineMessage}
              onChange={(event) => setLineMessage(event.target.value)}
              style={{ fontFamily: "inherit", fontSize: 13, lineHeight: 1.6 }}
            />
          </label>
          <p style={{ fontSize: 11, color: "var(--secondary)" }}>
            Add the LINE bot into the target group before sending.
          </p>
          {lineResult ? (
            <p style={{ fontWeight: 600, color: lineResult.ok ? "var(--success)" : "var(--error)", fontSize: 13 }}>
              {lineResult.ok ? "✓ " : "✕ "}{lineResult.message}
            </p>
          ) : null}
        </div>
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
  const req = field.required ? { required: true } : {};
  if (field.key === "images") {
    const images = normalizeImages(value);
    return (
      <ImageUploader
        name={field.key}
        value={images}
        onChange={(next) => updateItem(field.key, next)}
      />
    );
  }
  if (field.key === "categories") {
    const tags = normalizeCategories(value);
    return <TagSelector name={field.key} value={tags} options={categoryOptions} onCreate={createCategories} onChange={(next) => updateItem(field.key, next)} />;
  }
  if (field.type === "textarea") return <textarea name={field.key} defaultValue={String(value ?? "")} rows={4} placeholder={field.placeholder} {...req} />;
  if (field.type === "select") {
    const opts: FieldOption[] = field.options ?? ["general", "silver", "platinum"];
    const firstVal = typeof opts[0] === "string" ? opts[0] : opts[0]?.value ?? "general";
    return (
      <select name={field.key} defaultValue={String(value ?? firstVal)}>
        {opts.map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? opt : opt.label;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    );
  }
  if (field.type === "select-other") {
    const opts: FieldOption[] = field.options ?? [];
    const actualValue = String(value ?? "");
    const optionValues = opts.map((opt) => typeof opt === "string" ? opt : opt.value).filter((opt) => opt !== "__other__");
    const selectedValue = optionValues.includes(actualValue) ? actualValue : (actualValue ? "__other__" : optionValues[0] ?? "__other__");
    const otherValue = selectedValue === "__other__" ? actualValue : "";
    const updateSelectOther = (selected: string, custom: string) => {
      updateItem(field.key, selected === "__other__" ? custom : selected);
    };
    return (
      <div className="select-other-field">
        <select
          value={selectedValue}
          onChange={(event) => updateSelectOther(event.target.value, otherValue)}
        >
          {opts.map((opt) => {
            const v = typeof opt === "string" ? opt : opt.value;
            const l = typeof opt === "string" ? opt : opt.label;
            return <option key={v} value={v}>{l}</option>;
          })}
        </select>
        {selectedValue === "__other__" ? (
          <input
            type="text"
            value={otherValue}
            onChange={(event) => updateSelectOther("__other__", event.target.value)}
            placeholder={field.placeholder ?? "ระบุข้อมูลเพิ่มเติม"}
            {...req}
          />
        ) : null}
        <input name={field.key} type="hidden" value={selectedValue === "__other__" ? otherValue : selectedValue} />
      </div>
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
  if (field.type === "date") {
    return <input name={field.key} type="date" defaultValue={toDateInputValue(value)} {...req} />;
  }
  if (field.type === "time-range") {
    const range = parseTimeRange(value);
    return (
      <div className="time-range-field">
        <input
          type="time"
          value={range.start}
          onChange={(event) => updateItem(field.key, buildTimeRangeValue(event.target.value, range.end))}
          {...req}
        />
        <span>ถึง</span>
        <input
          type="time"
          value={range.end}
          onChange={(event) => updateItem(field.key, buildTimeRangeValue(range.start, event.target.value))}
          {...req}
        />
        <input name={field.key} type="hidden" value={buildTimeRangeValue(range.start, range.end)} />
      </div>
    );
  }
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
  return <input name={field.key} type={field.type ?? "text"} defaultValue={Array.isArray(value) ? value.join(", ") : String(value ?? "")} placeholder={field.placeholder ?? field.label} {...req} />;
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
          <small>{formatPublishSchedule(item)}</small>
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
          <small>{formatPublishSchedule(item)}</small>
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
      </div>
    );
  }
  if (resource === "events") {
    const img = Array.isArray(item.images) ? String(item.images[0] ?? "") : "";
    return (
      <div className="row-summary row-summary-content">
        {img ? <SafeImage src={img} alt="" /> : <span className="row-thumb-placeholder" />}
        <div>
          <strong>{String(item.title ?? item.id)}</strong>
          <p className="line-clamp two-line">{String(item.description ?? "")}</p>
          <div style={{ display: "flex", gap: 6, fontSize: 11, color: "var(--secondary)" }}>
            <span>{String(item.eventType ?? "-")}</span>
            <span>·</span>
            <span>{String(item.startDate ?? "").slice(0, 10)}</span>
            {item.location ? <><span>·</span><span>{String(item.location)}</span></> : null}
          </div>
        </div>
      </div>
    );
  }
  if (resource === "learning_paths") {
    return (
      <div className="row-summary row-summary-content">
        {item.thumbnail ? <SafeImage src={String(item.thumbnail)} alt="" /> : <span className="row-thumb-placeholder" />}
        <div>
          <strong>{String(item.title ?? item.id)}</strong>
          <p className="line-clamp two-line">{String(item.description ?? "")}</p>
          <div style={{ fontSize: 11, color: "var(--secondary)" }}>
            <span>Order: {String(item.order ?? "-")}</span>
            <span> · {String(item.visibility ?? "general")}</span>
          </div>
        </div>
      </div>
    );
  }
  if (resource === "lessons") {
    return (
      <div className="row-summary row-summary-content">
        {item.thumbnail ? <SafeImage src={String(item.thumbnail)} alt="" /> : <span className="row-thumb-placeholder" />}
        <div>
          <strong>{String(item.title ?? item.id)}</strong>
          <p className="line-clamp two-line">{String(item.youtubeUrl ?? "")}</p>
          <div style={{ fontSize: 11, color: "var(--secondary)" }}>
            <span>Path: {String(item.pathId ?? "-")}</span>
            <span> · Order: {String(item.order ?? "-")}</span>
          </div>
        </div>
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
  if (key === "pinned") return value === "true" || value === "on" || value === "Yes";
  return value;
}

function validateSelectOtherFields(fields: Field[], item: Item) {
  for (const field of fields) {
    if (field.type !== "select-other" || !field.required) continue;
    const value = String(item[field.key] ?? "").trim();
    if (!value) return `${field.label} is required.`;
  }
  return "";
}

function toDateInputValue(value?: unknown) {
  if (!value) return "";
  const parsed = parseThaiDateValue(String(value));
  if (!parsed) return "";
  return parsed.toISOString().slice(0, 10);
}

function parseThaiDateValue(value: string) {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const normalized = value.replace(/\u00a0/g, " ").trim();
  const match = normalized.match(/(\d{1,2})\s+([^\s]+)\s+(?:พ\.ศ\.\s*)?(\d{4})/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = THAI_MONTH_INDEX[match[2]] ?? -1;
  const buddhistYear = Number(match[3]);
  if (month < 0 || !Number.isFinite(day) || !Number.isFinite(buddhistYear)) return null;
  const year = buddhistYear > 2400 ? buddhistYear - 543 : buddhistYear;
  return new Date(year, month, day);
}

function formatThaiDisplayDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const weekday = THAI_WEEKDAYS[date.getDay()];
  const month = THAI_MONTHS[date.getMonth()];
  const buddhistYear = date.getFullYear() + 543;
  return `วัน${weekday}ที่ ${date.getDate()} ${month} ${buddhistYear}`;
}

function parseTimeRange(value: unknown) {
  const text = String(value ?? "");
  const parts = [...text.matchAll(/(\d{1,2})[.:](\d{2})/g)].map((match) => `${match[1].padStart(2, "0")}:${match[2]}`);
  return {
    start: parts[0] ?? "",
    end: parts[1] ?? "",
  };
}

function buildTimeRangeValue(start: string, end: string) {
  if (!start && !end) return "";
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function formatThaiTimeRange(value: string) {
  const { start, end } = parseTimeRange(value);
  if (!start && !end) return "";
  if (start && end) return `${start.replace(":", ".")} - ${end.replace(":", ".")} น.`;
  return `${(start || end).replace(":", ".")} น.`;
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

function formatPublishSchedule(item: Item) {
  const start = formatDateTime(item.publishTime);
  const end = formatDateTime(item.publishUntil);
  if (start === "-" && end === "-") return "Publish schedule: immediate";
  if (start !== "-" && end !== "-") return `Publish schedule: ${start} - ${end}`;
  if (start !== "-") return `Publish schedule: ${start}`;
  return `Publish until: ${end}`;
}

function formatDateTime(value?: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date).replace(",", "");
}

const THAI_MONTHS = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const THAI_MONTH_INDEX: Record<string, number> = {
  มกราคม: 0,
  กุมภาพันธ์: 1,
  มีนาคม: 2,
  เมษายน: 3,
  พฤษภาคม: 4,
  มิถุนายน: 5,
  กรกฎาคม: 6,
  สิงหาคม: 7,
  กันยายน: 8,
  ตุลาคม: 9,
  พฤศจิกายน: 10,
  ธันวาคม: 11,
};
const THAI_WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

function buildLineMessage(resource: string, item: Item) {
  if (resource === "news") {
    const lines = [`📢 ${String(item.title ?? "")}`];
    const schedule = formatPublishSchedule(item);
    if (schedule) lines.push(schedule);
    if (item.eventDate) lines.push(`🗓 Date: ${String(item.eventDate)}`);
    if (item.eventTime) lines.push(`⏰ Time: ${String(item.eventTime)}`);
    if (item.eventChannel) lines.push(`📍 Channel: ${String(item.eventChannel)}`);
    if (item.body) lines.push("", String(item.body).slice(0, 500));
    return lines.join("\n");
  }

  if (resource === "knowledge") {
    const lines = [`🎓 ${String(item.title ?? "")}`];
    const schedule = formatPublishSchedule(item);
    if (schedule) lines.push(schedule);
    if (item.categories) {
      const categories = normalizeCategories(item.categories);
      if (categories.length) lines.push(`🏷 Categories: ${categories.join(", ")}`);
    }
    if (item.youtubeUrl) lines.push(`▶️ ${String(item.youtubeUrl)}`);
    return lines.join("\n");
  }

  return String(item.title ?? item.name ?? "");
}

function showSaveSuccessOverlay(
  resource: string,
  item: Item,
  isCreate: boolean,
  setSuccessOverlay: Dispatch<SetStateAction<{ title: string; detail: string } | null>>,
) {
  if (resource !== "news" && resource !== "profiles") return;

  const title = resource === "news"
    ? (isCreate ? "เพิ่ม News สำเร็จ" : "บันทึก News สำเร็จ")
    : (isCreate ? "เพิ่ม Profile สำเร็จ" : "บันทึก Profile สำเร็จ");
  const detail = String(item.title ?? item.name ?? "บันทึกข้อมูลเรียบร้อย");
  setSuccessOverlay({ title, detail });
  window.setTimeout(() => {
    setSuccessOverlay((current) => (current?.detail === detail ? null : current));
  }, 2200);
}
