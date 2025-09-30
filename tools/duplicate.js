// duplicate.js — duplicate selected pages and append them to the end

function parseRanges(str, max) {
  const out = new Set();
  if (!str) return [];
  for (const part of str.split(',')) {
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
  const rangesEl = document.getElementById('ranges');
  const status = document.getElementById('status');

  const f = fileEl.files && fileEl.files[0];
  if (!f) { status.textContent = 'Pick a PDF first.'; return; }

  try {
    status.textContent = 'Processing…';

    const srcBytes = await fileToArrayBuffer(f);
    const src = await PDFLib.PDFDocument.load(srcBytes);
    const total = src.getPageCount();

    const dupList = parseRanges(rangesEl.value, total);
    if (!dupList.length) { status.textContent = 'Enter pages to duplicate.'; return; }

    const out = await PDFLib.PDFDocument.create();

    // Copy all original pages first
    const allPages = await out.copyPages(src, src.getPageIndices());
    allPages.forEach(p => out.addPage(p));

    // Append duplicates
    for (const pageNo of dupList) {
      const [p] = await out.copyPages(src, [pageNo - 1]);
      out.addPage(p);
    }

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'duplicated.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = `Done. Duplicated ${dupList.length} page(s).`;
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
