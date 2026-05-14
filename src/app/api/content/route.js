import { NextResponse } from "next/server";
import { activity, announcements, categories, googleConfig, learning, member, permissions, profiles, staff, users } from "@/lib/data";

export function GET() {
  return NextResponse.json({ googleConfig, member, announcements, learning, profiles, categories, users, staff, permissions, activity });
}
