"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function LoadingOverlay() {
  const pathname = usePathname();
  const activeIds = useRef(new Set<number>());
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("กำลังดำเนินการ");
  const [confirm, setConfirm] = useState<{
    id: number;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    tone: "default" | "danger";
  } | null>(null);
  const successTimeoutRef = useRef<number | null>(null);
  const [success, setSuccess] = useState<{
    id: number;
    title: string;
    detail: string;
  } | null>(null);

  useEffect(() => {
    const hide = () => {
      activeIds.current.clear();
      setActive(false);
      setMessage("กำลังดำเนินการ");
    };

    const show = (nextMessage?: string) => {
      setMessage(nextMessage || "กำลังดำเนินการ");
      setActive(true);
    };

    const shouldShowForLink = (anchor: HTMLAnchorElement | null) => {
      if (!anchor?.href) return false;
      if (anchor.target && anchor.target !== "_self") return false;
      if (anchor.hasAttribute("download")) return false;
      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return false;
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return false;
      if (nextUrl.hash && nextUrl.pathname === window.location.pathname) return false;
      return true;
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (shouldShowForLink(target as HTMLAnchorElement | null)) show("กำลังโหลดหน้า");
    };
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (form?.dataset.globalLoading === "off") return;
      if (!event.defaultPrevented) show("กำลังบันทึกข้อมูล");
    };
    const onShow = (event: Event) => {
      const custom = event as CustomEvent<{ id: number; message?: string }>;
      if (custom.detail?.id != null) {
        activeIds.current.add(custom.detail.id);
      }
      show(custom.detail?.message);
    };
    const onHide = (event: Event) => {
      const custom = event as CustomEvent<{ id?: number | null }>;
      const id = custom.detail?.id;
      if (id == null) {
        activeIds.current.clear();
        setActive(false);
        setMessage("กำลังดำเนินการ");
        return;
      }
      activeIds.current.delete(id);
      if (activeIds.current.size === 0) {
        setActive(false);
        setMessage("กำลังดำเนินการ");
      }
    };
    const onConfirmOpen = (event: Event) => {
      const custom = event as CustomEvent<{
        id: number;
        title?: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        tone?: "default" | "danger";
      }>;
      if (!custom.detail) return;
      setConfirm({
        id: custom.detail.id,
        title: custom.detail.title ?? "Confirm Action",
        message: custom.detail.message,
        confirmText: custom.detail.confirmText ?? "Confirm",
        cancelText: custom.detail.cancelText ?? "Cancel",
        tone: custom.detail.tone ?? "default",
      });
    };
    const onSuccessShow = (event: Event) => {
      const custom = event as CustomEvent<{
        id: number;
        title: string;
        detail?: string;
      }>;
      if (!custom.detail) return;
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
      setSuccess({
        id: custom.detail.id,
        title: custom.detail.title,
        detail: custom.detail.detail ?? "ดำเนินการเรียบร้อย",
      });
      successTimeoutRef.current = window.setTimeout(() => {
        setSuccess((current) => (current?.id === custom.detail.id ? null : current));
        successTimeoutRef.current = null;
      }, 2200);
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("v2g:loading-show", onShow as EventListener);
    window.addEventListener("v2g:loading-hide", onHide as EventListener);
    window.addEventListener("v2g:confirm-open", onConfirmOpen as EventListener);
    window.addEventListener("v2g:success-show", onSuccessShow as EventListener);
    window.addEventListener("pageshow", hide);
    window.addEventListener("popstate", hide);
    window.addEventListener("load", hide);
    document.addEventListener("readystatechange", hide);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("v2g:loading-show", onShow as EventListener);
      window.removeEventListener("v2g:loading-hide", onHide as EventListener);
      window.removeEventListener("v2g:confirm-open", onConfirmOpen as EventListener);
      window.removeEventListener("v2g:success-show", onSuccessShow as EventListener);
      window.removeEventListener("pageshow", hide);
      window.removeEventListener("popstate", hide);
      window.removeEventListener("load", hide);
      document.removeEventListener("readystatechange", hide);
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      activeIds.current.clear();
      setActive(false);
      setMessage("กำลังดำเนินการ");
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, [pathname]);

  function resolveConfirm(confirmed: boolean) {
    if (!confirm) return;
    window.dispatchEvent(new CustomEvent("v2g:confirm-result", {
      detail: { id: confirm.id, confirmed },
    }));
    setConfirm(null);
  }

  return (
    <>
      <div id="global-loading-overlay" className={active ? "loading-overlay is-active" : "loading-overlay"} aria-hidden={active ? "false" : "true"}>
        <div className="loading-card" role="status" aria-live="polite">
          <span className="loading-spinner" />
          <strong>Loading</strong>
          <small>{message}</small>
        </div>
      </div>
      <Modal
        open={Boolean(confirm)}
        title={confirm?.title ?? "Confirm Action"}
        onClose={() => resolveConfirm(false)}
        footer={(
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => resolveConfirm(false)}>
              {confirm?.cancelText ?? "Cancel"}
            </Button>
            <Button
              type="button"
              variant={confirm?.tone === "danger" ? "danger" : "secondary"}
              size="sm"
              onClick={() => resolveConfirm(true)}
            >
              {confirm?.confirmText ?? "Confirm"}
            </Button>
          </>
        )}
      >
        <p>{confirm?.message}</p>
      </Modal>
      {success ? (
        <div className="success-overlay" aria-live="polite" role="status">
          <div className="success-card">
            <CheckCircle2 size={30} />
            <strong>{success.title}</strong>
            <small>{success.detail}</small>
          </div>
        </div>
      ) : null}
    </>
  );
}
