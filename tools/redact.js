// redact.js – PDF redaction using pdf.js (rendering) + pdf-lib (output)

const fileEl = document.getElementById('file');
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

let pdfDoc = null;
let pageNum = 1;
let scale = 1.2;
let rects = {}; // { pageNum: [ {x,y,w,h}, ... ] }
let dragging = false, startX, startY;

fileEl.addEventListener('change', async () => {
  const file = fileEl.files[0];
  if (!file) return;
  const buf = await file.arrayBuffer();
  pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
  pageNum = 1;
  rects = {};
  renderPage();
});

async function renderPage() {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(pageNum);
  const vp = page.getViewport({ scale });
  canvas.width = vp.width;
  canvas.height = vp.height;
  await page.render({ canvasContext: ctx, viewport: vp }).promise;

  // Draw any saved rectangles
  (rects[pageNum] || []).forEach(r => {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  });

  statusEl.textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;
}

// Navigation
document.getElementById('prev').onclick = () => { if (pageNum > 1) { pageNum--; renderPage(); } };
document.getElementById('next').onclick = () => { if (pdfDoc && pageNum < pdfDoc.numPages) { pageNum++; renderPage(); } };
document.getElementById('clear').onclick = () => { rects[pageNum] = []; renderPage(); };

// Mouse drawing
canvas.addEventListener('mousedown', e => {
  dragging = true;
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
});
canvas.addEventListener('mouseup', e => {
  if (!dragging) return;
  dragging = false;
  const rect = canvas.getBoundingClientRect();
  const x = Math.min(startX, e.clientX - rect.left);
  const y = Math.min(startY, e.clientY - rect.top);
  const w = Math.abs(e.clientX - rect.left - startX);
  const h = Math.abs(e.clientY - rect.top - startY);
  if (w > 5 && h > 5) {
    rects[pageNum] = rects[pageNum] || [];
    rects[pageNum].push({ x, y, w, h });
    renderPage();
  }
});

// Apply redactions
document.getElementById('apply').addEventListener('click', async () => {
  if (!pdfDoc) { statusEl.textContent = 'No PDF loaded.'; return; }
  statusEl.textContent = 'Applying redactions…';

  const srcFile = fileEl.files[0];
  const srcBytes = await srcFile.arrayBuffer();
  const src = await PDFLib.PDFDocument.load(srcBytes);
  const out = await PDFLib.PDFDocument.create();

  const pages = await out.copyPages(src, src.getPageIndices());
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const { width, height } = p.getSize();

    (rects[i+1] || []).forEach(r => {
      // Convert canvas coords → PDF coords
      const scaleX = width / canvas.width;
      const scaleY = height / canvas.height;
      const x = r.x * scaleX;
      const y = height - (r.y + r.h) * scaleY; // invert Y
      const w = r.w * scaleX;
      const h = r.h * scaleY;

      p.drawRectangle({ x, y, width: w, height: h, color: PDFLib.rgb(0,0,0) });
    });

    out.addPage(p);
  }

  const bytes = await out.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'redacted.pdf';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);

  statusEl.textContent = 'Redactions applied.';
});
