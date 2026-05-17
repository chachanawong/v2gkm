"use client";

import { useEffect, useState } from "react";
import type { Admin, AdminRole, Membership, User } from "./types";

let lastUserRaw: string | null = null;
let lastUser: User | null = null;
let lastAdminRaw: string | null = null;
let lastAdmin: Omit<Admin, "password"> | null = null;
const sessionTtl = 3 * 60 * 1000;

function isSessionExpired(key: "v2g_user" | "v2g_admin") {
  const lastSeen = Number(window.localStorage.getItem(`${key}_last_seen`) ?? 0);
  return Boolean(lastSeen && Date.now() - lastSeen > sessionTtl);
}

function clearSession(key: "v2g_user" | "v2g_admin") {
  window.localStorage.removeItem(key);
  window.localStorage.removeItem(`${key}_token`);
  window.localStorage.removeItem(`${key}_last_seen`);
  if (key === "v2g_user") {
    lastUserRaw = null;
    lastUser = null;
  } else {
    lastAdminRaw = null;
    lastAdmin = null;
  }
}

function touchSession(key: "v2g_user" | "v2g_admin") {
  window.localStorage.setItem(`${key}_last_seen`, String(Date.now()));
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  if (isSessionExpired("v2g_user")) {
    clearSession("v2g_user");
    return null;
  }
  const raw = window.localStorage.getItem("v2g_user");
  if (raw === lastUserRaw) {
    if (lastUser) touchSession("v2g_user");
    return lastUser;
  }
  lastUserRaw = raw;
  lastUser = raw ? (JSON.parse(raw) as User) : null;
  if (lastUser) touchSession("v2g_user");
  return lastUser;
}

export function getStoredAdmin(): Omit<Admin, "password"> | null {
  if (typeof window === "undefined") return null;
  if (isSessionExpired("v2g_admin")) {
    clearSession("v2g_admin");
    return null;
  }
  const raw = window.localStorage.getItem("v2g_admin");
  if (raw === lastAdminRaw) {
    if (lastAdmin) touchSession("v2g_admin");
    return lastAdmin;
  }
  lastAdminRaw = raw;
  lastAdmin = raw ? (JSON.parse(raw) as Omit<Admin, "password">) : null;
  if (lastAdmin) touchSession("v2g_admin");
  return lastAdmin;
}

export function getStoredMembership(): Membership {
  return getStoredUser()?.membership ?? "general";
}

export function getUserToken() {
  if (typeof window === "undefined") return null;
  if (isSessionExpired("v2g_user")) {
    clearSession("v2g_user");
    return null;
  }
  touchSession("v2g_user");
  return window.localStorage.getItem("v2g_user_token");
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  if (isSessionExpired("v2g_admin")) {
    clearSession("v2g_admin");
    return null;
  }
  touchSession("v2g_admin");
  return window.localStorage.getItem("v2g_admin_token");
}

export function markSessionActive(kind: "user" | "admin") {
  if (typeof window === "undefined") return;
  touchSession(kind === "user" ? "v2g_user" : "v2g_admin");
}

export function isAdminRole(role?: string): role is AdminRole {
  return role === "Admin" || role === "Content" || role === "Account";
}

export function useStoredUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    const ready = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    window.addEventListener("v2g-session", sync);
    return () => {
      window.clearTimeout(ready);
      window.removeEventListener("storage", sync);
      window.removeEventListener("v2g-session", sync);
    };
  }, []);
  return user;
}

export function useStoredAdmin() {
  const [admin, setAdmin] = useState<Omit<Admin, "password"> | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => setAdmin(getStoredAdmin());
    const ready = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    window.addEventListener("v2g-session", sync);
    return () => {
      window.clearTimeout(ready);
      window.removeEventListener("storage", sync);
      window.removeEventListener("v2g-session", sync);
    };
  }, []);
  return admin;
}

export function useStoredMembership() {
  const [membership, setMembership] = useState<Membership | undefined>(undefined);
  useEffect(() => {
    const sync = () => setMembership(getStoredMembership());
    const ready = window.setTimeout(sync, 0);
    window.addEventListener("storage", sync);
    window.addEventListener("v2g-session", sync);
    return () => {
      window.clearTimeout(ready);
      window.removeEventListener("storage", sync);
      window.removeEventListener("v2g-session", sync);
    };
  }, []);
  return membership;
}
