# Panel — your personal comics library

Panel is a static-export Next.js app for reading comics and manga stored as folders of images.

## Requirements

- Node.js 20.9 or later
- npm

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Next.js. The first run indexes the sample comics in `library/`.

To have comics re-indexed while you add or replace files, use:

```sh
npm run dev:watch
```

## Add a comic

Create a folder under `library/`, then add page images in reading order. Supported formats are JPG, JPEG, PNG, WebP, GIF, and AVIF.

```text
library/
  my-comic/
    001.jpg
    002.jpg
    cover.jpg
    comic.json
```

Pages are sorted naturally, so `2.jpg` comes before `10.jpg`. A `cover.*` image is optional; when present it is used for the library and detail-page cover, rather than as a reading page. Without one, the first sorted page is the cover.

`comic.json` is optional:

```json
{
  "title": "My Comic",
  "author": "A. Creator",
  "direction": "rtl"
}
```

`direction` can be `ltr` or `rtl` and defaults to `ltr`. Without a title, the folder name is prettified. After adding or changing a comic, run `npm run build` to generate the static site. During development, `npm run dev:watch` watches `library/` and refreshes the generated index.

## Build and serve the static site

```sh
npm run build
npx serve out
```

The static website is written to `out/`; it can also be hosted on any static file host. The generated index and copied images in `src/generated/` and `public/library/` are build products and are ignored by Git.

## Reader controls

- Arrow keys and page-edge clicks navigate; `Space` advances, `Shift+Space` goes back, and `Home`/`End` jump to the beginning/end.
- `+`, `-`, and `0` zoom in, zoom out, and reset. Drag to pan while zoomed; double-click/tap toggles zoom.
- `F` toggles fullscreen and `Esc` exits the reader.
- Reading mode, direction, fit, page progress, and thumbnail controls are available in the reader toolbar.

Reading progress, mode, and direction are saved per comic in this browser.
