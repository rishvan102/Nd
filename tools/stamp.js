// stamp.js — add a text stamp to every page of a PDF

async function fileToArrayBuffer(file) { return await file.arrayBuffer(); }

document.getElementById('go').addEventListener('click', async () => {
  const pdfFile = document.getElementById('pdfFile').files[0];
  const text = document.getElementById('stampText').value || 'Stamped';
  const pos = document.getElementById('pos').value;
  const size = Math.max(6, +document.getElementById('size').value || 10);
  const margin = Math.max(0, +document.getElementById('margin').value || 16);
  const status = document.getElementById('status');

  if (!pdfFile) {
    status.textContent = 'Please choose a PDF file.';
    return;
  }

  try {
    status.textContent = 'Adding stamp…';

    const srcBytes = await fileToArrayBuffer(pdfFile);
    const pdf = await PDFLib.PDFDocument.load(srcBytes);
    const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);

    const total = pdf.getPageCount();
    for (let i = 0; i < total; i++) {
      const p = pdf.getPage(i);
      const { width, height } = p.getSize();
      const tw = font.widthOfTextAtSize(text, size);

      let x = margin, y = height - margin; // default TL
      switch (pos) {
        case 'br': x = width - margin - tw; y = margin; break;
        case 'bc': x = (width - tw) / 2;   y = margin; break;
        case 'bl': x = margin;             y = margin; break;
        case 'tr': x = width - margin - tw; y = height - margin; break;
        case 'tc': x = (width - tw) / 2;   y = height - margin; break;
        case 'tl': default: x = margin;    y = height - margin;
      }

      p.drawText(text, { x, y, size, font, color: PDFLib.rgb(0,0,0) });
    }

    const bytes = await pdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'stamped.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = 'Done. stamped.pdf downloaded.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
