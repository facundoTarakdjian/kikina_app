"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "../../lib/supabase/server";

const emailSchema = z.string().email();
const otpSchema = z.string().length(6).regex(/^\d{6}$/);

export async function sendOtp(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const raw = formData.get("email");
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) return { error: "Ingresá un mail válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false },
  });

  if (error) {
    // signInWithOtp devuelve error cuando el mail no existe (shouldCreateUser: false)
    return { error: "Ese mail no tiene acceso." };
  }

  return {};
}

export async function verifyOtp(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const token = formData.get("token");

  const emailParsed = emailSchema.safeParse(email);
  const tokenParsed = otpSchema.safeParse(token);

  if (!emailParsed.success || !tokenParsed.success) {
    return { error: "Código inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: emailParsed.data,
    token: tokenParsed.data,
    type: "email",
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("expired") ||
      error.message.toLowerCase().includes("invalid")
    ) {
      return { error: "El código venció o es incorrecto. Pedí uno nuevo." };
    }
    return { error: "No pudimos verificar el código. Intentá de nuevo." };
  }

  redirect("/inicio");
}
