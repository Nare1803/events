/**
 * Generates the local demo assets used by the "Anna & David" sample invitation:
 * atmospheric placeholder photographs (WebP) and a short ambient music loop (WAV).
 *
 * These are intentionally abstract placeholders — replace them with the couple's
 * real photos from the dashboard (Gallery / Invitation) or by overwriting files in
 * public/demo. Run with:  npm run assets:demo
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "public", "demo");
const C = { ivory: "#F5F0EA", nude: "#E8DDD4", taupe: "#BBAA9D", mocha: "#806D62", espresso: "#292421" };

// Deterministic PRNG so the assets are identical on every run.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const svg = (w, h, defs, body) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>${defs}
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(w / 40)}"/></filter>
    <filter id="haze" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${Math.round(w / 110)}"/></filter>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.35"/>
    </radialGradient>
  </defs>
  ${body}
  <rect width="100%" height="100%" fill="url(#vignette)"/>
</svg>`;

/** Hazy dusk over twin peaks — a quiet nod to Ararat. */
function ararat(w, h) {
  const peak = (cx, cy, spread, color, op) =>
    `<path d="M ${cx - spread * 2.4} ${h} L ${cx - spread * 0.35} ${cy + spread * 0.12} Q ${cx} ${cy - spread * 0.06} ${cx + spread * 0.35} ${cy + spread * 0.12} L ${cx + spread * 2.6} ${h} Z" fill="${color}" opacity="${op}"/>`;
  return svg(
    w,
    h,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#7a675c"/><stop offset="0.35" stop-color="#bda595"/>
       <stop offset="0.6" stop-color="#ecdccd"/><stop offset="1" stop-color="#d9c5b5"/></linearGradient>
     <radialGradient id="sun" cx="38%" cy="56%" r="30%"><stop offset="0" stop-color="#fff3e8" stop-opacity="0.9"/><stop offset="1" stop-color="#fff3e8" stop-opacity="0"/></radialGradient>
     <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7ede4"/><stop offset="0.3" stop-color="#b8a193"/><stop offset="1" stop-color="#9a8272"/></linearGradient>`,
    `<rect width="100%" height="100%" fill="url(#sky)"/>
     <rect width="100%" height="100%" fill="url(#sun)"/>
     <g filter="url(#haze)">
       ${peak(w * 0.64, h * 0.52, w * 0.2, "url(#snow)", 0.85)}
       ${peak(w * 0.3, h * 0.63, w * 0.09, "url(#snow)", 0.7)}
       <path d="M 0 ${h * 0.8} Q ${w * 0.3} ${h * 0.74} ${w * 0.55} ${h * 0.79} T ${w} ${h * 0.77} L ${w} ${h} L 0 ${h} Z" fill="#5b4a41" opacity="0.85"/>
     </g>
     <rect y="${h * 0.86}" width="100%" height="${h * 0.14}" fill="#2f2723" opacity="0.6" filter="url(#soft)"/>`,
  );
}

/** Soft light through tall arched windows onto a linen wall. */
function windowLight(w, h, tone = C.nude, dark = C.mocha) {
  const r = rng(w + h);
  const arch = (x, width) => {
    const top = h * (0.14 + r() * 0.05);
    const bottom = h * 0.92;
    return `<path d="M ${x} ${bottom} L ${x} ${top + width / 2} A ${width / 2} ${width / 2} 0 0 1 ${x + width} ${top + width / 2} L ${x + width} ${bottom} Z" fill="#fff8f0" opacity="0.8"/>`;
  };
  return svg(
    w,
    h,
    `<linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tone}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
     <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6ea" stop-opacity="0.55"/><stop offset="1" stop-color="#fff6ea" stop-opacity="0"/></linearGradient>`,
    `<rect width="100%" height="100%" fill="url(#wall)"/>
     <g filter="url(#soft)">${arch(w * 0.18, w * 0.24)}${arch(w * 0.56, w * 0.24)}</g>
     <polygon points="${w * 0.2},${h * 0.2} ${w * 0.82},${h * 0.2} ${w * 1.1},${h} ${w * 0.1},${h}" fill="url(#beam)" filter="url(#haze)"/>`,
  );
}

/** Out-of-focus candlelight. */
function bokeh(w, h, seed) {
  const r = rng(seed);
  let dots = "";
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = h * (0.25 + r() * 0.7);
    const size = w * (0.02 + r() * 0.07);
    const warm = ["#f6dcc0", "#e9c49f", "#fbe9d6", "#d8b08c"][Math.floor(r() * 4)];
    dots += `<circle cx="${x}" cy="${y}" r="${size}" fill="${warm}" opacity="${0.25 + r() * 0.55}"/>`;
  }
  return svg(
    w,
    h,
    `<radialGradient id="room" cx="50%" cy="70%" r="80%"><stop offset="0" stop-color="#5a4940"/><stop offset="1" stop-color="${C.espresso}"/></radialGradient>`,
    `<rect width="100%" height="100%" fill="url(#room)"/><g filter="url(#haze)">${dots}</g>`,
  );
}

/** Flowing fabric folds in the palette. */
function drapes(w, h, colors, seed) {
  const r = rng(seed);
  let folds = "";
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = (i / n) * w * 1.2 - w * 0.1;
    const sway = w * (0.05 + r() * 0.08);
    const width = w * (0.12 + r() * 0.1);
    const color = colors[i % colors.length];
    folds += `<path d="M ${x} -20 C ${x + sway} ${h * 0.3}, ${x - sway} ${h * 0.65}, ${x + sway * 0.6} ${h + 20} L ${x + width + sway * 0.6} ${h + 20} C ${x + width - sway} ${h * 0.65}, ${x + width + sway} ${h * 0.3}, ${x + width} -20 Z" fill="${color}" opacity="${0.55 + r() * 0.4}"/>`;
  }
  return svg(
    w,
    h,
    `<linearGradient id="shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    `<rect width="100%" height="100%" fill="${colors[0]}"/><g filter="url(#haze)">${folds}</g>
     <rect width="100%" height="100%" fill="url(#shine)" filter="url(#soft)"/>`,
  );
}

/** Two soft silhouettes close together against evening light. */
function silhouettes(w, h) {
  return svg(
    w,
    h,
    `<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdb7a6"/><stop offset="0.6" stop-color="#ead9ca"/><stop offset="1" stop-color="#9b8475"/></linearGradient>`,
    `<rect width="100%" height="100%" fill="url(#dusk)"/>
     <circle cx="${w * 0.62}" cy="${h * 0.3}" r="${w * 0.3}" fill="#fff3e6" opacity="0.6" filter="url(#soft)"/>
     <g filter="url(#soft)" fill="${C.espresso}" opacity="0.55">
       <ellipse cx="${w * 0.45}" cy="${h * 0.38}" rx="${w * 0.055}" ry="${w * 0.07}"/>
       <path d="M ${w * 0.36} ${h} C ${w * 0.35} ${h * 0.62}, ${w * 0.38} ${h * 0.47}, ${w * 0.45} ${h * 0.46} C ${w * 0.5} ${h * 0.47}, ${w * 0.52} ${h * 0.6}, ${w * 0.53} ${h} Z"/>
       <ellipse cx="${w * 0.555}" cy="${h * 0.35}" rx="${w * 0.06}" ry="${w * 0.075}"/>
       <path d="M ${w * 0.46} ${h} C ${w * 0.47} ${h * 0.6}, ${w * 0.5} ${h * 0.44}, ${w * 0.56} ${h * 0.43} C ${w * 0.63} ${h * 0.44}, ${w * 0.66} ${h * 0.6}, ${w * 0.67} ${h} Z"/>
     </g>`,
  );
}

/** Tufa-stone church doorway. */
function stoneArch(w, h) {
  const r = rng(7);
  let blocks = "";
  for (let y = 0; y < h; y += h / 14) {
    const offset = (Math.round(y / (h / 14)) % 2) * (w / 12);
    for (let x = -offset; x < w; x += w / 6) {
      const shade = ["#b48f7e", "#c29f8d", "#a8826f", "#bd9886"][Math.floor(r() * 4)];
      blocks += `<rect x="${x + 2}" y="${y + 2}" width="${w / 6 - 4}" height="${h / 14 - 4}" fill="${shade}"/>`;
    }
  }
  const aw = w * 0.42;
  const ax = (w - aw) / 2;
  return svg(
    w,
    h,
    `<linearGradient id="inside" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b302a"/><stop offset="1" stop-color="#6d5a4f"/></linearGradient>`,
    `<g filter="url(#haze)" opacity="0.9">${blocks}</g>
     <path d="M ${ax} ${h} L ${ax} ${h * 0.42} A ${aw / 2} ${aw / 2} 0 0 1 ${ax + aw} ${h * 0.42} L ${ax + aw} ${h} Z" fill="url(#inside)" filter="url(#haze)"/>
     <circle cx="${w / 2}" cy="${h * 0.62}" r="${w * 0.09}" fill="#f6d9b5" opacity="0.35" filter="url(#soft)"/>`,
  );
}

/** Garden terrace at golden hour. */
function terrace(w, h) {
  const r = rng(11);
  let leaves = "";
  for (let i = 0; i < 40; i++) {
    leaves += `<circle cx="${r() * w}" cy="${r() * h * 0.45}" r="${w * (0.03 + r() * 0.06)}" fill="${["#8d8a6f", "#a09c80", "#76735c"][Math.floor(r() * 3)]}" opacity="${0.35 + r() * 0.4}"/>`;
  }
  return svg(
    w,
    h,
    `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d6c2"/><stop offset="1" stop-color="#a88f7e"/></linearGradient>`,
    `<rect width="100%" height="100%" fill="url(#gold)"/>
     <g filter="url(#soft)">${leaves}</g>
     <g filter="url(#haze)">
       <rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.04}" fill="#f7ede3" opacity="0.8"/>
       <rect x="0" y="${h * 0.66}" width="${w}" height="${h * 0.34}" fill="#8a7466" opacity="0.6"/>
       ${[0.15, 0.35, 0.55, 0.75].map((x) => `<ellipse cx="${w * x}" cy="${h * 0.6}" rx="${w * 0.05}" ry="${h * 0.02}" fill="#fff4e6" opacity="0.8"/>`).join("")}
     </g>`,
  );
}

const IMAGES = [
  { file: "hero.webp", w: 1800, h: 2400, art: () => ararat(1800, 2400) },
  { file: "gallery-01.webp", w: 1200, h: 1600, art: () => silhouettes(1200, 1600) },
  { file: "gallery-02.webp", w: 1600, h: 1067, art: () => windowLight(1600, 1067) },
  { file: "gallery-03.webp", w: 1200, h: 1500, art: () => drapes(1200, 1500, [C.nude, C.taupe, "#d9c8ba", C.ivory], 5) },
  { file: "gallery-04.webp", w: 1200, h: 1800, art: () => bokeh(1200, 1800, 21) },
  { file: "gallery-05.webp", w: 1600, h: 1200, art: () => ararat(1600, 1200) },
  { file: "gallery-06.webp", w: 1200, h: 1600, art: () => windowLight(1200, 1600, C.ivory, C.taupe) },
  { file: "venue-church.webp", w: 1200, h: 900, art: () => stoneArch(1200, 900) },
  { file: "venue-terrace.webp", w: 1200, h: 900, art: () => terrace(1200, 900) },
  { file: "venue-hall.webp", w: 1200, h: 900, art: () => bokeh(1200, 900, 42) },
  { file: "dress-code.webp", w: 1200, h: 1500, art: () => drapes(1200, 1500, ["#e7d7c3", C.taupe, "#5a4034", "#1d1a18"], 9) },
  { file: "closing.webp", w: 1800, h: 1200, art: () => bokeh(1800, 1200, 77) },
];

/** Monochrome film grain as a semi-transparent overlay (librsvg ignores feTurbulence). */
function grainLayer(outW, outH, strength, seed) {
  const w = Math.ceil(outW / 2);
  const h = Math.ceil(outH / 2);
  const r = rng(seed);
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = r() > 0.5 ? 255 : 0;
    buf[i * 4] = buf[i * 4 + 1] = buf[i * 4 + 2] = v;
    buf[i * 4 + 3] = Math.floor(r() * strength);
  }
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } }).resize(outW, outH, { kernel: "cubic" }).png().toBuffer();
}

async function generateImages() {
  for (const [index, img] of IMAGES.entries()) {
    const base = await sharp(Buffer.from(img.art()), { density: 72 }).resize(img.w, img.h).png().toBuffer();
    await sharp(base)
      .composite([{ input: await grainLayer(img.w, img.h, 30, index + 1), blend: "over" }])
      .webp({ quality: 74 })
      .toFile(path.join(OUT, img.file));
    console.log(`  ✓ ${img.file}`);
  }
}

/** A gentle, seamlessly looping ambient piece: soft pads and a music-box melody. */
async function generateMusic() {
  const rate = 22050;
  const bpm = 64;
  const beat = 60 / bpm;
  const bars = 8;
  const duration = bars * 4 * beat; // 30s
  const total = Math.floor(duration * rate);
  const data = new Float32Array(total);
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  // Fmaj7 – Am7 – Dm9 – B♭maj7, twice.
  const chords = [
    [53, 57, 60, 64],
    [57, 60, 64, 67],
    [50, 57, 60, 64],
    [46, 53, 57, 62],
  ];
  const melody = [72, 69, 67, 69, 64, 67, 69, 72, 74, 72, 69, 67, 65, 67, 69, 64];

  const addTone = (start, len, freq, amp, attack, release, bell) => {
    const s0 = Math.floor(start * rate);
    const n = Math.floor(len * rate);
    for (let i = 0; i < n; i++) {
      const idx = (s0 + i) % total; // wrap so the loop is seamless
      const t = i / rate;
      let env;
      if (bell) env = Math.exp(-t * 2.2) * Math.min(1, t / 0.005);
      else env = Math.min(1, t / attack) * Math.min(1, (len - t) / release);
      const phase = 2 * Math.PI * freq * t;
      const wave = bell
        ? Math.sin(phase) + 0.25 * Math.sin(phase * 2.01) + 0.08 * Math.sin(phase * 3.98)
        : Math.sin(phase) + 0.18 * Math.sin(phase * 2) + 0.05 * Math.sin(phase * 3 + 0.3);
      data[idx] += wave * env * amp;
    }
  };

  for (let bar = 0; bar < bars; bar++) {
    const chord = chords[bar % 4];
    const start = bar * 4 * beat;
    for (const note of chord) {
      addTone(start, 4 * beat + 1.2, hz(note), 0.045, 1.4, 1.6, false);
      addTone(start, 4 * beat + 1.2, hz(note) * 1.003, 0.02, 1.8, 1.6, false);
    }
    addTone(start, 4 * beat, hz(chord[0] - 12), 0.05, 0.9, 1.2, false);
    for (let i = 0; i < 2; i++) {
      const note = melody[(bar * 2 + i) % melody.length];
      addTone(start + i * 2 * beat + 0.02, 2.8, hz(note), 0.07, 0, 0, true);
    }
  }

  // Normalise and encode 16-bit PCM WAV.
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const gain = 0.8 / (peak || 1);
  const buffer = Buffer.alloc(44 + total * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + total * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(total * 2, 40);
  for (let i = 0; i < total; i++) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * gain)) * 32767), 44 + i * 2);
  }
  await writeFile(path.join(OUT, "ambient-loop.wav"), buffer);
  console.log("  ✓ ambient-loop.wav");
}

await mkdir(OUT, { recursive: true });
console.log("Generating demo assets in public/demo …");
await generateImages();
await generateMusic();
console.log("Done.");
