export const googleConfig = {
  sheetId: "18DeC1aMQhb2-A_O4KSBm2zjvqOjpv5VAslANOiyST7I",
  driveFolderId: "15GMUzGEgAtsVc2RPscnN3wbrqKU5UkAt",
  appsScriptUrl: ""
};

export const member = { name: "V2G Member", phone: "08x-xxx-1234", membership: "Platinum", pin: "1234", status: "Active" };
export const categories = ["Business", "Service", "Operations", "Leadership", "Compliance", "Product"];
export const announcements = [
  { id: "ann-001", title: "V2G Knowledge Management เปิดใช้งาน", visibility: "All members", status: "Published", publishTime: "2026-05-14 09:00", publishUntil: "2026-06-14 23:59", description: "รวมข่าวสาร บทเรียน วิดีโอ และข้อมูลโปรไฟล์ไว้ในระบบเดียว โดยใช้ Google Sheet เป็นฐานข้อมูลกลาง", imageHorizontal: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop", imageVertical: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=900&auto=format&fit=crop" },
  { id: "ann-002", title: "อัปเดตแนวทางการเรียนรู้ประจำเดือน", visibility: "Silver, Platinum", status: "Published", publishTime: "2026-05-12 10:30", publishUntil: "2026-05-31 23:59", description: "แนะนำคอนเทนต์สำคัญสำหรับทีมบริการและทีมปฏิบัติการ พร้อมเก็บสถิติการเปิดดูภายในระบบ", imageHorizontal: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop", imageVertical: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=900&auto=format&fit=crop" },
  { id: "ann-003", title: "เปิดรับข้อเสนอหัวข้ออบรมใหม่", visibility: "Platinum", status: "Published", publishTime: "2026-05-20 08:00", publishUntil: "2026-06-20 23:59", description: "ผู้ดูแลสามารถรวบรวมไอเดียหัวข้อใหม่ และจัดหมวดหมู่เพื่อนำไปผลิตเป็น Learning Content", imageHorizontal: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200&auto=format&fit=crop", imageVertical: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=900&auto=format&fit=crop" },
  { id: "ann-004", title: "ระบบอัปโหลดรูปผ่าน Google Drive", visibility: "Admin", status: "Published", publishTime: "2026-05-18 13:00", publishUntil: "2026-07-18 23:59", description: "ไฟล์รูปภาพจากฟอร์มหลังบ้านจะถูกส่งไปยัง Apps Script และบันทึกลง Google Drive folder ที่กำหนด", imageHorizontal: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop", imageVertical: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=900&auto=format&fit=crop" }
];
export const learning = [
  { id: "learn-001", title: "Customer Service Essentials", visibility: "All members", status: "Published", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", youtubeId: "dQw4w9WgXcQ", categories: ["Service", "Business"], publishTime: "2026-05-13 09:30", publishUntil: "2026-06-30 23:59", description: "หลักการสื่อสารกับลูกค้า การรับฟัง และการส่งต่อปัญหาอย่างเป็นระบบ", views: 184 },
  { id: "learn-002", title: "Operations Checklist", visibility: "Silver, Platinum", status: "Published", youtubeUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U", youtubeId: "ysz5S6PUM-U", categories: ["Operations", "Compliance"], publishTime: "2026-05-10 11:00", publishUntil: "2026-07-10 23:59", description: "เช็กลิสต์ก่อนเริ่มงานประจำวันและขั้นตอนตรวจสอบคุณภาพงาน", views: 97 },
  { id: "learn-003", title: "Leadership Quick Start", visibility: "Platinum", status: "Draft", youtubeUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw", youtubeId: "jNQXAC9IVRw", categories: ["Leadership"], publishTime: "2026-05-22 09:00", publishUntil: "2026-06-22 23:59", description: "แนวทางเริ่มต้นดูแลทีม สื่อสารเป้าหมาย และติดตามผลอย่างชัดเจน", views: 0 }
];
export const profiles = [
  { id: "profile-001", name: "Admin Team", pin: "2458", visibility: "All members", status: "Published", bio: "ดูแลข่าวสาร สิทธิ์การเข้าถึง และการจัดหมวดหมู่เนื้อหาในระบบ", image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=900&auto=format&fit=crop" },
  { id: "profile-002", name: "Learning Team", pin: "4421", visibility: "Silver, Platinum", status: "Published", bio: "รวบรวมบทเรียน วิดีโอ และคู่มือการทำงานให้พร้อมใช้สำหรับสมาชิก", image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=900&auto=format&fit=crop" },
  { id: "profile-003", name: "Support Team", pin: "9090", visibility: "Admin", status: "Draft", bio: "ช่วยตอบคำถามผู้ใช้งานและประสานงานการแก้ไขปัญหาการเข้าใช้งาน", image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=900&auto=format&fit=crop" }
];
export const users = [
  { id: "user-001", name: "Narin V2G", phone: "080-111-2222", membership: "General", pin: "1111", uplinePlatinum: "Admin Team" },
  { id: "user-002", name: "Suda Learning", phone: "081-222-3333", membership: "Silver", pin: "2222", uplinePlatinum: "Learning Team" },
  { id: "user-003", name: "Krit Platinum", phone: "082-333-4444", membership: "Platinum", pin: "3333", uplinePlatinum: "Admin Team" }
];
export const staff = [
  { id: "staff-001", name: "Content Staff", email: "content@v2g.local", role: "Content Staff" },
  { id: "staff-002", name: "Account Staff", email: "account@v2g.local", role: "Account Staff" },
  { id: "staff-003", name: "System Admin", email: "admin@v2g.local", role: "Admin" }
];
export const permissions = ["Dashboard ดูได้", "User management", "Content management", "Staff management", "Categories management", "System management"];
export const activity = [
  { actor: "Admin", action: "published announcement", time: "Today 10:30" },
  { actor: "Learning", action: "updated YouTube link", time: "Yesterday 16:45" },
  { actor: "Member", action: "viewed learning content", time: "Yesterday 09:20" }
];
export function getPublished(items) { return items.filter((item) => item.status === "Published"); }
export function youtubeThumbnail(youtubeId) { return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`; }
