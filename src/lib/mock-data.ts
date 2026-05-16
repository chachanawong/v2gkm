import type { Admin, AuditLog, Category, Knowledge, News, PreviewToken, Profile, User } from "./types";

const now = new Date().toISOString();

export const users: User[] = [
  { id: "u-001", name: "Nara", phone: "0811111111", membership: "general", active: true },
  { id: "u-002", name: "Silver Member", phone: "0822222222", membership: "silver", uplinePlatinum: "Ploy", active: true },
  { id: "u-003", name: "Platinum Member", phone: "0833333333", membership: "platinum", active: true },
];

export const admins: Admin[] = [
  { id: "a-001", name: "Admin V2G", email: "admin@v2g.local", role: "Admin", active: true, password: "admin1234" },
];

export const categories: Category[] = [
  { id: "c-001", name: "Business", active: true },
  { id: "c-002", name: "Mindset", active: true },
  { id: "c-003", name: "Training", active: true },
  { id: "c-004", name: "Leadership", active: true },
];

export const knowledge: Knowledge[] = [
  {
    id: "k-001",
    title: "V2G Foundation",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    categories: ["Training", "Business"],
    uploadDate: "2026-05-01",
    viewCount: 12450,
    status: "published",
    visibility: "general",
    publishTime: "2026-05-01T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "k-002",
    title: "Silver Growth Playbook",
    youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    youtubeId: "ysz5S6PUM-U",
    thumbnail: "https://i.ytimg.com/vi/ysz5S6PUM-U/hqdefault.jpg",
    categories: ["Mindset"],
    uploadDate: "2026-05-04",
    viewCount: 8420,
    status: "published",
    visibility: "silver",
    publishTime: "2026-05-04T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "k-003",
    title: "Platinum Strategy Room",
    youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    youtubeId: "jNQXAC9IVRw",
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    categories: ["Leadership"],
    uploadDate: "2026-05-08",
    viewCount: 5330,
    status: "published",
    visibility: "platinum",
    publishTime: "2026-05-08T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
];

export const news: News[] = [
  {
    id: "n-001",
    title: "V2G Weekly Update",
    body: "สรุปข่าวประจำสัปดาห์\nกิจกรรมใหม่เปิดให้ลงทะเบียนแล้ว\nติดตามรายละเอียดเพิ่มเติมในระบบ",
    images: ["https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=900&auto=format&fit=crop"],
    categories: ["Business"],
    status: "published",
    visibility: "general",
    publishTime: "2026-05-03T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "n-002",
    title: "Silver Recognition",
    body: "ยินดีกับสมาชิก Silver รุ่นใหม่\nข้อมูลนี้เห็นเฉพาะ Silver ขึ้นไป",
    images: ["https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=900&auto=format&fit=crop"],
    categories: ["Training"],
    status: "published",
    visibility: "silver",
    publishTime: "2026-05-05T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "n-003",
    title: "Platinum Briefing",
    body: "ประกาศสำหรับ Platinum\nกรุณาเข้าสู่ระบบ admin เพื่อจัดการข้อมูลเพิ่มเติม",
    images: ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=900&auto=format&fit=crop"],
    categories: ["Leadership"],
    status: "published",
    visibility: "platinum",
    publishTime: "2026-05-07T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
];

export const profiles: Profile[] = [
  {
    id: "p-001",
    pin: "101",
    name: "Kanda S.",
    position: "Business Mentor",
    bio: "ดูแลการเริ่มต้นธุรกิจและการวางระบบทีม\nเชี่ยวชาญการสื่อสารกับสมาชิกใหม่",
    images: ["https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900&auto=format&fit=crop", "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=900&auto=format&fit=crop"],
    categories: ["Business"],
    status: "published",
    visibility: "general",
    publishTime: "2026-05-01T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "p-002",
    pin: "202",
    name: "Ploy T.",
    position: "Silver Coach",
    bio: "โค้ชด้าน mindset และ rhythm การทำงาน\nเน้นการลงมือทำแบบต่อเนื่อง",
    images: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=900&auto=format&fit=crop", "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=900&auto=format&fit=crop"],
    categories: ["Mindset"],
    status: "published",
    visibility: "silver",
    publishTime: "2026-05-02T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "p-003",
    pin: "303",
    name: "Arthit V.",
    position: "Platinum Advisor",
    bio: "ให้คำปรึกษากลยุทธ์ทีมระดับสูง\nดูแล session เฉพาะ Platinum",
    images: ["https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=900&auto=format&fit=crop", "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=900&auto=format&fit=crop"],
    categories: ["Leadership"],
    status: "published",
    visibility: "platinum",
    publishTime: "2026-05-02T01:00:00.000Z",
    createdAt: now,
    updatedAt: now,
  },
];

export const auditLogs: AuditLog[] = [
  { id: "log-001", actor: "Admin V2G", role: "admin", action: "published news", resource: "news:n-001", at: now },
  { id: "log-002", actor: "system", role: "system", action: "checked publish windows", resource: "all content", at: now },
  { id: "log-003", actor: "Admin V2G", role: "admin", action: "updated profile", resource: "profiles:p-001", at: now },
];

export const previewTokens: PreviewToken[] = [
  {
    token: "demo-preview-token",
    resourceType: "news",
    resourceId: "n-001",
    expiresAt: "2030-01-01T00:00:00.000Z",
  },
];

export const db = { users, admins, categories, knowledge, news, profiles, auditLogs, previewTokens };
