"use server";

import { revalidatePath } from "next/cache";
import { createClient, isAdminEmail } from "@/lib/supabase/server";

/** Dipanggil dashboard setiap kali data disimpan, agar halaman publik langsung ter-update. */
export async function refreshSite() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return { ok: false };
  revalidatePath("/");
  return { ok: true };
}
