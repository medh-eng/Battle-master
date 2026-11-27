/* ============================================================
   Card painter. Each card face and board token is painted once on
   a 2D canvas — thin edge, full-width painting, cost coin,
   name ribbon, palm-leaf text, stat badges — then handed to Pixi
   as a single texture. Painted at 2× for sharpness.
   ============================================================ */
import { Texture } from 'pixi.js';
import { CARDS, type CardDef, type EmpireId } from '../../engine';
import { artImage, hasArt, whenArt } from '../../assets/manifest';
import { EMPIRE_STYLE } from '../theme';

const TITLE = "'Cinzel', Georgia, serif";
const BODY = "'Alegreya Sans', 'Trebuchet MS', sans-serif";

/** card face, in canvas pixels (displayed at half size: 240×336) */
export const FACE_W = 480, FACE_H = 672;
/** board token, in canvas pixels (displayed at half size: 170×210) */
export const TOKEN_W = 340, TOKEN_H = 420;

/** a painting that exists but has not loaded yet: draw a placeholder now, but do not keep it */
const notReady = (id: string) => hasArt(id) && !artImage(id);

/** a face drawn with a placeholder is repainted in place the moment its painting arrives */
function healLater(id: string, cv: HTMLCanvasElement, t: Texture, redraw: () => Texture): void {
  whenArt(id, () => {
    const fresh = redraw().source.resource as CanvasImageSource;
    const g = cv.getContext('2d')!;
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(fresh, 0, 0);
    t.source.update();
  });
}

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
function shade(n: number, f: number): string {
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
}

/* ---------- materials: the frame each empire is carved from ---------- */
function material(g: CanvasRenderingContext2D, empire: EmpireId, w: number, h: number, gilded = false): void {
  const st = gilded ? { ...EMPIRE_STYLE[empire], frame: 0xd8aa3a, frameLight: 0xf8e08e } : EMPIRE_STYLE[empire];
  const lin = g.createLinearGradient(0, 0, w, h);
  const metal = gilded || empire === 'gupta' || empire === 'chola' || empire === 'rajput';
  if (metal) {
    // polished metal: bright bands
    lin.addColorStop(0, shade(st.frameLight, 1.05));
    lin.addColorStop(0.25, hex(st.frame));
    lin.addColorStop(0.45, shade(st.frameLight, 1.1));
    lin.addColorStop(0.7, shade(st.frame, 0.75));
    lin.addColorStop(1, shade(st.frameLight, 0.95));
  } else {
    lin.addColorStop(0, hex(st.frameLight));
    lin.addColorStop(0.55, hex(st.frame));
    lin.addColorStop(1, shade(st.frame, 0.72));
  }
  g.fillStyle = lin;
  g.fill();
  // grain or stone speckle
  g.save(); g.clip();
  let seed = empire.length * 977;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const n = metal ? 300 : 2600;
  for (let i = 0; i < n; i++) {
    g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
    const s = metal ? 1 : 1 + rnd() * 2.2;
    if (metal) g.fillRect(rnd() * w, rnd() * h, 40 + rnd() * 120, s);
    else g.fillRect(rnd() * w, rnd() * h, s, s);
  }
  g.restore();
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath(); g.roundRect(x, y, w, h, r);
}

/** the painting's window: a plain rounded rectangle, so no arch ever covers the art */
function archPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  g.beginPath(); g.roundRect(x, y, w, h, 14);
}

/** the painting a placeholder can borrow: a hybrid shows its two parents side by side until its own art arrives */
const PARENT_ART: Record<string, string> = { sword: 'sword1', spear: 'spear1', rider: 'rider1', bow: 'bow1' };
const EMBLEM: Record<string, string> = { sword: '⚔', spear: '↟', rider: '♞', bow: '➶', levy: '⚑', fort: '♜' };
function drawArt(g: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number, focusY = 0.38): void {
  const img = artImage(id);
  if (!img) {
    const c = CARDS[id];
    const fam = c?.family ?? '';
    if (fam.startsWith('hybrid:')) {
      const [a, b] = fam.slice(7).split('+').map(f => artImage(PARENT_ART[f]));
      if (a && b) {
        // two parents, split on a diagonal, until the hybrid's own painting arrives
        [a, b].forEach((im, k) => {
          g.save(); g.beginPath();
          if (k === 0) { g.moveTo(x, y); g.lineTo(x + w * 0.62, y); g.lineTo(x + w * 0.38, y + h); g.lineTo(x, y + h); }
          else { g.moveTo(x + w * 0.62, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x + w * 0.38, y + h); }
          g.closePath(); g.clip();
          const sc = Math.max(w / im.width, h / im.height), dw = im.width * sc, dh = im.height * sc;
          g.drawImage(im, x + (w - dw) / 2 + (k === 0 ? -w * 0.18 : w * 0.18), y - (dh - h) * focusY, dw, dh);
          g.restore();
        });
        g.strokeStyle = 'rgba(231,196,110,0.9)'; g.lineWidth = 5;
        g.beginPath(); g.moveTo(x + w * 0.62, y); g.lineTo(x + w * 0.38, y + h); g.stroke();
        return;
      }
    }
    const bg = g.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, '#e8d6ad'); bg.addColorStop(1, '#b89a63');
    g.fillStyle = bg; g.fillRect(x, y, w, h);
    // woodcut hatching
    g.strokeStyle = 'rgba(61,90,128,0.18)'; g.lineWidth = 2;
    for (let k = -h; k < w; k += 14) { g.beginPath(); g.moveTo(x + k, y + h); g.lineTo(x + k + h * 0.6, y); g.stroke(); }
    const glyph = EMBLEM[fam] ?? (c?.type === 'unit' ? '⚔' : '✦');
    g.fillStyle = 'rgba(37,52,78,0.85)';
    g.font = `${Math.round(h * 0.4)}px ${TITLE}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(glyph, x + w / 2, y + h * 0.5);
    return;
  }
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  const dx = x + (w - dw) / 2;
  const dy = y - Math.max(0, Math.min(dh - h, (dh - h) * focusY));
  g.drawImage(img, dx, dy, dw, dh);
}

function coin(g: CanvasRenderingContext2D, x: number, y: number, r: number, label: string, kind: 'gold' | 'bronze' | 'cheaper'): void {
  const rad = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  if (kind === 'cheaper') { rad.addColorStop(0, '#eaffd0'); rad.addColorStop(0.45, '#7fc65a'); rad.addColorStop(1, '#2f6a1c'); }
  else if (kind === 'gold') { rad.addColorStop(0, '#fff2c4'); rad.addColorStop(0.45, '#e2b14e'); rad.addColorStop(1, '#8a5a17'); }
  else { rad.addColorStop(0, '#d9a77a'); rad.addColorStop(0.5, '#7a4a28'); rad.addColorStop(1, '#3a1f0f'); }
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = rad; g.fill();
  g.lineWidth = 3; g.strokeStyle = 'rgba(40,20,5,0.8)'; g.stroke();
  g.beginPath(); g.arc(x, y, r - 7, 0, Math.PI * 2);
  g.lineWidth = 1.5; g.strokeStyle = kind === 'gold' ? 'rgba(120,70,10,0.6)' : 'rgba(255,220,180,0.35)'; g.stroke();
  // the bronze coin (Supply to advance or attack) carries a sword, so it is not mistaken for the gold cost coin
  if (kind === 'bronze') {
    g.save(); g.translate(x, y); g.rotate(-Math.PI / 4);
    g.fillStyle = 'rgba(255,214,160,0.5)';
    g.beginPath(); g.moveTo(-r * 0.12, r * 0.42); g.lineTo(-r * 0.12, -r * 0.62); g.lineTo(0, -r * 0.86); g.lineTo(r * 0.12, -r * 0.62); g.lineTo(r * 0.12, r * 0.42); g.closePath(); g.fill();
    g.fillRect(-r * 0.4, r * 0.42, r * 0.8, r * 0.13);
    g.fillRect(-r * 0.08, r * 0.55, r * 0.16, r * 0.26);
    g.restore();
  }
  g.font = `700 ${Math.round(r * 1.42)}px ${TITLE}`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // bold numerals with a contrasting rim, readable on a small phone
  g.lineJoin = 'round'; g.lineWidth = Math.max(3, r * 0.12);
  g.strokeStyle = kind === 'bronze' ? 'rgba(30,12,2,0.9)' : 'rgba(255,240,200,0.7)';
  g.strokeText(label, x, y + r * 0.08);
  g.fillStyle = kind === 'bronze' ? '#fff3dc' : '#1e0f03';
  g.fillText(label, x, y + r * 0.08);
}

/** keyword badges: Guard (shield), Swift (lightning bolt), Ranged (bow). One drawing for tokens, hand cards and big cards. */
export type KwKind = 'raksha' | 'veg' | 'ranged';
export function kwBadge(g: CanvasRenderingContext2D, kind: KwKind, x: number, y: number, r: number): void {
  const col = kind === 'raksha' ? '#dfe6ee' : kind === 'veg' ? '#ffd23f' : '#9be08a';
  const fill = kind === 'raksha' ? '#26303f' : kind === 'veg' ? '#5a2a06' : '#16301a';
  g.save(); g.translate(x, y);
  g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
  g.lineWidth = r * 0.14; g.strokeStyle = col; g.stroke();
  g.beginPath(); g.arc(0, 0, r + r * 0.12, 0, Math.PI * 2); g.lineWidth = r * 0.08; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.stroke();
  const u = r / 20;
  g.fillStyle = col; g.strokeStyle = col; g.lineJoin = 'round'; g.lineCap = 'round';
  if (kind === 'raksha') {
    g.beginPath(); g.moveTo(-10 * u, -11 * u); g.quadraticCurveTo(0, -15 * u, 10 * u, -11 * u); g.lineTo(9 * u, 2 * u);
    g.quadraticCurveTo(5 * u, 11 * u, 0, 14 * u); g.quadraticCurveTo(-5 * u, 11 * u, -9 * u, 2 * u); g.closePath(); g.fill();
    g.fillStyle = fill; g.fillRect(-1.5 * u, -8 * u, 3 * u, 17 * u);
  } else if (kind === 'veg') {
    // a bold lightning bolt, with two speed lines behind it
    g.beginPath(); g.moveTo(5 * u, -15 * u); g.lineTo(-8 * u, 3 * u); g.lineTo(-1 * u, 3 * u); g.lineTo(-5 * u, 15 * u); g.lineTo(9 * u, -4 * u); g.lineTo(2 * u, -4 * u); g.closePath(); g.fill();
    g.lineWidth = 2.2 * u; g.beginPath(); g.moveTo(-14 * u, -7 * u); g.lineTo(-9 * u, -7 * u); g.moveTo(-15 * u, 0); g.lineTo(-11 * u, 0); g.stroke();
  } else {
    g.lineWidth = 3 * u; g.beginPath(); g.arc(-4 * u, 0, 12 * u, -Math.PI * 0.42, Math.PI * 0.42); g.stroke();
    g.lineWidth = 2.4 * u; g.beginPath(); g.moveTo(-11 * u, 0); g.lineTo(13 * u, 0); g.stroke();
    g.beginPath(); g.moveTo(14 * u, 0); g.lineTo(7 * u, -5 * u); g.lineTo(7 * u, 5 * u); g.closePath(); g.fill();
  }
  g.restore();
}

/** attack (vermilion, blade) and defence (lapis, shield) badges */
export function statBadge(g: CanvasRenderingContext2D, x: number, y: number, r: number, kind: 'atk' | 'hp', label?: string): void {
  g.save();
  g.translate(x, y);
  g.beginPath();
  if (kind === 'atk') {
    // diamond, like a spear head
    g.moveTo(0, -r * 1.1); g.lineTo(r, 0); g.lineTo(0, r * 1.1); g.lineTo(-r, 0); g.closePath();
  } else {
    // shield
    g.moveTo(-r, -r * 0.8); g.quadraticCurveTo(0, -r * 1.15, r, -r * 0.8);
    g.lineTo(r * 0.92, r * 0.1); g.quadraticCurveTo(r * 0.6, r * 0.85, 0, r * 1.1);
    g.quadraticCurveTo(-r * 0.6, r * 0.85, -r * 0.92, r * 0.1); g.closePath();
  }
  const rad = g.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.2);
  if (kind === 'atk') { rad.addColorStop(0, '#f08a5d'); rad.addColorStop(1, '#7a1a0c'); }
  else { rad.addColorStop(0, '#7fa6dd'); rad.addColorStop(1, '#16305e'); }
  g.fillStyle = rad; g.fill();
  g.lineWidth = 4; g.strokeStyle = '#f0d79a'; g.stroke();
  if (label !== undefined) {
    g.fillStyle = '#fff';
    g.font = `700 ${Math.round(r * 1.5)}px ${TITLE}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = Math.max(4, r * 0.16); g.strokeStyle = 'rgba(10,4,0,0.95)';
    g.strokeText(label, 0, r * 0.08);
    g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = 6;
    g.fillText(label, 0, r * 0.08);
  }
  g.restore();
}

const RARITY = { common: ['#c08a4a', '#5a3614'], rare: ['#eef3f8', '#6d7c8c'], epic: ['#ffe28a', '#a06a08'], legendary: ['#ff7a8a', '#8a0f22'] } as const;
function gem(g: CanvasRenderingContext2D, x: number, y: number, r: number, rarity: CardDef['rarity']): void {
  const [a, b] = RARITY[rarity ?? 'common'];
  const rad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  rad.addColorStop(0, a); rad.addColorStop(1, b);
  g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r * 0.8, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.8, y); g.closePath();
  g.fillStyle = rad; g.fill();
  g.lineWidth = 2; g.strokeStyle = 'rgba(30,15,5,0.8)'; g.stroke();
}

const KEYWORD = /^(Guard|Deploy|Swift|Charges|Tramples|Trample|Morale|Trap)([.,:;]?)$/;
/** rules text with its keywords in bold bronze-gold; `font` is the plain weight and size, e.g. "500 27px" */
function wrapRich(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number, size: number): void {
  const plain = `500 ${size}px ${BODY}`, bold = `800 ${size + 1}px ${BODY}`;
  const words = text.split(' ').map(w => ({ w, kw: KEYWORD.test(w) }));
  const width = (w: { w: string; kw: boolean }) => { g.font = w.kw ? bold : plain; return g.measureText(w.w).width; };
  g.font = plain; const space = g.measureText(' ').width;
  const lines: { w: string; kw: boolean; px: number }[][] = [];
  let cur: { w: string; kw: boolean; px: number }[] = [], cw = 0;
  for (const w of words) {
    const px = width(w), add = cur.length ? space + px : px;
    if (cw + add > maxW && cur.length) { lines.push(cur); cur = [{ ...w, px }]; cw = px; } else { cur.push({ ...w, px }); cw += add; }
  }
  if (cur.length) lines.push(cur);
  const shown = lines.slice(0, maxLines);
  const y0 = y - ((shown.length - 1) * lineH) / 2;
  const col = g.fillStyle;
  g.textAlign = 'left';
  shown.forEach((l, i) => {
    const lw = l.reduce((a, w) => a + w.px, 0) + space * (l.length - 1);
    let cx = x - lw / 2;
    for (const w of l) {
      g.font = w.kw ? bold : plain; g.fillStyle = w.kw ? '#8a4a00' : col;
      g.fillText(w.w, cx, y0 + i * lineH); cx += w.px + space;
    }
  });
  g.textAlign = 'center'; g.fillStyle = col;
}

/** unit classes that may advance and attack in one turn (engine: canCharge) */
const CHARGES = new Set(['Cavalry', 'Heavy Cavalry', 'Horse Archers']);
const ROMAN = ['', 'I', 'II', 'III', 'IV'];
const typeLabel = (c: CardDef) =>
  c.type === 'unit' ? (c.form && c.family !== 'fort' && c.family !== 'levy' ? `${ROMAN[c.form]} · ` : '') + c.sub.toUpperCase() + (CHARGES.has(c.sub) ? ' · CHARGES' : '') : c.kind === 'shakti' ? 'POWER TACTIC' : c.type === 'yantra' ? 'TRAP' : 'TACTIC';

/* ============================================================ card face */
const faceCache = new Map<string, Texture>();
/** a gilded frame: earned at the Senapati rank of that empire (cosmetic only) */
const isGilded = (_e: EmpireId): boolean => false;

/** `cost`: what the card costs right now (a discount shows as a green coin); defaults to the printed cost */
export function cardFace(id: string, upgrade = 0, cost?: number): Texture {
  const gilded = isGilded(CARDS[id].empire);
  const key = `${id}:${upgrade}:${cost ?? ''}${gilded ? ':g' : ''}`;
  const hit = faceCache.get(key);
  if (hit) return hit;
  const c = CARDS[id];
  const W = FACE_W, H = FACE_H;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;

  // frame
  roundRect(g, 0, 0, W, H, 26);
  material(g, c.empire, W, H, gilded);
  g.lineWidth = 4; g.strokeStyle = 'rgba(20,10,4,0.9)'; g.stroke();
  roundRect(g, 9, 9, W - 18, H - 18, 20);
  g.lineWidth = 2; g.strokeStyle = 'rgba(255,240,200,0.45)'; g.stroke();

  // painting in a cusped arch
  const ax = 6, ay = 6, aw = W - 12, ah = 432;
  g.save();
  archPath(g, ax, ay, aw, ah);
  g.clip();
  drawArt(g, id, ax, ay, aw, ah, 0.3);
  // lamp-light vignette over the painting
  const vg = g.createRadialGradient(W / 2, ay + ah * 0.45, ah * 0.25, W / 2, ay + ah * 0.5, ah * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,5,0,0.18)');
  g.fillStyle = vg; g.fillRect(ax, ay, aw, ah);
  g.restore();
  archPath(g, ax, ay, aw, ah);
  g.lineWidth = 3; g.strokeStyle = 'rgba(20,10,4,0.95)'; g.stroke();

  // name ribbon
  const ry = ay + ah - 30;
  const rib = g.createLinearGradient(0, ry, 0, ry + 74);
  rib.addColorStop(0, '#2b1a0e'); rib.addColorStop(1, '#140b05');
  g.beginPath();
  g.moveTo(14, ry + 6); g.lineTo(W - 14, ry + 6); g.lineTo(W - 30, ry + 37); g.lineTo(W - 14, ry + 70);
  g.lineTo(14, ry + 70); g.lineTo(30, ry + 37); g.closePath();
  g.fillStyle = rib; g.fill();
  g.lineWidth = 2.5; g.strokeStyle = '#d4a94f'; g.stroke();
  g.fillStyle = '#f6e7c3';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = 40;
  g.font = `700 ${size}px ${TITLE}`;
  while (g.measureText(c.name).width > W - 90 && size > 26) { size -= 2; g.font = `700 ${size}px ${TITLE}`; }
  g.fillText(c.name, W / 2, ry + 38);

  // palm-leaf text panel
  const py = ry + 82, ph = H - py - 66;
  roundRect(g, 30, py, W - 60, ph, 10);
  const leaf = g.createLinearGradient(0, py, 0, py + ph);
  leaf.addColorStop(0, '#efe0b8'); leaf.addColorStop(1, '#d9c38e');
  g.fillStyle = leaf; g.fill();
  g.save(); g.clip();
  g.strokeStyle = 'rgba(120,90,40,0.18)'; g.lineWidth = 1;
  for (let yy = py + 8; yy < py + ph; yy += 9) { g.beginPath(); g.moveTo(30, yy); g.lineTo(W - 30, yy + 2); g.stroke(); }
  g.restore();
  g.lineWidth = 2; g.strokeStyle = 'rgba(60,35,10,0.7)'; roundRect(g, 30, py, W - 60, ph, 10); g.stroke();
  // the unit class: dark, large and spaced so it reads on the parchment
  g.fillStyle = '#3a1e08';
  let ls = 3, ts = 23;
  g.font = `700 ${ts}px ${TITLE}`; g.letterSpacing = `${ls}px`;
  while (g.measureText(typeLabel(c)).width > W - 84 && ts > 16) { ts -= 1; ls = Math.max(1, ls - 0.5); g.font = `700 ${ts}px ${TITLE}`; g.letterSpacing = `${ls}px`; }
  g.fillText(typeLabel(c), W / 2, py + 24);
  g.letterSpacing = '0px';
  g.beginPath(); g.moveTo(W / 2 - 70, py + 42); g.lineTo(W / 2 + 70, py + 42); g.lineWidth = 1.5; g.strokeStyle = 'rgba(90,58,26,0.5)'; g.stroke();
  g.fillStyle = '#2a1708';
  wrapRich(g, c.text, W / 2, py + ph / 2 + 18, W - 100, 29, 3, 27);

  // cost coin, operation cost, rarity gem
  const printed = Math.max(1, c.type !== 'unit' ? c.cost - upgrade : c.cost);
  const now = cost ?? printed;
  // a fort structure is never played from the hand: no coins
  if (c.family !== 'fort') {
    coin(g, 62, 62, 48, String(now), now < printed ? 'cheaper' : 'gold');
    if (c.type === 'unit') coin(g, W - 56, 58, 36, String(c.op ?? 0), 'bronze');
  }
  gem(g, W / 2, 26, 15, c.rarity);

  // keyword badges under the cost coin, so Guard / Swift / Ranged read without the text
  if (c.type === 'unit') {
    const kinds: KwKind[] = [];
    if (c.kw?.includes('raksha')) kinds.push('raksha');
    if (c.kw?.includes('veg')) kinds.push('veg');
    if (c.range === 'ranged') kinds.push('ranged');
    kinds.forEach((kd, n) => kwBadge(g, kd, 62, 150 + n * 76, 33));
  }
  // stats
  if (c.type === 'unit') {
    statBadge(g, 66, H - 64, 46, 'atk', String((c.atk ?? 0) + upgrade));
    statBadge(g, W - 66, H - 64, 46, 'hp', String((c.hp ?? 0) + upgrade));
  }
  // training stars: gold for earned, dark for still to train
  if (c.stars) {
    const n = c.stars + upgrade;
    g.font = `700 34px ${BODY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      const sx = W / 2 + (k - 1) * 40, sy = H - 50;
      g.lineWidth = 5; g.strokeStyle = 'rgba(20,10,4,0.9)'; g.strokeText('★', sx, sy);
      g.fillStyle = k < n ? '#ffd76a' : 'rgba(60,40,20,0.65)'; g.fillText('★', sx, sy);
    }
  } else if (upgrade) {
    g.fillStyle = '#e7c46e'; g.font = `700 22px ${BODY}`;
    g.fillText('★'.repeat(upgrade), W / 2, H - 30);
  }

  const t = Texture.from(cv);
  if (!notReady(id)) faceCache.set(key, t);
  else healLater(id, cv, t, () => cardFace(id, upgrade, cost));
  return t;
}

/* ============================================================ card back */
let backTex: Texture | null = null;
export function cardBack(): Texture {
  if (backTex) return backTex;
  const W = FACE_W, H = FACE_H;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  roundRect(g, 0, 0, W, H, 26);
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#2c4466'); bg.addColorStop(1, '#101c2e');
  g.fillStyle = bg; g.fill();
  g.lineWidth = 6; g.strokeStyle = '#c98a4a'; g.stroke();
  roundRect(g, 22, 22, W - 44, H - 44, 16); g.lineWidth = 2; g.stroke();
  // indigo cloth weave
  g.save(); roundRect(g, 22, 22, W - 44, H - 44, 16); g.clip();
  g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2;
  for (let k = 0; k < W + H; k += 12) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k - H, H); g.stroke(); g.beginPath(); g.moveTo(k - H, 0); g.lineTo(k, H); g.stroke(); }
  g.restore();
  // the copper bell of the Marches
  g.translate(W / 2, H / 2 - 20);
  g.beginPath(); g.arc(0, 0, 150, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = 'rgba(201,138,74,0.9)'; g.stroke();
  const cu = g.createLinearGradient(-90, -110, 90, 110);
  cu.addColorStop(0, '#f0b77a'); cu.addColorStop(0.5, '#c97a3e'); cu.addColorStop(1, '#7a4220');
  g.beginPath();
  g.moveTo(0, -105); g.bezierCurveTo(55, -105, 62, -40, 66, 10); g.bezierCurveTo(70, 50, 95, 70, 100, 80);
  g.lineTo(-100, 80); g.bezierCurveTo(-95, 70, -70, 50, -66, 10); g.bezierCurveTo(-62, -40, -55, -105, 0, -105); g.closePath();
  g.fillStyle = cu; g.fill(); g.lineWidth = 5; g.strokeStyle = '#3a2210'; g.stroke();
  g.beginPath(); g.arc(0, 98, 18, 0, Math.PI * 2); g.fillStyle = '#c97a3e'; g.fill(); g.stroke();
  g.beginPath(); g.arc(0, -118, 16, 0, Math.PI * 2); g.lineWidth = 7; g.stroke();
  g.fillStyle = '#f0c48a'; g.font = `700 54px ${TITLE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('BATTLE MASTER', 0, 240);
  backTex = Texture.from(cv);
  return backTex;
}

/* ============================================================ board token */
const tokenCache = new Map<string, Texture>();

/** Static part of a unit on the board; stats are drawn live on top.
 *  `plate`: a name plate along the bottom. Without it (phones) the painting fills the token. */
export function tokenFace(id: string, owner: 0 | 1, plate = true): Texture {
  const key = `${id}:${owner}:${plate ? 1 : 0}`;
  const hit = tokenCache.get(key);
  if (hit) return hit;
  const c = CARDS[id];
  const W = TOKEN_W, H = TOKEN_H;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;

  roundRect(g, 0, 0, W, H, 22);
  material(g, c.empire, W, H);
  g.lineWidth = 4; g.strokeStyle = 'rgba(20,10,4,0.95)'; g.stroke();
  // without a plate, the owner's colour runs round the frame instead
  if (!plate) { roundRect(g, 3, 3, W - 6, H - 6, 18); g.lineWidth = 4; g.strokeStyle = owner === 0 ? '#d4a94f' : '#e0674a'; g.stroke(); }

  const ax = plate ? 6 : 4, ay = plate ? 6 : 4, aw = W - ax * 2, ah = plate ? H - 84 : H - 8;
  g.save(); archPath(g, ax, ay, aw, ah); g.clip();
  drawArt(g, id, ax, ay, aw, ah, 0.28);
  // darker towards the bottom, where the attack and health badges sit
  const vg = g.createLinearGradient(0, ay + ah * 0.55, 0, ay + ah);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,5,0,0.7)');
  g.fillStyle = vg; g.fillRect(ax, ay, aw, ah);
  g.restore();
  archPath(g, ax, ay, aw, ah); g.lineWidth = 3; g.strokeStyle = 'rgba(20,10,4,0.95)'; g.stroke();

  if (plate) {
    // nameplate in the owner's colour: gold-lacquer for you, vermilion for the enemy
    const ny = H - 84;
    roundRect(g, 10, ny, W - 20, 50, 8);
    g.fillStyle = owner === 0 ? '#2a1c0c' : '#3d1009'; g.fill();
    g.lineWidth = 2.5; g.strokeStyle = owner === 0 ? '#d4a94f' : '#e0674a'; g.stroke();
    g.fillStyle = '#f6e7c3'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = 28; g.font = `700 ${size}px ${TITLE}`;
    while (g.measureText(c.name).width > W - 40 && size > 18) { size -= 1; g.font = `700 ${size}px ${TITLE}`; }
    g.fillText(c.name, W / 2, ny + 27);
  }

  // most units spend 1 Supply to act; only the exceptions carry the bronze coin
  if ((c.op ?? 1) !== 1) coin(g, W - 40, 44, 32, String(c.op ?? 0), 'bronze');
  const t = Texture.from(cv);
  if (!notReady(id)) tokenCache.set(key, t);
  else healLater(id, cv, t, () => tokenFace(id, owner, plate));
  return t;
}

/* ============================================================ Fort plaque */
const durgCache = new Map<string, Texture>();
/** The capital: a painting in a heavy frame, coloured by its owner. */
export function durgFace(artId: string, owner: 0 | 1): Texture {
  const key = `${artId}:${owner}`;
  const hit = durgCache.get(key);
  if (hit) return hit;
  const W = 472, H = 464;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d')!;
  roundRect(g, 0, 0, W, H, 26);
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, owner === 0 ? '#5a4020' : '#5a2016'); bg.addColorStop(1, '#140b05');
  g.fillStyle = bg; g.fill();
  g.lineWidth = 6; g.strokeStyle = owner === 0 ? '#d4a94f' : '#e0674a'; g.stroke();
  const ax = 6, ay = 6, aw = W - 12, ah = H - 12;
  g.save(); archPath(g, ax, ay, aw, ah); g.clip();
  drawArt(g, artId, ax, ay, aw, ah, 0.35);
  const vg = g.createLinearGradient(0, ay, 0, ay + ah);
  vg.addColorStop(0, 'rgba(10,5,0,0.65)'); vg.addColorStop(0.35, 'rgba(10,5,0,0.05)'); vg.addColorStop(0.6, 'rgba(10,5,0,0.25)'); vg.addColorStop(1, 'rgba(10,5,0,0.92)');
  g.fillStyle = vg; g.fillRect(ax, ay, aw, ah);
  g.restore();
  archPath(g, ax, ay, aw, ah); g.lineWidth = 4; g.strokeStyle = '#e7c46e'; g.stroke();
  const t = Texture.from(cv);
  if (!notReady(artId)) durgCache.set(key, t);
  else healLater(artId, cv, t, () => durgFace(artId, owner));
  return t;
}

/* ============================================================ card faces for HTML screens */
const urlCache = new Map<string, string>();
/** a card face as an image URL, for the camp and route screens (drawn once its painting has loaded) */
export function cardFaceUrl(id: string): string {
  const hit = urlCache.get(id);
  if (hit) return hit;
  const t = cardFace(id);
  const res = (t.source as unknown as { resource?: unknown }).resource;
  if (!(res instanceof HTMLCanvasElement)) return '';
  const small = document.createElement('canvas');
  small.width = 240; small.height = Math.round(240 * res.height / res.width);
  small.getContext('2d')!.drawImage(res, 0, 0, small.width, small.height);
  const url = small.toDataURL('image/webp', 0.86);
  if (!notReady(id)) urlCache.set(id, url);
  return url;
}
