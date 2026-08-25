import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminShell from "@/components/admin/AdminShell";
import AdminCategories from "@/components/admin/AdminCategories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories | Admin - The Nawab Sahab",
};

export default async function AdminCategoriesPage() {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    return <AdminLogin />;
  }

  return (
    <AdminShell>
      <AdminCategories />
    </AdminShell>
  );
}
