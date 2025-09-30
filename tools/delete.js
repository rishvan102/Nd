// delete.js — remove selected pages using pdf-lib

function parseRanges(str, max) {
  // Returns sorted unique page numbers (1-based)
  const out = new Set();
  if (!str) return [];
  for (const part of String(str).split(',')) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    let a = +m[1], b = m[2] ? +m[2] : a;
    if (a > b) [a, b] = [b, a];
    for (let i = a; i <= b; i++) {
      if (!max || (i >= 1 && i <= max)) out.add(i);
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
    status.textContent = 'Processing…';

    const srcBytes = await fileToArrayBuffer(f);
    const src = await PDFLib.PDFDocument.load(srcBytes);
    const total = src.getPageCount();

    const delList = parseRanges(listEl.value, total);
    if (!delList.length) { status.textContent = 'Enter pages to delete.'; return; }
    const delSet = new Set(delList);

    const out = await PDFLib.PDFDocument.create();

    // Copy all pages except those in delSet
    for (let i = 0; i < total; i++) {
      const pageNo = i + 1;
      if (delSet.has(pageNo)) continue;
      const [p] = await out.copyPages(src, [i]);
      out.addPage(p);
    }

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'deleted.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = `Done. Removed ${delList.length} page(s).`;
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
