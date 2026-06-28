import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client — use inside "use client" components.
 * Call createClient() each time rather than sharing one instance,
 * so auth state is always fresh.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
