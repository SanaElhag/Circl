import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

export default async function AdminPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login?redirect=/admin");

  const { data: userData } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", session.user.id)
    .single();

  if (!userData || userData.role !== "admin") redirect("/dashboard");

  return (
    <AdminShell
      adminName={userData.full_name}
      adminEmail={userData.email}
    />
  );
}