import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const width = 360;
const height = 540;
const glyphs = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
};

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function pagePng(number, background, ink) {
  const pixels = Buffer.alloc((width * 3 + 1) * height, 255);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    pixels[row] = 0;
    for (let x = 0; x < width; x++) {
      const inset = x < 24 || x >= width - 24 || y < 24 || y >= height - 24;
      const color = inset ? [238, 230, 217] : background;
      const index = row + 1 + x * 3;
      pixels[index] = color[0];
      pixels[index + 1] = color[1];
      pixels[index + 2] = color[2];
    }
  }

  const text = String(number);
  const scale = 14;
  const textWidth = text.length * 6 * scale - scale;
  let startX = Math.floor((width - textWidth) / 2);
  for (const digit of text) {
    const glyph = glyphs[digit];
    glyph.forEach((line, glyphY) => {
      [...line].forEach((pixel, glyphX) => {
        if (pixel !== "1") return;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const x = startX + glyphX * scale + dx;
            const y = Math.floor(height / 2) - 7 * scale / 2 + glyphY * scale + dy;
            const index = y * (width * 3 + 1) + 1 + x * 3;
            pixels[index] = ink[0];
            pixels[index + 1] = ink[1];
            pixels[index + 2] = ink[2];
          }
        }
      });
    });
    startX += 6 * scale;
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const samples = [
  { slug: "starfall-chronicles", title: "Starfall Chronicles", author: "Mira Sol", direction: "ltr", color: [35, 54, 75], ink: [209, 157, 105] },
  { slug: "moonlit-garden", title: "Moonlit Garden", author: "Aki Mori", direction: "rtl", color: [50, 42, 63], ink: [226, 187, 205] },
];

for (const sample of samples) {
  const folder = join(process.cwd(), "library", sample.slug);
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, "comic.json"), `${JSON.stringify({ title: sample.title, author: sample.author, direction: sample.direction }, null, 2)}\n`);
  for (let page = 1; page <= 6; page++) {
    const name = String(page).padStart(3, "0");
    await writeFile(join(folder, `${name}.png`), pagePng(page, sample.color, sample.ink));
  }
}

console.log(`Created ${samples.length} sample comics with six placeholder pages each.`);
