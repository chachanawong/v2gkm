"use client";

import { GripVertical, X } from "lucide-react";

export function TagSelector({
  name,
  value,
  onChange,
  options = [],
  onCreate,
}: {
  name: string;
  value: string[];
  onChange: (next: string[]) => void;
  options?: string[];
  onCreate?: (tags: string[]) => void;
}) {
  function add(input: string) {
    const tags = input.split(",").map((item) => item.trim()).filter(Boolean);
    const next = [...value];
    const created: string[] = [];
    tags.forEach((tag) => {
      if (!next.some((item) => item.toLowerCase() === tag.toLowerCase())) next.push(tag);
      if (!options.some((item) => item.toLowerCase() === tag.toLowerCase())) created.push(tag);
    });
    onChange(next);
    if (created.length) onCreate?.(created);
  }

  function move(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="tag-selector">
      <input name={name} type="hidden" value={value.join(", ")} />
      <div className="tag-selector-grid">
        <div className="tag-column">
          <strong>All Categories</strong>
          <div className="tag-list">
            {options.filter((tag) => !value.includes(tag)).map((tag) => (
              <button className="tag tag-choice" type="button" onClick={() => onChange([...value, tag])} key={tag}>
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="tag-column">
          <strong>Selected Category Tags</strong>
          <div className="tag-list" aria-label={`${name} tags`}>
            {value.map((tag, index) => (
              <span
                className="tag tag-draggable"
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => move(Number(event.dataTransfer.getData("text/plain")), index)}
                key={`${tag}-${index}`}
              >
                <GripVertical size={12} />
                {tag}
                <button type="button" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))} title="Remove tag">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
      <input
        placeholder="Add custom category tags"
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== ",") return;
          event.preventDefault();
          add(event.currentTarget.value);
          event.currentTarget.value = "";
        }}
        onBlur={(event) => {
          add(event.currentTarget.value);
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
