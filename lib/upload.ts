import { createClient } from "@/lib/supabase/client";

const BUCKET = "portfolio";

/** Perkecil gambar di browser (maks 2000px, WebP) supaya website tetap ringan. */
async function compress(file: File, max = 2000, quality = 0.86): Promise<{ blob: Blob; ext: string }> {
  const passthrough = ["image/gif", "image/svg+xml"];
  if (passthrough.includes(file.type) || !file.type.startsWith("image/")) {
    return { blob: file, ext: file.name.split(".").pop() || "bin" };
  }
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.size > file.size) return { blob: file, ext: file.name.split(".").pop() || "jpg" };
    return { blob, ext: "webp" };
  } catch {
    return { blob: file, ext: file.name.split(".").pop() || "jpg" };
  }
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const supabase = createClient();
  const { blob, ext } = await compress(file);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: "31536000",
    contentType: blob.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Hapus file dari storage jika URL berasal dari bucket ini. */
export async function deleteImage(url?: string | null) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const path = decodeURIComponent(url.slice(i + marker.length));
  await createClient().storage.from(BUCKET).remove([path]);
}
