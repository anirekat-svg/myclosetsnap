import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeClothing } from "@/lib/wardrobe.functions";

export const Route = createFileRoute("/_authenticated/add")({
  head: () => ({ meta: [{ title: "Add clothes · ClosetSnap" }] }),
  component: AddPage,
});

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function AddPage() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const analyze = useServerFn(analyzeClothing);
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB");
      return;
    }
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    try {
      setStatus("Analyzing…");
      const base64 = await fileToBase64(file);
      const analysis = await analyze({ data: { imageBase64: base64, mimeType: file.type } });

      setStatus("Uploading…");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("wardrobe")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("wardrobe").getPublicUrl(path);

      setStatus("Saving…");
      const { error: insErr } = await supabase.from("clothing_items").insert({
        user_id: user!.id,
        image_path: path,
        image_url: pub.publicUrl,
        category: analysis.category,
        name: analysis.name,
        color: analysis.color,
        description: analysis.description,
        seasons: analysis.seasons,
      });
      if (insErr) throw insErr;

      toast.success(`Added: ${analysis.name}`);
      navigate({ to: "/closet" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add item");
      setBusy(false);
      setPreview(null);
      setStatus("");
    }
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">New piece</p>
        <h1 className="mt-2 font-display text-4xl">Add to your closet</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          Take a clean photo on a plain background. We'll categorize and tag it for you.
        </p>
      </header>

      <div className="rounded-3xl bg-surface p-4 ring-1 ring-black/5">
        <div
          onClick={() => !busy && fileInput.current?.click()}
          className="relative grid aspect-[4/5] cursor-pointer place-items-center overflow-hidden rounded-2xl bg-stone-tint ring-1 ring-black/5"
        >
          {preview ? (
            <img src={preview} alt="Selected" className="size-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Camera className="size-8" strokeWidth={1.4} />
              <p className="text-sm">Tap to choose a photo</p>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-foreground">
                <Loader2 className="size-5 animate-spin" />
                <p className="text-sm">{status}</p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <button
          onClick={() => !busy && fileInput.current?.click()}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? status || "Working…" : "Choose photo"}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Best results: one item per photo, plain background, good light.
      </p>
    </main>
  );
}
