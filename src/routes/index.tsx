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

      <section id="how" className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">How it works</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Snap your clothes",
              d: "Take quick photos of each item — tops, bottoms, dresses, shoes, jackets. Our AI automatically tags the category, color, and season so everything stays organized without you typing a thing.",
              bullets: ["Works with any phone camera", "Auto-removes messy backgrounds", "Organized by category and color"],
            },
            {
              n: "02",
              t: "Pick the occasion",
              d: "Tell us where you're going — work, casual day out, date night, dinner with friends, or a weekend trip. ClosetSnap mixes and matches pieces you already own into a complete outfit.",
              bullets: ["Smart outfit pairing from your closet", "Matches weather and season", "Suggests shoes and accessories"],
            },
            {
              n: "03",
              t: "Wear it",
              d: "Save the outfits you love to your favorites. Wake up to a fresh daily suggestion every morning, so you spend less time deciding and more time feeling confident.",
              bullets: ["Save favorites for one-tap access", "Daily outfit drop each morning", "Track what you actually wore"],
            },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl bg-surface p-7 ring-1 ring-black/5">
              <p className="font-display text-2xl text-muted-foreground">{s.n}</p>
              <h3 className="mt-3 text-base font-semibold">{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">{s.d}</p>
              <ul className="mt-5 space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 block size-1 rounded-full bg-foreground/40" />
                    <span className="text-pretty">{b}</span>
                  </li>
                ))}
              </ul>
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
