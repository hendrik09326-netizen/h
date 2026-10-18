export type Layout = "carousel" | "grid" | "video" | "website";

export interface Profile {
  id: number;
  name: string;
  role: string | null;
  rotating_words: string[] | null;
  headline: string | null;
  bio: string | null;
  photo_url: string | null;
  location: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  linkedin: string | null;
  github: string | null;
  cv_url: string | null;
  available: boolean;
  accent_color: string | null;
}

export interface Field {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export interface Section {
  id: string;
  title: string;
  subtitle: string | null;
  layout: Layout;
  sort_order: number;
  visible: boolean;
}

export interface Work {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  meta: string | null;
  tags: string[];
  featured: boolean;
  visible: boolean;
  sort_order: number;
}

export const LAYOUT_LABEL: Record<Layout, string> = {
  carousel: "Galeri berjalan (carousel)",
  grid: "Grid",
  video: "Thumbnail video",
  website: "Mockup website",
};
