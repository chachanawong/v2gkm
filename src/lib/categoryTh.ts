const MAP: Record<string, string> = {
  "Business": "ธุรกิจ",
  "Training": "การฝึกอบรม",
  "Leadership": "ผู้นำ",
  "Technology": "เทคโนโลยี",
  "Marketing": "การตลาด",
  "Finance": "การเงิน",
  "Health": "สุขภาพ",
  "Education": "การศึกษา",
  "Event": "กิจกรรม",
  "News": "ข่าวสาร",
  "Update": "อัปเดต",
  "Announcement": "ประกาศ",
  "Sales": "การขาย",
  "Product": "สินค้า",
  "Strategy": "กลยุทธ์",
  "HR": "บุคคล",
  "Operations": "ปฏิบัติการ",
  "Network": "เครือข่าย",
  "Partner": "พาร์ทเนอร์",
  "Investment": "การลงทุน",
  "General": "ทั่วไป",
};

export function toThaiCategory(name: string): string {
  return MAP[name] ?? name;
}
