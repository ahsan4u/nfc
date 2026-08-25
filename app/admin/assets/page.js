import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminShell from "@/components/admin/AdminShell";
import AdminAssets from "@/components/admin/AdminAssets";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Asset Library | Admin - The Nawab Sahab",
};

export default async function AdminAssetsPage() {
  const isAuth = await isAdminAuthenticated();

  if (!isAuth) {
    return <AdminLogin />;
  }

  return (
    <AdminShell>
      <AdminAssets />
    </AdminShell>
  );
}
