"use client";

import { useMemo, useState } from "react";
import ComicCard from "@/components/ComicCard";
import type { Comic } from "@/lib/library";

export default function ComicGrid({ comics }: { comics: Comic[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle
      ? comics.filter((comic) => comic.title.toLocaleLowerCase().includes(needle))
      : comics;
  }, [comics, query]);

  return (
    <>
      <div className="library-toolbar">
        <label className="search-field">
          <span className="sr-only">Search comics by title</span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="10.8" cy="10.8" r="6.8" />
            <path d="m16 16 5 5" />
          </svg>
          <input
            type="search"
            placeholder="Search your library"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" className="clear-search" onClick={() => setQuery("")} aria-label="Clear search">
              ×
            </button>
          )}
        </label>
        <span className="library-count">
          {filtered.length} {filtered.length === 1 ? "comic" : "comics"}
        </span>
      </div>

      {filtered.length > 0 ? (
        <div className="comic-grid">
          {filtered.map((comic) => <ComicCard key={comic.slug} comic={comic} />)}
        </div>
      ) : (
        <div className="empty-state">
          {comics.length === 0 ? (
            <>
              <span className="empty-icon" aria-hidden="true">▤</span>
              <h2>Your library is waiting</h2>
              <p>Add a folder to <code>library/</code> and rebuild to see your comics here.</p>
            </>
          ) : (
            <>
              <h2>No matches</h2>
              <p>Try another title or clear your search.</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
