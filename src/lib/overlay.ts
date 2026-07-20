"use client";

type LoadingDetail = {
  id: number;
  message?: string;
};

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "default" | "danger";
};

type ConfirmDetail = ConfirmOptions & {
  id: number;
};

type SuccessOptions = {
  title: string;
  detail?: string;
};

type SuccessDetail = SuccessOptions & {
  id: number;
};

let nextLoadingId = 1;
let nextConfirmId = 1;
let nextSuccessId = 1;

export function showGlobalLoading(message?: string) {
  if (typeof window === "undefined") return null;
  const id = nextLoadingId++;
  window.dispatchEvent(new CustomEvent<LoadingDetail>("v2g:loading-show", {
    detail: { id, message },
  }));
  return id;
}

export function hideGlobalLoading(id?: number | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<{ id?: number | null }>("v2g:loading-hide", {
    detail: { id },
  }));
}

export async function withGlobalLoading<T>(work: () => Promise<T>, message?: string) {
  const id = showGlobalLoading(message);
  try {
    return await work();
  } finally {
    hideGlobalLoading(id);
  }
}

export function requestGlobalConfirm(options: ConfirmOptions): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const id = nextConfirmId++;

  return new Promise<boolean>((resolve) => {
    const done = (event: Event) => {
      const custom = event as CustomEvent<{ id: number; confirmed: boolean }>;
      if (custom.detail?.id !== id) return;
      window.removeEventListener("v2g:confirm-result", done as EventListener);
      resolve(Boolean(custom.detail.confirmed));
    };

    window.addEventListener("v2g:confirm-result", done as EventListener);
    window.dispatchEvent(new CustomEvent<ConfirmDetail>("v2g:confirm-open", {
      detail: { id, ...options },
    }));
  });
}

export function showGlobalSuccess(options: SuccessOptions) {
  if (typeof window === "undefined") return null;
  const id = nextSuccessId++;
  window.dispatchEvent(new CustomEvent<SuccessDetail>("v2g:success-show", {
    detail: { id, ...options },
  }));
  return id;
}
