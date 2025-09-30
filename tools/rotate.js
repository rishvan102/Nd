// rotate.js — rotate selected pages using pdf-lib

function parseRanges(str, max) {
  // Returns sorted unique 1-based page numbers
  if (!str) return [];
  const out = new Set();
  for (const token of String(str).split(',')) {
    const m = token.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    let a = +m[1], b = m[2] ? +m[2] : a;
    if (a > b) [a, b] = [b, a];
    for (let i = a; i <= b; i++) if (i >= 1 && (!max || i <= max)) out.add(i);
  }
  return Array.from(out).sort((x, y) => x - y);
}

async function fileToArrayBuffer(file) { return await file.arrayBuffer(); }

document.getElementById('go').addEventListener('click', async () => {
  const fileEl   = document.getElementById('file');
  const rangesEl = document.getElementById('ranges');
  const angleEl  = document.getElementById('angle');
  const dirEl    = document.getElementById('dir');
  const scopeEl  = document.getElementById('scope');
  const status   = document.getElementById('status');

  const f = fileEl.files && fileEl.files[0];
  if (!f) { status.textContent = 'Pick a PDF first.'; return; }

  let angle = parseFloat(angleEl.value || '0');
  if (!isFinite(angle)) angle = 0;
  angle = ((angle % 360) + 360) % 360; // normalize 0..359
  if (dirEl.value === 'ccw') angle = (360 - angle) % 360;

  try {
    status.textContent = 'Rotating…';

    const srcBytes = await fileToArrayBuffer(f);
    const src = await PDFLib.PDFDocument.load(srcBytes);
    const out = await PDFLib.PDFDocument.create();

    const total = src.getPageCount();
    const pageIndices = src.getPageIndices();
    const pages = await out.copyPages(src, pageIndices);

    // Determine which pages to rotate (1-based)
    const listed = parseRanges(rangesEl.value, total);
    const targetSet = new Set(
      scopeEl.value === 'all'
        ? Array.from({ length: total }, (_, i) => i + 1)
        : listed
    );
    if (!targetSet.size) {
      status.textContent = 'Enter pages to rotate, or choose "All pages".';
      return;
    }

    pages.forEach((p, i) => {
      const pageNo = i + 1;
      if (targetSet.has(pageNo)) {
        // Get current rotation (pdf-lib stores in degrees)
        const current = p.getRotation().angle || 0;
        const next = (current + angle) % 360;
        p.setRotation(PDFLib.degrees(next));
      }
      out.addPage(p);
    });

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rotated.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = 'Done.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
