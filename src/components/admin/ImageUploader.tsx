"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { getAdminToken } from "@/lib/client-session";
import { normalizeImageUrl } from "@/lib/normalize";

export function ImageUploader({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string[]>([]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const objectUrls = Array.from(files).map((file) => URL.createObjectURL(file));
    setPending(objectUrls);
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("files", file));
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${getAdminToken()}` },
      body: form,
    });
    const data = (await response.json()) as { urls?: string[]; images?: { directUrl?: string; url?: string; thumbnailUrl?: string }[]; error?: string };
    setUploading(false);
    setPending([]);
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    const uploadedUrls = data.images?.map((item) => item.directUrl || item.url || item.thumbnailUrl || "").filter(Boolean) ?? data.urls;
    if (!response.ok || !uploadedUrls) {
      setError(data.error ?? "Upload failed");
      return;
    }
    onChange([...value, ...uploadedUrls.map(normalizeImageUrl)]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="image-uploader">
      <input name={name} type="hidden" value={value.join(", ")} />
      <div className="upload-actions">
        <input id={inputId} ref={inputRef} type="file" accept="image/*" multiple onChange={(event) => upload(event.currentTarget.files)} />
        <label className={`btn btn-secondary btn-sm ${uploading ? "is-disabled" : ""}`} htmlFor={inputId} aria-disabled={uploading}>
          {uploading ? <Loader2 size={14} className="spin-icon" /> : <ImagePlus size={14} />}
          <span>
          Upload
          </span>
        </label>
        <span>{uploading ? "Uploading..." : `${value.length} image${value.length === 1 ? "" : "s"}`}</span>
      </div>
      {pending.length ? (
        <div className="upload-preview-grid">
          {pending.map((url, index) => (
            <figure className="upload-preview is-pending" key={`${url}-${index}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={normalizeImageUrl(url)} alt="" />
            </figure>
          ))}
        </div>
      ) : null}
      {value.length ? (
        <div className="upload-preview-grid">
          {value.map((url, index) => (
            <figure className="upload-preview" key={`${url}-${index}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={normalizeImageUrl(url)} alt="" />
              <button type="button" onClick={() => remove(index)} title="Remove image">
                <X size={13} />
              </button>
            </figure>
          ))}
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
