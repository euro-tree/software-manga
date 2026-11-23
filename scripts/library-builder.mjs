import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { imageSize } from "image-size";

const libraryDir = join(process.cwd(), "library");
const outputDir = join(process.cwd(), "public", "library");
const generatedDir = join(process.cwd(), "src", "generated");
const imagePattern = /\.(jpe?g|png|webp|gif|avif)$/i;
const naturalCompare = (a, b) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

function prettyTitle(slug) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
}

function publicPath(slug, filename) {
  return `/library/${encodeURIComponent(slug)}/${encodeURIComponent(filename)}`;
}

export async function buildLibrary() {
  await mkdir(libraryDir, { recursive: true });
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await mkdir(generatedDir, { recursive: true });
  const entries = await readdir(libraryDir, { withFileTypes: true });
  const comics = [];

  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => naturalCompare(a.name, b.name))) {
    const slug = entry.name;
    const sourceDir = join(libraryDir, slug);
    const files = await readdir(sourceDir, { withFileTypes: true });
    const imageFiles = files
      .filter((file) => file.isFile() && imagePattern.test(file.name))
      .map((file) => file.name)
      .sort(naturalCompare);
    const coverFile = imageFiles.find((file) => /^cover\.(jpe?g|png|webp|gif|avif)$/i.test(file));
    const pageFiles = imageFiles.filter((file) => file !== coverFile);
    const metadataFile = files.find((file) => file.isFile() && file.name.toLowerCase() === "comic.json");
    let metadata = {};

    if (metadataFile) {
      metadata = JSON.parse(await readFile(join(sourceDir, metadataFile.name), "utf8"));
      if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
        throw new Error(`Invalid comic metadata in ${slug}/comic.json: expected a JSON object`);
      }
    }

    const direction = metadata.direction ?? "ltr";
    if (direction !== "ltr" && direction !== "rtl") {
      throw new Error(`Invalid reading direction in ${slug}/comic.json: use "ltr" or "rtl"`);
    }

    const pages = [];
    for (const filename of pageFiles) {
      const dimensions = imageSize(await readFile(join(sourceDir, filename)));
      pages.push({
        src: publicPath(slug, filename),
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    const comicCover = coverFile ?? pageFiles[0];
    if (!comicCover) continue;

    const publicComicDir = join(outputDir, slug);
    await mkdir(publicComicDir, { recursive: true });
    for (const filename of imageFiles) {
      await cp(join(sourceDir, filename), join(publicComicDir, filename));
    }
    comics.push({
      slug,
      title: typeof metadata.title === "string" && metadata.title.trim() ? metadata.title : prettyTitle(slug),
      ...(typeof metadata.author === "string" && metadata.author.trim() ? { author: metadata.author } : {}),
      direction,
      cover: publicPath(slug, comicCover),
      pageCount: pages.length,
      pages,
    });
  }

  await writeFile(join(generatedDir, "library.json"), `${JSON.stringify(comics, null, 2)}\n`);
  console.log(`Built library index for ${comics.length} comic${comics.length === 1 ? "" : "s"}.`);
}
