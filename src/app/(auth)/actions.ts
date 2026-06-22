"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-Mail oder Passwort ist falsch.";
  if (m.includes("email not confirmed"))
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Diese E-Mail-Adresse ist bereits registriert.";
  if (m.includes("password should be at least"))
    return "Das Passwort muss mindestens 6 Zeichen lang sein.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "Bitte gib eine gültige E-Mail-Adresse ein.";
  if (m.includes("rate limit"))
    return "Zu viele Versuche. Bitte versuche es später erneut.";
  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const weiter = String(formData.get("weiter") ?? "");

  console.log("[signIn] attempt", { email, weiter });
  console.log("[signIn] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("[signIn] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!email || !password) return { error: "Bitte fülle alle Felder aus." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[signIn] Supabase error:", error.message, error.status, error.code);
    return { error: `${translateAuthError(error.message)} [DEBUG: ${error.message}]` };
  }

  console.log("[signIn] success, redirecting to", weiter || "/portal/dashboard");
  redirect(weiter && weiter.startsWith("/portal") ? weiter : "/portal/dashboard");
}

export async function signUpAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  console.log("[signUp] attempt", { email, fullName });
  console.log("[signUp] emailRedirectTo:", redirectTo);
  console.log("[signUp] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!fullName || !email || !password)
    return { error: "Bitte fülle alle Felder aus." };
  if (password.length < 6)
    return { error: "Das Passwort muss mindestens 6 Zeichen lang sein." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    console.error("[signUp] Supabase error:", error.message, error.status, error.code);
    return { error: `${translateAuthError(error.message)} [DEBUG: ${error.message}]` };
  }

  console.log("[signUp] success. session:", !!data.session, "user:", data.user?.id);

  // If confirmations are off, a session is returned → go straight to the portal.
  if (data.session) redirect("/portal/dashboard");

  return {
    message:
      "Fast geschafft! Wir haben dir eine E-Mail zur Bestätigung geschickt.",
  };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Bitte gib deine E-Mail-Adresse ein." };

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  console.log("[resetPassword] attempt", { email });
  console.log("[resetPassword] redirectTo:", redirectTo);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("[resetPassword] Supabase error:", error.message, error.status, error.code);
    return { error: `${translateAuthError(error.message)} [DEBUG: ${error.message}]` };
  }

  console.log("[resetPassword] email sent successfully");
  return {
    message:
      "Wenn ein Konto existiert, haben wir dir einen Link zum Zurücksetzen geschickt.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
