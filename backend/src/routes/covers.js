const express = require('express');
const { read } = require('../graph/neo4j');

const router = express.Router();

const PALETTES = [
  { bg1: '#1a1030', bg2: '#0d0d0f', accent: '#d4af37' },
  { bg1: '#0d1a18', bg2: '#080f0d', accent: '#3ecfa0' },
  { bg1: '#1a0e0e', bg2: '#100808', accent: '#e07c7c' },
  { bg1: '#0d0e1a', bg2: '#080912', accent: '#7c8ae0' },
  { bg1: '#1a1605', bg2: '#100e03', accent: '#d4c037' },
  { bg1: '#05180f', bg2: '#030f09', accent: '#37d47a' },
];

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && (line + ' ' + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + ' ' + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

router.get('/:isbn', async (req, res) => {
  const { isbn } = req.params;
  let title = 'Untitled';
  let author = '';

  try {
    const records = await read('MATCH (b:Book {isbn: $isbn}) RETURN b', { isbn });
    if (records.length) {
      const p = records[0].get('b').properties;
      title = p.title || title;
      author = p.author || '';
    }
  } catch {}

  const palIdx = parseInt(isbn.replace(/\D/g, '').slice(-1) || '0', 10) % PALETTES.length;
  const { bg1, bg2, accent } = PALETTES[palIdx];
  const gradId = `g${isbn.slice(-6)}`;

  const titleLines = wrapText(title, 16);
  const lineH = 36;
  const blockH = titleLines.length * lineH;
  const titleStartY = 225 - blockH / 2 + lineH * 0.75;

  const titleSvg = titleLines
    .map((ln, i) =>
      `<text x="150" y="${titleStartY + i * lineH}" font-family="Georgia,'Times New Roman',serif" font-size="24" font-weight="700" fill="#f0ece4" text-anchor="middle">${esc(ln)}</text>`
    )
    .join('\n  ');

  const authorY = titleStartY + titleLines.length * lineH + 18;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450">
  <defs>
    <linearGradient id="${gradId}" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="450" fill="url(#${gradId})"/>
  <rect x="12" y="12" width="276" height="426" fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.55"/>
  <rect x="16" y="16" width="268" height="418" fill="none" stroke="${accent}" stroke-width="0.5" stroke-opacity="0.25"/>
  <line x1="12" y1="58" x2="288" y2="58" stroke="${accent}" stroke-width="0.5" stroke-opacity="0.35"/>
  <line x1="12" y1="392" x2="288" y2="392" stroke="${accent}" stroke-width="0.5" stroke-opacity="0.35"/>
  <text x="150" y="43" font-family="Georgia,serif" font-size="9" fill="${accent}" text-anchor="middle" letter-spacing="4" opacity="0.75">SRI LANKAN LITERATURE</text>
  ${titleSvg}
  <text x="150" y="${authorY}" font-family="Georgia,serif" font-size="13" font-style="italic" fill="${accent}" text-anchor="middle">${esc(author)}</text>
  <text x="150" y="415" font-family="Georgia,serif" font-size="8" fill="${accent}" text-anchor="middle" letter-spacing="3" opacity="0.45">FEDBOOKSEM</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

module.exports = router;
