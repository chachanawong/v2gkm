"use client";

import { useEffect } from "react";

export function LoadingOverlay() {
  useEffect(() => {
    const overlay = () => document.getElementById("global-loading-overlay");
    let timer: number | null = null;

    const hide = () => {
      const node = overlay();
      if (!node) return;
      node.classList.remove("is-active");
      node.setAttribute("aria-hidden", "true");
      if (timer) window.clearTimeout(timer);
    };

    const show = () => {
      const node = overlay();
      if (!node) return;
      if (timer) window.clearTimeout(timer);
      node.classList.add("is-active");
      node.setAttribute("aria-hidden", "false");
      timer = window.setTimeout(hide, 1200);
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
      if (shouldShowForLink(target as HTMLAnchorElement | null)) show();
    };
    const onSubmit = (event: SubmitEvent) => {
      if (!event.defaultPrevented) show();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("pageshow", hide);
    window.addEventListener("popstate", hide);
    window.addEventListener("load", hide);
    document.addEventListener("readystatechange", hide);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("pageshow", hide);
      window.removeEventListener("popstate", hide);
      window.removeEventListener("load", hide);
      document.removeEventListener("readystatechange", hide);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div id="global-loading-overlay" className="loading-overlay" aria-hidden="true">
      <div className="loading-card" role="status" aria-live="polite">
        <span className="loading-spinner" />
        <strong>Loading</strong>
        <small>กำลังดำเนินการ</small>
      </div>
    </div>
  );
}
