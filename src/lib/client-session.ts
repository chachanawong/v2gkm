"use client";

import { useSyncExternalStore } from "react";
import type { Admin, AdminRole, Membership, User } from "./types";
import { clearBootstrapCache } from "./bootstrap-cache";

let lastUserRaw: string | null = null;
let lastUser: User | null = null;
let lastAdminRaw: string | null = null;
let lastAdmin: Omit<Admin, "password"> | null = null;

function parseStoredJson<T>(key: string, raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("v2g_user");
  if (raw === lastUserRaw) return lastUser;
  lastUserRaw = raw;
  lastUser = parseStoredJson<User>("v2g_user", raw);
  return lastUser;
}

export function getStoredAdmin(): Omit<Admin, "password"> | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("v2g_admin");
  if (raw === lastAdminRaw) return lastAdmin;
  lastAdminRaw = raw;
  lastAdmin = parseStoredJson<Omit<Admin, "password">>("v2g_admin", raw);
  return lastAdmin;
}

export function getStoredMembership(): Membership {
  return getStoredUser()?.membership ?? "general";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", callback);
  window.addEventListener("v2g-session", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("v2g-session", callback);
  };
}

export function getUserToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("v2g_user_token");
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("v2g_admin_token");
}

export function isAdminRole(role?: string): role is AdminRole {
  return role === "Admin" || role === "Content" || role === "Account";
}

export function useStoredUser() {
  return useSyncExternalStore(subscribe, getStoredUser, () => undefined);
}

export function useStoredAdmin() {
  return useSyncExternalStore(subscribe, getStoredAdmin, () => undefined);
}

export function useStoredMembership() {
  return useSyncExternalStore(subscribe, getStoredMembership, () => undefined);
}

export function clearUserSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("v2g_user");
  window.localStorage.removeItem("v2g_user_token");
  clearBootstrapCache("user:");
  window.dispatchEvent(new Event("v2g-session"));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("v2g_admin");
  window.localStorage.removeItem("v2g_admin_token");
  clearBootstrapCache("admin:");
  window.dispatchEvent(new Event("v2g-session"));
}
