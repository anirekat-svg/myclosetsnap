import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signWardrobePaths } from "@/lib/storage";
import { Trash2 } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "top", label: "Tops" },
  { id: "bottom", label: "Bottoms" },
  { id: "dress", label: "Dresses" },
  { id: "outerwear", label: "Outerwear" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
] as const;

export const Route = createFileRoute("/_authenticated/closet")({
  head: () => ({ meta: [{ title: "Closet · ClosetSnap" }] }),
  component: ClosetPage,
});

type Item = {
  id: string;
  category: string;
  name: string | null;
  color: string | null;
  image_path: string;
};

function ClosetPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const wardrobe = useQuery({
    queryKey: ["wardrobe", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clothing_items")
        .select("id, category, name, color, image_path")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Item[];
    },
  });

  const signed = useQuery({
    queryKey: ["wardrobe", "signed", wardrobe.data?.map((i) => i.image_path).join("|")],
    enabled: !!wardrobe.data && wardrobe.data.length > 0,
    queryFn: async () => signWardrobePaths(wardrobe.data!.map((i) => i.image_path)),
  });

  const del = useMutation({
    mutationFn: async (item: Item) => {
      await supabase.storage.from("wardrobe").remove([item.image_path]);
      const { error } = await supabase.from("clothing_items").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["wardrobe", "all"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = (wardrobe.data ?? []).filter((i) => filter === "all" || i.category === filter);

  return (
    <main className="mx-auto max-w-md px-5 pt-8">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-4xl">Your archive</h1>
        <Link to="/add" className="text-sm text-muted-foreground underline underline-offset-4">
          Add new
        </Link>
      </header>

      <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-2 no-scrollbar">
        {CATEGORIES.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium ring-1 ${
                active
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "bg-stone-tint text-muted-foreground ring-black/5"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {wardrobe.isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-stone-tint" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-surface p-10 text-center ring-1 ring-black/5">
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          <Link
            to="/add"
            className="mt-4 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Add a piece
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((it) => (
            <div key={it.id} className="space-y-2">
              <div className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-tint ring-1 ring-black/5">
                {signed.data?.get(it.image_path) && (
                  <img
                    src={signed.data.get(it.image_path)}
                    alt={it.name ?? it.category}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                )}
                <button
                  onClick={() => {
                    if (confirm("Remove this item?")) del.mutate(it);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-background/85 p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="px-1">
                <p className="truncate text-xs font-medium">{it.name ?? "Untitled"}</p>
                <p className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                  {it.color ?? it.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
