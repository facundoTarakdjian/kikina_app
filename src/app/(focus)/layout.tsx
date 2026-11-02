import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

/** Layout sin barra inferior — para pantallas en modo foco (nuevo date, etc.) */
export default async function FocusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col min-h-dvh bg-paper">
      {children}
    </div>
  );
}
