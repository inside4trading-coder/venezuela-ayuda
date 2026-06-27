// Genera PNG e ICO desde los SVG fuente en public/.
// Se corre una vez tras tocar los SVGs: `node scripts/gen-icons.mjs`
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "public");

async function svgToPng(svgPath, outPath, size) {
  const svg = await readFile(svgPath);
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}x${size})`);
}

async function svgToPngRect(svgPath, outPath, w, h) {
  const svg = await readFile(svgPath);
  await sharp(svg, { density: 200 })
    .resize(w, h, { fit: "contain" })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`✓ ${outPath} (${w}x${h})`);
}

// PNGs para PWA + Apple
await svgToPng(`${root}/favicon.svg`, `${root}/icon-192.png`, 192);
await svgToPng(`${root}/favicon.svg`, `${root}/icon-512.png`, 512);
await svgToPng(`${root}/apple-touch-icon.svg`, `${root}/apple-touch-icon.png`, 180);

// OG image
await svgToPngRect(`${root}/og-image.svg`, `${root}/og-image.png`, 1200, 630);

// Favicon ICO (multi-size, 16+32+48 embebidos en un PNG dentro de ICO)
// Sharp no produce .ico nativo; generamos uno mínimo manual con PNG 32x32 envuelto en ICO header.
const png32 = await sharp(await readFile(`${root}/favicon.svg`), { density: 192 })
  .resize(32, 32, { fit: "contain" })
  .png({ compressionLevel: 9 })
  .toBuffer();

// ICO header: 6 bytes header + 16 bytes dir entry + PNG payload
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);   // reserved
header.writeUInt16LE(1, 2);   // type 1 = ICO
header.writeUInt16LE(1, 4);   // num images

const dir = Buffer.alloc(16);
dir.writeUInt8(32, 0);                  // width
dir.writeUInt8(32, 1);                  // height
dir.writeUInt8(0, 2);                   // color count
dir.writeUInt8(0, 3);                   // reserved
dir.writeUInt16LE(1, 4);                // color planes
dir.writeUInt16LE(32, 6);               // bits per pixel
dir.writeUInt32LE(png32.length, 8);     // size in bytes
dir.writeUInt32LE(22, 12);              // offset

await writeFile(`${root}/favicon.ico`, Buffer.concat([header, dir, png32]));
console.log(`✓ ${root}/favicon.ico (32x32 PNG embedded)`);

console.log("\nListo.");
