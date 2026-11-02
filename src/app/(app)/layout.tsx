import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { BottomNav } from "@/src/components/ui/BottomNav";

export default async function AppLayout({
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
      {/* Contenido de la pantalla — deja espacio para la barra inferior */}
      <div className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))]">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}
