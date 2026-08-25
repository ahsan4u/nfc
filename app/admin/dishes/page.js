import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminShell from "@/components/admin/AdminShell";
import AdminDishes from "@/components/admin/AdminDishes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dishes & Menu | Admin - The Nawab Sahab",
};

export default async function AdminDishesPage() {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    return <AdminLogin />;
  }

  return (
    <AdminShell>
      <AdminDishes />
    </AdminShell>
  );
}
