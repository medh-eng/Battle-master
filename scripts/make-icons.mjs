#!/usr/bin/env node
/* Builds the app and browser icons from art/source/ui/icon.png (Pon's painted bell emblem).
   Usage: node scripts/make-icons.mjs   (npm run assets does not call it: icons change rarely) */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const src = `${root}art/source/ui/icon.png`, out = `${root}public/icons`;
mkdirSync(out, { recursive: true });
const sq = (n, file) => sharp(src).resize(n, n).png({ compressionLevel: 9 }).toFile(`${out}/${file}`);
await Promise.all([sq(32, 'favicon-32.png'), sq(48, 'favicon-48.png'), sq(180, 'apple-touch-icon.png'), sq(192, 'icon-192.png'), sq(512, 'icon-512.png')]);
// maskable: Android crops to a circle, so keep the emblem inside the central 80%
const inner = await sharp(src).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#1c2a45' } }).composite([{ input: inner, gravity: 'centre' }]).png().toFile(`${out}/icon-maskable-512.png`);
console.log('icons written');
