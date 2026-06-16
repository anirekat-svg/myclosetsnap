import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · ClosetSnap" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const counts = useQuery({
    queryKey: ["profile", "counts"],
    queryFn: async () => {
      const [{ count: items }, { count: outfits }] = await Promise.all([
        supabase.from("clothing_items").select("id", { count: "exact", head: true }),
        supabase.from("outfits").select("id", { count: "exact", head: true }),
      ]);
      return { items: items ?? 0, outfits: outfits ?? 0 };
    },
  });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <main className="mx-auto max-w-md px-5 pt-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
        <h1 className="mt-2 font-display text-4xl">{user?.email}</h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-black/5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Items</p>
          <p className="mt-2 font-display text-4xl">{counts.data?.items ?? "—"}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-black/5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Outfits</p>
          <p className="mt-2 font-display text-4xl">{counts.data?.outfits ?? "—"}</p>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-primary p-6 text-primary-foreground">
        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60">
          Plus · coming soon
        </p>
        <p className="mt-2 font-display text-2xl">Unlimited closet & travel packing</p>
        <p className="mt-1 text-sm text-primary-foreground/70 text-pretty">
          Everyone gets the full experience while we test. €4.99/month later.
        </p>
      </section>

      <button
        onClick={signOut}
        className="mt-8 w-full rounded-xl border border-border bg-surface py-3 text-sm font-medium"
      >
        Sign out
      </button>
    </main>
  );
}
