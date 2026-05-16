export type Membership = "general" | "silver" | "platinum";
export type PublishStatus = "draft" | "scheduled" | "published" | "unpublished";
export type ResourceType = "knowledge" | "news" | "profiles" | "categories" | "users" | "admins";
export type AdminRole = "Admin" | "Content" | "Account";

export type User = {
  id: string;
  name: string;
  phone: string;
  membership: Membership;
  uplinePlatinum?: string;
  active?: boolean;
};

export type Admin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active?: boolean;
  password?: string;
};

export type Category = {
  id: string;
  name: string;
  active: boolean;
};

export type PublishFields = {
  status: PublishStatus;
  visibility: Membership;
  publishTime?: string;
  publishUntil?: string;
};

export type Knowledge = PublishFields & {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnail: string;
  categories: string[];
  uploadDate: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type News = PublishFields & {
  id: string;
  title: string;
  body: string;
  images: string[];
  categories?: string[];
  createdAt: string;
  updatedAt: string;
};

export type Profile = PublishFields & {
  id: string;
  pin: string;
  name: string;
  bio: string;
  position: string;
  images: string[];
  categories?: string[];
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  actor: string;
  role: "user" | "admin" | "system";
  action: string;
  resource: string;
  at: string;
};

export type PreviewToken = {
  token: string;
  resourceType: "knowledge" | "news" | "profiles";
  resourceId: string;
  expiresAt: string;
  data?: Record<string, unknown>;
};

export type ContentItem = Knowledge | News | Profile;
