"use client";

import { useEffect, useState } from "react";
import type { Admin, AdminRole, Membership, User } from "./types";

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
