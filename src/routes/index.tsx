import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClosetSnap — Style the clothes you already own" },
      {
        name: "description",
        content:
          "Photograph your wardrobe once. Get AI-styled outfits for work, casual, date, dinner or travel — from clothes you already own.",
      },
      { property: "og:title", content: "ClosetSnap — Style the clothes you already own" },
      {
        property: "og:description",
        content: "Your wardrobe, styled by AI. No shopping required.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-foreground" />
          <span className="text-sm font-medium tracking-tight">ClosetSnap</span>
        </div>
        <Link
          to="/auth"
          className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-24 pb-12 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Your wardrobe · styled by AI
        </p>
        <h1 className="mt-6 font-display text-5xl leading-[1.05] sm:text-7xl text-balance">
          "I have nothing to wear"<br />
          <span className="italic text-muted-foreground">never again.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground">
          Photograph the clothes you already own. ClosetSnap styles outfits for work,
          casual, date night, dinner or travel — using your closet.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Link
            to="/auth"
            className="rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground"
          >
            Start your wardrobe
          </Link>
          <a
            href="#how"
            className="rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-medium"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-4xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { n: "01", t: "Snap your clothes", d: "Add photos of tops, bottoms, dresses and shoes. We categorize them automatically." },
            { n: "02", t: "Pick the occasion", d: "Work, casual, date, dinner or travel — your closet, the right outfit." },
            { n: "03", t: "Wear it", d: "Save the looks you love. Get a new daily edit every morning." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-surface p-6 ring-1 ring-black/5">
              <p className="font-display text-2xl italic text-muted-foreground">{s.n}</p>
              <h3 className="mt-3 text-base font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Made with care · ClosetSnap
      </footer>
    </main>
  );
}
