import { redirect } from "next/navigation";

export default async function AdminCategoriesPage() {
  redirect("/admin/master-settings");
}
