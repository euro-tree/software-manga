import ComicGrid from "@/components/ComicGrid";
import { comics } from "@/lib/library";
import Link from "next/link";

export default function LibraryPage() {
  return (
    <main className="library-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Panel home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>panel<span className="brand-period">.</span></span>
        </Link>
        <span className="header-note">YOUR PERSONAL LIBRARY</span>
      </header>

      <section className="library-intro">
        <p className="eyebrow">A good story is always close</p>
        <h1>Your library<span className="brand-period">.</span></h1>
        <p className="intro-copy">A home for the worlds you return to.</p>
      </section>

      <ComicGrid comics={comics} />
      <footer className="library-footer">
        <span>Made for the love of the page.</span>
        <span>{comics.length} {comics.length === 1 ? "story" : "stories"} on your shelf</span>
      </footer>
    </main>
  );
}
