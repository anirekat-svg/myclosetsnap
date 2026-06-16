import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signWardrobePaths } from "@/lib/storage";
import { generateOutfit } from "@/lib/wardrobe.functions";
import { Shuffle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Today · ClosetSnap" }] }),
  component: HomePage,
});

type Item = {
  id: string;
  category: string;
  name: string | null;
  color: string | null;
  image_path: string;
};

type OutfitRow = {
  id: string;
  title: string | null;
  notes: string | null;
  occasion: string | null;
  top_id: string | null;
  bottom_id: string | null;
  dress_id: string | null;
  shoes_id: string | null;
  outerwear_id: string | null;
  created_at: string;
};

function dateLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function firstName(email: string | undefined) {
  if (!email) return "there";
  return email.split("@")[0].split(/[.\-_]/)[0].replace(/^\w/, (c) => c.toUpperCase());
}

function HomePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const generate = useServerFn(generateOutfit);

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

  const latest = useQuery({
    queryKey: ["outfit", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("outfits")
        .select(
          "id, title, notes, occasion, top_id, bottom_id, dress_id, shoes_id, outerwear_id, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as OutfitRow | null;
    },
  });

  const signed = useQuery({
    queryKey: ["wardrobe", "signed", wardrobe.data?.map((i) => i.image_path).join("|")],
    enabled: !!wardrobe.data && wardrobe.data.length > 0,
    queryFn: async () => signWardrobePaths(wardrobe.data!.map((i) => i.image_path)),
  });

  const byId = useMemo(() => {
    const m = new Map<string, Item>();
    (wardrobe.data ?? []).forEach((i) => m.set(i.id, i));
    return m;
  }, [wardrobe.data]);

  const gen = useMutation({
    mutationFn: () => generate({ data: { occasion: "daily" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["outfit", "latest"] });
      toast.success("Fresh outfit ready");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const slots = ["top", "bottom", "dress", "shoes", "outerwear"] as const;
  const outfitItems = latest.data
    ? slots
        .map((s) => {
          const id = latest.data![`${s}_id` as const];
          return id ? byId.get(id) ?? null : null;
        })
        .filter((x): x is Item => x !== null)
    : [];

  const empty = wardrobe.data && wardrobe.data.length === 0;

  return (
    <main className="mx-auto max-w-md px-5 pt-8">
      <header className="flex items-end justify-between pb-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{dateLabel()}</p>
          <h1 className="font-display text-4xl leading-tight">
            Good morning, {firstName(user?.email)}
          </h1>
        </div>
      </header>

      {empty ? (
        <EmptyState />
      ) : (
        <section className="mb-10">
          <div className="rounded-3xl bg-surface p-4 ring-1 ring-black/5">
            <div className="flex items-center justify-between px-1 pb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Daily selection
              </h2>
              {latest.data?.occasion && (
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  {latest.data.occasion}
                </span>
              )}
            </div>

            {latest.isLoading ? (
              <SkeletonOutfit />
            ) : latest.data && outfitItems.length > 0 ? (
              <div className="space-y-2">
                {outfitItems.map((it) => (
                  <OutfitTile key={it.id} item={it} signed={signed.data?.get(it.image_path)} />
                ))}
                {latest.data.title && (
                  <div className="px-2 pt-3">
                    <p className="font-display text-2xl">{latest.data.title}</p>
                    {latest.data.notes && (
                      <p className="mt-1 text-sm text-muted-foreground text-pretty">
                        {latest.data.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-stone-tint p-8 text-center">
                <Sparkles className="mx-auto mb-3 size-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No outfit yet. Generate today's edit from your closet.
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => gen.mutate()}
                disabled={gen.isPending}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {gen.isPending ? "Styling…" : latest.data ? "Generate another" : "Generate today's edit"}
              </button>
              <button
                onClick={() => gen.mutate()}
                disabled={gen.isPending}
                aria-label="Shuffle"
                className="rounded-xl border border-border bg-stone-tint px-4 text-muted-foreground"
              >
                <Shuffle className="size-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Your archive</h2>
          <Link to="/closet" className="text-xs underline underline-offset-4 text-muted-foreground">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(wardrobe.data ?? []).slice(0, 6).map((it) => (
            <Link
              key={it.id}
              to="/closet"
              className="aspect-square overflow-hidden rounded-xl bg-stone-tint ring-1 ring-black/5"
            >
              {signed.data?.get(it.image_path) ? (
                <img
                  src={signed.data.get(it.image_path)}
                  alt={it.name ?? it.category}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </Link>
          ))}
          {wardrobe.data && wardrobe.data.length === 0 && (
            <Link
              to="/add"
              className="col-span-3 grid h-32 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground"
            >
              + Add your first piece
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <section className="mb-10 rounded-3xl bg-surface p-8 text-center ring-1 ring-black/5">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Step one</p>
      <h2 className="mt-3 font-display text-3xl">Build your closet</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground text-pretty">
        Snap a few photos of pieces you wear often. We'll categorize them and start styling.
      </p>
      <Link
        to="/add"
        className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Add clothes
      </Link>
    </section>
  );
}

function OutfitTile({ item, signed }: { item: Item; signed: string | undefined }) {
  const aspect =
    item.category === "shoes" ? "aspect-[2/1]" : item.category === "accessory" ? "aspect-[3/2]" : "aspect-[4/3]";
  return (
    <div
      className={`relative ${aspect} overflow-hidden rounded-xl bg-stone-tint ring-1 ring-black/5`}
    >
      {signed && (
        <img src={signed} alt={item.name ?? item.category} className="size-full object-cover" />
      )}
      <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
        {item.category}
      </span>
    </div>
  );
}

function SkeletonOutfit() {
  return (
    <div className="space-y-2">
      <div className="aspect-[4/3] animate-pulse rounded-xl bg-stone-tint" />
      <div className="aspect-[4/3] animate-pulse rounded-xl bg-stone-tint" />
      <div className="aspect-[2/1] animate-pulse rounded-xl bg-stone-tint" />
    </div>
  );
}
