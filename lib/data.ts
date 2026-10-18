import { createPublicClient } from "@/lib/supabase/server";
import type { Field, Profile, Section, Work } from "@/lib/types";

export interface SiteData {
  profile: Profile | null;
  fields: Field[];
  sections: (Section & { works: Work[] })[];
}

export async function getSiteData(): Promise<SiteData> {
  const supabase = createPublicClient();
  const [p, f, s, w] = await Promise.all([
    supabase.from("profile").select("*").eq("id", 1).maybeSingle(),
    supabase.from("fields").select("*").order("sort_order"),
    supabase.from("sections").select("*").eq("visible", true).order("sort_order"),
    supabase.from("works").select("*").eq("visible", true).order("sort_order"),
  ]);

  const works = (w.data ?? []) as Work[];
  const sections = ((s.data ?? []) as Section[])
    .map((sec) => ({ ...sec, works: works.filter((x) => x.section_id === sec.id) }))
    .filter((sec) => sec.works.length > 0);

  return {
    profile: (p.data as Profile) ?? null,
    fields: (f.data ?? []) as Field[],
    sections,
  };
}
