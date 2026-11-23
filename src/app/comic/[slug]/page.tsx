import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { comics, readerHref } from "@/lib/library";
import ComicDetailActions from "./ComicDetailActions";

export function generateStaticParams() {
  return comics.map((comic) => ({ slug: comic.slug }));
}

export default async function ComicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comic = comics.find((item) => item.slug === slug);
  if (!comic) notFound();

  return (
    <main className="detail-shell">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Panel home">
          <span className="brand-mark" aria-hidden="true">P</span>
          <span>panel<span className="brand-period">.</span></span>
        </Link>
        <Link className="back-link" href="/">← <span>Library</span></Link>
      </header>

      <section className="detail-hero">
        <div className="detail-cover">
          <Image
            src={comic.cover}
            alt={`Cover of ${comic.title}`}
            fill
            priority
            sizes="(max-width: 640px) 42vw, 220px"
            className="cover-image"
          />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">YOUR NEXT ADVENTURE</p>
          <h1>{comic.title}</h1>
          {comic.author && <p className="detail-author">by {comic.author}</p>}
          <p className="detail-meta">
            <span>{comic.pageCount} pages</span>
            <span className="meta-dot" aria-hidden="true">·</span>
            <span>{comic.direction === "rtl" ? "Right to left" : "Left to right"}</span>
          </p>
          <ComicDetailActions comic={comic} />
        </div>
      </section>

      <section className="pages-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE STORY</p>
            <h2>All pages <span className="muted-count">({comic.pageCount})</span></h2>
          </div>
          <Link className="text-link" href={readerHref(comic.slug)}>Open reader <span aria-hidden="true">↗</span></Link>
        </div>
        {comic.pages.length ? (
          <div className="page-grid">
            {comic.pages.map((page, index) => (
              <Link
                className="page-thumb"
                href={readerHref(comic.slug, index + 1)}
                key={page.src}
                aria-label={`Read page ${index + 1}`}
              >
                <Image
                  src={page.src}
                  alt={`Page ${index + 1}`}
                  width={page.width}
                  height={page.height}
                  sizes="(max-width: 540px) 28vw, (max-width: 900px) 20vw, 150px"
                  loading="lazy"
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty-pages">This comic has a cover but no reading pages yet.</p>
        )}
      </section>
    </main>
  );
}
