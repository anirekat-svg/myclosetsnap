import { supabase } from "@/integrations/supabase/client";

// Create signed URLs in batch for clothing item image paths.
export async function signWardrobePaths(paths: string[], expiresInSec = 60 * 60 * 6) {
  if (paths.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.storage
    .from("wardrobe")
    .createSignedUrls(paths, expiresInSec);
  if (error) throw error;
  const out = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.signedUrl && row.path) out.set(row.path, row.signedUrl);
  }
  return out;
}
