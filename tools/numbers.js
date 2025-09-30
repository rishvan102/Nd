// numbers.js — add page numbers to all pages using pdf-lib

async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}

document.getElementById('go').addEventListener('click', async () => {
  const fileEl   = document.getElementById('file');
  const posEl    = document.getElementById('pos');
  const marginEl = document.getElementById('margin');
  const startEl  = document.getElementById('startAt');
  const sizeEl   = document.getElementById('fontSize');
  const status   = document.getElementById('status');

  const f = fileEl.files && fileEl.files[0];
  if (!f) { status.textContent = 'Pick a PDF first.'; return; }

  try {
    status.textContent = 'Numbering…';

    const srcBytes = await fileToArrayBuffer(f);
    const src = await PDFLib.PDFDocument.load(srcBytes);
    const out = await PDFLib.PDFDocument.create();

    // Embed a font once in the output doc
    const font = await out.embedFont(PDFLib.StandardFonts.Helvetica);

    // Copy pages and draw numbers
    const total = src.getPageCount();
    const pages = await out.copyPages(src, src.getPageIndices());

    const pos    = posEl.value;                  // br, bc, bl, tr, tc, tl
    const margin = Math.max(0, +marginEl.value || 24);
    const start  = +startEl.value || 1;
    const size   = Math.max(6, +sizeEl.value || 10);

    pages.forEach((p, idx) => {
      const w = p.getWidth();
      const h = p.getHeight();
      const number = String(start + idx);        // simple 1..N; change format here if desired
      const tw = font.widthOfTextAtSize(number, size);

      let x = margin, y = h - margin;            // default TL
      switch (pos) {
        case 'br': x = w - margin - tw; y = margin; break;
        case 'bc': x = (w - tw) / 2;   y = margin; break;
        case 'bl': x = margin;         y = margin; break;
        case 'tr': x = w - margin - tw; y = h - margin; break;
        case 'tc': x = (w - tw) / 2;   y = h - margin; break;
        case 'tl': default: x = margin; y = h - margin;
      }

      p.drawText(number, {
        x, y,
        size,
        font,
        color: PDFLib.rgb(0, 0, 0)
      });

      out.addPage(p);
    });

    const bytes = await out.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'numbered.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = 'Done.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
