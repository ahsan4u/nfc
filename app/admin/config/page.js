import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminShell from "@/components/admin/AdminShell";
import AdminConfig from "@/components/admin/AdminConfig";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Page Configuration | Admin - The Nawab Sahab",
};

export default async function AdminConfigPage() {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    return <AdminLogin />;
  }

  return (
    <AdminShell>
      <AdminConfig />
    </AdminShell>
  );
}
