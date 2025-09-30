// reorder.js — reorder PDF pages with drag & drop

const fileEl = document.getElementById('file');
const thumbsEl = document.getElementById('thumbs');
const statusEl = document.getElementById('status');
let pdfDoc = null;
let order = []; // array of page indices

fileEl.addEventListener('change', async () => {
  const file = fileEl.files[0];
  if (!file) return;
  const buf = await file.arrayBuffer();
  pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
  order = Array.from({ length: pdfDoc.numPages }, (_, i) => i);
  renderThumbs();
});

async function renderThumbs() {
  thumbsEl.innerHTML = '';
  for (let i = 0; i < pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i+1);
    const vp = page.getViewport({ scale: 0.3 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;

    const div = document.createElement('div');
    div.className = 'thumb';
    div.dataset.index = i;
    div.innerHTML = `<img src="${canvas.toDataURL()}" alt="Page ${i+1}"><span>${i+1}</span>`;
    thumbsEl.appendChild(div);
  }

  // Enable SortableJS
  new Sortable(thumbsEl, {
    animation: 150,
    onEnd: () => {
      order = Array.from(thumbsEl.children).map(el => +el.dataset.index);
    }
  });
}

// Reset
document.getElementById('reset').addEventListener('click', () => {
  if (!pdfDoc) return;
  order = Array.from({ length: pdfDoc.numPages }, (_, i) => i);
  renderThumbs();
});

// Export
document.getElementById('export').addEventListener('click', async () => {
  if (!pdfDoc) return;
  statusEl.textContent = 'Building reordered PDF…';

  const srcFile = fileEl.files[0];
  const srcBytes = await srcFile.arrayBuffer();
  const src = await PDFLib.PDFDocument.load(srcBytes);
  const out = await PDFLib.PDFDocument.create();

  const copied = await out.copyPages(src, order);
  copied.forEach(p => out.addPage(p));

  const bytes = await out.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'reordered.pdf';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);

  statusEl.textContent = 'Done.';
});
