import { notFound } from "next/navigation";
import Viewer from "@/components/Viewer/Viewer";
import { comics } from "@/lib/library";

export function generateStaticParams() {
  return comics.map((comic) => ({ slug: comic.slug }));
}

export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comic = comics.find((item) => item.slug === slug);
  if (!comic) notFound();

  return <Viewer key={comic.slug} comic={comic} />;
}
