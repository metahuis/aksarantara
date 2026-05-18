import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sharpPath = new URL('../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/lib/index.js', import.meta.url);
const sharp = (await import(sharpPath)).default;

const svg = readFileSync(join(__dirname, '../public/icon.svg'));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

await sharp(svg).resize(192, 192).png().toFile(join(iconsDir, 'icon-192.png'));
await sharp(svg).resize(512, 512).png().toFile(join(iconsDir, 'icon-512.png'));
await sharp(svg).resize(180, 180).png().toFile(join(__dirname, '../public/apple-touch-icon.png'));
await sharp(svg).resize(32, 32).png().toFile(join(__dirname, '../public/favicon.png'));

console.log('✓ icons/icon-192.png');
console.log('✓ icons/icon-512.png');
console.log('✓ apple-touch-icon.png');
console.log('✓ favicon.png');
