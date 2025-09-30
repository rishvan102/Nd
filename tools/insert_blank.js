// insert_blank.js — add blank pages at user-defined positions using pdf-lib

function parsePositions(str, max) {
  const out = new Set();
  if (!str) return [];
  for (const part of String(str).split(',')) {
    const n = parseInt(part.trim(), 10);
    if (!isNaN(n) && n >= 1 && (!max || n <= max)) out.add(n);
  }
  return Array.from(out).sort((a, b) => a - b);
}

async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}

document.getElementById('go').addEventListener('click', async () => {
  const fileEl = document.getElementById('file');
  const posEl = document.getElementById('positions');
  const status = document.getElementById('status');

  const f = fileEl.files && fileEl.files[0];
  if (!f) { status.textContent = 'Pick a PDF first.'; return; }

  try {
    status.textContent = 'Inserting…';

    const srcBytes = await fileToArrayBuffer(f);
    const src = await PDFLib.PDFDocument.load(srcBytes);
    const total = src.getPageCount();

    const out = await PDFLib.PDFDocument.create();
    const pages = await out.copyPages(src, src.getPageIndices());

    const positions = parsePositions(posEl.value, total);

    for (let i = 0; i < pages.length; i++) {
      out.addPage(pages[i]);
      const pageNo = i + 1; // 1-based
      if (positions.includes(pageNo)) {
        // Insert blank with same size as current page
        const { width, height } = pages[i].getSize();
        out.addPage([width, height]);
      }
    }

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inserted_blank.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = `Done. Inserted ${positions.length} blank page(s).`;
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
