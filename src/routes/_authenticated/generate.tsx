import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signWardrobePaths } from "@/lib/storage";
import { generateOutfit } from "@/lib/wardrobe.functions";
import { Sparkles } from "lucide-react";

const OCCASIONS = [
  { id: "work", label: "Work" },
  { id: "casual", label: "Casual" },
  { id: "date", label: "Date" },
  { id: "dinner", label: "Dinner" },
  { id: "travel", label: "Travel" },
] as const;

type Occasion = (typeof OCCASIONS)[number]["id"];

export const Route = createFileRoute("/_authenticated/generate")({
  head: () => ({ meta: [{ title: "Style · ClosetSnap" }] }),
  component: GeneratePage,
});

type Item = {
  id: string;
  category: string;
  name: string | null;
  color: string | null;
  image_path: string;
};

function GeneratePage() {
  const qc = useQueryClient();
  const generate = useServerFn(generateOutfit);
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [result, setResult] = useState<{
    title: string;
    notes: string;
    top_id: string | null;
    bottom_id: string | null;
    dress_id: string | null;
    shoes_id: string | null;
    outerwear_id: string | null;
  } | null>(null);

  const wardrobe = useQuery({
    queryKey: ["wardrobe", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clothing_items")
        .select("id, category, name, color, image_path");
      if (error) throw error;
      return data as Item[];
    },
  });

  const byId = useMemo(() => {
    const m = new Map<string, Item>();
    (wardrobe.data ?? []).forEach((i) => m.set(i.id, i));
    return m;
  }, [wardrobe.data]);

  const usedPaths = useMemo(() => {
    if (!result) return [];
    const ids = [result.top_id, result.bottom_id, result.dress_id, result.shoes_id, result.outerwear_id].filter(
      (x): x is string => !!x,
    );
    return ids.map((id) => byId.get(id)?.image_path).filter((p): p is string => !!p);
  }, [result, byId]);

  const signed = useQuery({
    queryKey: ["wardrobe", "signed", usedPaths.join("|")],
    enabled: usedPaths.length > 0,
    queryFn: () => signWardrobePaths(usedPaths),
  });

  const gen = useMutation({
    mutationFn: () => generate({ data: { occasion } }),
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["outfit", "latest"] });
      toast.success(data.title);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const slots: Array<["top" | "bottom" | "dress" | "shoes" | "outerwear", string]> = [
    ["top", "Top"],
    ["dress", "Dress"],
    ["bottom", "Bottom"],
    ["outerwear", "Outerwear"],
    ["shoes", "Shoes"],
  ];

  return (
    <main className="mx-auto max-w-md px-5 pt-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Style for</p>
        <h1 className="mt-2 font-display text-4xl">the occasion.</h1>
      </header>

      <section className="rounded-3xl bg-primary p-6 text-primary-foreground">
        <p className="font-display text-2xl">Pick a mood</p>
        <p className="mt-1 text-sm text-primary-foreground/70">
          We'll curate a complete look from your closet.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => {
            const active = occasion === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setOccasion(o.id)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "bg-background text-foreground"
                    : "border border-white/15 text-primary-foreground/80 hover:bg-white/10"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => gen.mutate()}
          disabled={gen.isPending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-background py-3 text-sm font-medium text-foreground disabled:opacity-60"
        >
          <Sparkles className="size-4" />
          {gen.isPending ? "Styling…" : "Generate outfit"}
        </button>
      </section>

      {result && (
        <section className="mt-8 rounded-3xl bg-surface p-4 ring-1 ring-black/5">
          <div className="px-2 pb-4">
            <p className="font-display text-3xl">{result.title}</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">{result.notes}</p>
          </div>

          <div className="space-y-2">
            {slots.map(([key, label]) => {
              const id = result[`${key}_id` as const];
              if (!id) return null;
              const item = byId.get(id);
              if (!item) return null;
              const url = signed.data?.get(item.image_path);
              const aspect = key === "shoes" ? "aspect-[2/1]" : "aspect-[4/3]";
              return (
                <div
                  key={key}
                  className={`relative ${aspect} overflow-hidden rounded-xl bg-stone-tint ring-1 ring-black/5`}
                >
                  {url && (
                    <img src={url} alt={item.name ?? label} className="size-full object-cover" />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {wardrobe.data && wardrobe.data.length < 2 && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Add a few more pieces to your closet first.
        </p>
      )}
    </main>
  );
}
