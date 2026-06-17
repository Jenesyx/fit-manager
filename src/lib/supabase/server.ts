import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Server Supabase client (App Router). Reads/refreshes the session from cookies.
 * Use inside Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In Server Components `cookies()` is read-only; the middleware
          // refreshes the session, so swallowing here is safe.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* called from a Server Component — ignore */
          }
        },
      },
    },
  );
}

/**
 * Service-role client. Server-only. Bypasses RLS — use ONLY for trusted
 * admin operations (e.g. promoting the first admin). Never import client-side.
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}
