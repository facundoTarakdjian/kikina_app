"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { createClient } from "@/src/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Cerrar sesión
    </Button>
  );
}
