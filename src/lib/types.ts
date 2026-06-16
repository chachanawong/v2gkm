export type Membership = "general" | "silver" | "platinum";
export type PublishStatus = "draft" | "scheduled" | "published" | "unpublished";
export type ResourceType = "knowledge" | "news" | "profiles" | "categories" | "users" | "admins" | "events" | "learning_paths" | "lessons";
export type AdminRole = "Admin" | "Content" | "Account";

export type User = {
  id: string;
  name: string;
  phone: string;
  membership: Membership;
  uplinePlatinum?: string;
  active?: boolean;
  loginPin?: string;
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
  eventDate?: string;
  eventTime?: string;
  eventChannel?: string;
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

export type UserPin = {
  phone: string;
  loginPin: string;
};

export type Register = {
  phone: string;
  loginpin: string;
};

export type PreviewToken = {
  token: string;
  resourceType: "knowledge" | "news" | "profiles";
  resourceId: string;
  expiresAt: string;
  data?: Record<string, unknown>;
};

export type ContentItem = Knowledge | News | Profile;

/* ── Events ──────────────────────────────────────────────── */
export type EventType = "seminar" | "training" | "social" | "online";
export type RegistrationStatus = "pending" | "confirmed" | "cancelled";

export type Event = {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  images: string[];
  visibility: Membership;
  status: PublishStatus;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventRegistration = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhone: string;
  status: RegistrationStatus;
  createdAt: string;
};

/* ── Learning ─────────────────────────────────────────────── */
export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type LearningPath = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  visibility: Membership;
  status: PublishStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type Lesson = {
  id: string;
  pathId: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnail: string;
  order: number;
  quiz: QuizQuestion[];
  passingScore: number;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
};

export type UserProgress = {
  id: string;
  userId: string;
  lessonId: string;
  pathId: string;
  completed: boolean;
  quizScore?: number;
  completedAt?: string;
};
