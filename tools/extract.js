// extract.js — keep only selected pages using pdf-lib

function parseRanges(str, max) {
  // Returns sorted, unique 1-based page numbers
  const out = new Set();
  if (!str) return [];
  for (const part of String(str).split(',')) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    let a = +m[1], b = m[2] ? +m[2] : a;
    if (a > b) [a, b] = [b, a];
    for (let i = a; i <= b; i++) {
      if (i >= 1 && (!max || i <= max)) out.add(i);
    }
  }
  return Array.from(out).sort((x, y) => x - y);
}

async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}

document.getElementById('go').addEventListener('click', async () => {
  const fileEl = document.getElementById('file');
  const listEl = document.getElementById('list');
  const status = document.getElementById('status');

  const f = fileEl.files && fileEl.files[0];
  if (!f) { status.textContent = 'Pick a PDF first.'; return; }

  try {
    status.textContent = 'Extracting…';

    const srcBytes = await fileToArrayBuffer(f);
    const src = await PDFLib.PDFDocument.load(srcBytes);
    const total = src.getPageCount();

    const keepList = parseRanges(listEl.value, total);
    if (!keepList.length) { status.textContent = 'Enter pages to keep.'; return; }

    const out = await PDFLib.PDFDocument.create();
    const pages = await out.copyPages(src, keepList.map(n => n - 1));
    pages.forEach(p => out.addPage(p));

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'extracted.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = `Done. Kept ${keepList.length} page(s).`;
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
