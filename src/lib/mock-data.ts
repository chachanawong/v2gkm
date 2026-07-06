import type { Admin, AuditLog, Category, Event, EventRegistration, Knowledge, Lesson, LearningPath, News, PinResetRequest, PreviewToken, Profile, User, UserProgress } from "./types";

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

export const events: Event[] = [
  {
    id: "ev-001",
    title: "V2G Business Seminar 2026",
    description: "สัมมนาใหญ่ประจำปี พบปะทีมงานและรับฟังแผนธุรกิจ Q3\nมี keynote speaker ระดับประเทศ และ workshop แบบ interactive",
    eventType: "seminar",
    startDate: "2026-07-15T09:00:00.000Z",
    endDate: "2026-07-15T17:00:00.000Z",
    location: "BITEC บางนา ห้อง Grand Hall",
    capacity: 500,
    images: ["https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=900&auto=format&fit=crop"],
    visibility: "general",
    status: "published",
    pinned: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ev-002",
    title: "Silver Leadership Training",
    description: "อบรมภาวะผู้นำสำหรับ Silver สมาชิก\nเรียนรู้การสร้างทีมและวางแผนการเติบโต",
    eventType: "training",
    startDate: "2026-07-22T13:00:00.000Z",
    endDate: "2026-07-22T17:00:00.000Z",
    location: "Zoom Online",
    capacity: 80,
    images: ["https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=900&auto=format&fit=crop"],
    visibility: "silver",
    status: "published",
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ev-003",
    title: "Platinum Strategy Dinner",
    description: "งานเลี้ยงสังสรรค์และแชร์ประสบการณ์เฉพาะสมาชิก Platinum\nพบปะเครือข่ายระดับสูง",
    eventType: "social",
    startDate: "2026-08-05T18:00:00.000Z",
    endDate: "2026-08-05T21:00:00.000Z",
    location: "โรงแรม Four Seasons กรุงเทพฯ",
    capacity: 50,
    images: ["https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=900&auto=format&fit=crop"],
    visibility: "platinum",
    status: "published",
    pinned: false,
    createdAt: now,
    updatedAt: now,
  },
];

export const eventRegistrations: EventRegistration[] = [
  {
    id: "reg-001",
    eventId: "ev-001",
    userId: "u-001",
    userName: "Nara",
    userPhone: "0811111111",
    status: "confirmed",
    createdAt: now,
  },
];

export const learningPaths: LearningPath[] = [
  {
    id: "lp-001",
    title: "V2G Starter Path",
    description: "เส้นทางสำหรับสมาชิกใหม่ เรียนรู้พื้นฐานธุรกิจ V2G จากศูนย์",
    thumbnail: "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=900&auto=format&fit=crop",
    visibility: "general",
    status: "published",
    order: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "lp-002",
    title: "Silver Growth Mastery",
    description: "กลยุทธ์การขยายทีมและสร้างรายได้ระยะยาวสำหรับ Silver ขึ้นไป",
    thumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=900&auto=format&fit=crop",
    visibility: "silver",
    status: "published",
    order: 2,
    createdAt: now,
    updatedAt: now,
  },
];

export const lessons: Lesson[] = [
  {
    id: "ls-001",
    pathId: "lp-001",
    title: "แนะนำ V2G และโอกาสทางธุรกิจ",
    description: "ทำความรู้จักกับ V2G Academy และภาพรวมโอกาสทางธุรกิจที่คุณจะได้รับ",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    order: 1,
    quiz: [
      { question: "V2G ย่อมาจากอะไร?", options: ["Value to Growth", "Vision to Goal", "Venture & Gain", "Volume to Generate"], correctIndex: 0 },
      { question: "ระดับสมาชิกเริ่มต้นคือ?", options: ["Platinum", "Silver", "General", "Bronze"], correctIndex: 2 },
    ],
    passingScore: 50,
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ls-002",
    pathId: "lp-001",
    title: "การสร้างเครือข่ายเบื้องต้น",
    description: "เทคนิคการแนะนำและสร้างความสัมพันธ์กับสมาชิกใหม่",
    youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    youtubeId: "ysz5S6PUM-U",
    thumbnail: "https://i.ytimg.com/vi/ysz5S6PUM-U/hqdefault.jpg",
    order: 2,
    quiz: [
      { question: "ขั้นตอนแรกของการแนะนำสมาชิกใหม่คือ?", options: ["ปิดการขายทันที", "สร้างความสัมพันธ์ก่อน", "บอกราคาสินค้า", "เชิญเข้า group ไลน์"], correctIndex: 1 },
    ],
    passingScore: 100,
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ls-003",
    pathId: "lp-001",
    title: "วางแผน 90 วันแรก",
    description: "กำหนดเป้าหมายและแผนปฏิบัติการใน 90 วันแรกเพื่อความสำเร็จ",
    youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    youtubeId: "jNQXAC9IVRw",
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    order: 3,
    quiz: [
      { question: "เป้าหมาย 90 วันแรกควรเป็น?", options: ["막연한 꿈", "ตัวเลขที่ชัดเจนและวัดได้", "รอดูสถานการณ์", "ถามจาก upline"], correctIndex: 1 },
    ],
    passingScore: 100,
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ls-004",
    pathId: "lp-002",
    title: "Silver Mindset & การนำทีม",
    description: "ปรับ mindset สู่การเป็นผู้นำทีมที่มีประสิทธิภาพ",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeId: "dQw4w9WgXcQ",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    order: 1,
    quiz: [
      { question: "ผู้นำทีมที่ดีต้อง?", options: ["ทำงานคนเดียว", "สอนและ empower ทีม", "ควบคุมทุกอย่าง", "รอ upline สั่ง"], correctIndex: 1 },
    ],
    passingScore: 100,
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ls-005",
    pathId: "lp-002",
    title: "กลยุทธ์การขยายทีม",
    description: "วิธีวางระบบการ recruit และ onboard สมาชิกใหม่ให้ได้ผล",
    youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    youtubeId: "ysz5S6PUM-U",
    thumbnail: "https://i.ytimg.com/vi/ysz5S6PUM-U/hqdefault.jpg",
    order: 2,
    quiz: [
      { question: "ระบบ onboard ที่ดีคือ?", options: ["ปล่อยให้ทีมหาทางเอง", "มี checklist ชัดเจน 30 วัน", "โทรหาทุกวัน", "ส่งคลิปยูทูบให้ดู"], correctIndex: 1 },
    ],
    passingScore: 100,
    status: "published",
    createdAt: now,
    updatedAt: now,
  },
];

export const userProgress: UserProgress[] = [];

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

export const pinResetRequests: PinResetRequest[] = [];

export const db = { users, admins, categories, knowledge, news, profiles, events, eventRegistrations, learningPaths, lessons, userProgress, auditLogs, previewTokens, pinResetRequests };
