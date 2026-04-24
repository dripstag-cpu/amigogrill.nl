// One-off image resizer — run with: node tools/resize-images.mjs
// Uses sharp. Writes into assets/images/ overwriting the originals
// so existing <img src="..."> paths keep working.

import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'assets/images');

// Max intrinsic width we need (2x retina for the largest display size)
const JOBS = [
  // { file, maxWidth, quality (for webp), format }
  { file: 'logo-full.png',                 maxWidth: 240, format: 'png'  },
  { file: 'tablegrill-steak-smoke.webp',   maxWidth: 1600, quality: 78, format: 'webp' },
  { file: 'parrillada-royale.webp',        maxWidth: 1400, quality: 78, format: 'webp' },
  { file: 'grill-tang-vlees.webp',         maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'tafel-parrillada-topdown.webp', maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'westerkerk-view.webp',          maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'terras-gracht-wijnglas.webp',   maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'terras-bife-dag.webp',          maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'parrillada-closeup-heineken.webp', maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'parrillada-gambas-ribs.webp',   maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'mixed-grill.webp',              maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'groep-diner-parrillada.webp',   maxWidth: 900, quality: 78, format: 'webp' },
  { file: 'groep-voetbal-zaal.webp',       maxWidth: 900, quality: 78, format: 'webp' },
  { file: 'interior-stier-muurschildering.webp', maxWidth: 1200, quality: 78, format: 'webp' },
  { file: 'wine-misterio.webp',            maxWidth: 1200, quality: 78, format: 'webp' },
];

let totalBefore = 0;
let totalAfter = 0;

for (const job of JOBS) {
  const p = path.join(ROOT, job.file);
  try {
    const before = await readFile(p);
    const meta = await sharp(before).metadata();
    const needsResize = meta.width > job.maxWidth;
    if (!needsResize) {
      console.log(`SKIP  ${job.file}  (${meta.width}px already <= ${job.maxWidth}px)`);
      totalBefore += before.length;
      totalAfter += before.length;
      continue;
    }

    let pipeline = sharp(before).resize({ width: job.maxWidth, withoutEnlargement: true });
    if (job.format === 'webp') {
      pipeline = pipeline.webp({ quality: job.quality, effort: 6 });
    } else if (job.format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    }
    const out = await pipeline.toBuffer();
    await writeFile(p, out);
    const saved = before.length - out.length;
    totalBefore += before.length;
    totalAfter += out.length;
    console.log(
      `OK    ${job.file.padEnd(44)} ` +
      `${(before.length/1024).toFixed(0).padStart(4)} KB → ${(out.length/1024).toFixed(0).padStart(4)} KB ` +
      `(-${(saved/1024).toFixed(0)} KB, ${meta.width}px → ${job.maxWidth}px)`
    );
  } catch (e) {
    console.error(`FAIL  ${job.file}: ${e.message}`);
  }
}

console.log('');
console.log(`Totaal: ${(totalBefore/1024).toFixed(0)} KB → ${(totalAfter/1024).toFixed(0)} KB ` +
            `(-${((totalBefore - totalAfter)/1024).toFixed(0)} KB besparing)`);
