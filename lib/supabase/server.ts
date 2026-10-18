import { createServerClient } from "@supabase/ssr";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Client dengan sesi login (untuk server action / cek admin). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* dipanggil dari Server Component — aman diabaikan */
          }
        },
      },
    }
  );
}

/** Client publik tanpa cookie — dipakai halaman portofolio agar bisa di-cache. */
export function createPublicClient() {
  return createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export function isAdminEmail(email?: string | null) {
  const admin = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (!admin) return true; // jika tidak diisi, keamanan bergantung pada RLS
  return !!email && email.toLowerCase() === admin;
}
