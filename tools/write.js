// write.js — create PDF from typed note using pdf-lib

document.getElementById('go').addEventListener('click', async () => {
  const title = document.getElementById('noteTitle').value.trim();
  const text = document.getElementById('noteInput').value.trim();
  const fontSize = +document.getElementById('fontSize').value || 12;
  const margin = +document.getElementById('margin').value || 40;
  const status = document.getElementById('status');

  if (!text) {
    status.textContent = 'Please enter some text.';
    return;
  }

  try {
    status.textContent = 'Building PDF…';

    const pdfDoc = await PDFLib.PDFDocument.create();
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);

    // page size = A4
    const pageWidth = 595.28, pageHeight = 841.89;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);

    const { height } = page.getSize();
    let y = height - margin;

    // draw title
    if (title) {
      page.drawText(title, {
        x: margin,
        y,
        size: fontSize + 4,
        font,
        color: PDFLib.rgb(0, 0, 0),
      });
      y -= fontSize + 12;
    }

    // split into lines
    const words = text.split(/\s+/);
    let line = '';
    const lineHeight = fontSize * 1.4;
    const maxWidth = pageWidth - margin * 2;

    const flushLine = () => {
      if (line) {
        page.drawText(line.trim(), { x: margin, y, size: fontSize, font });
        y -= lineHeight;
        line = '';
        if (y < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = height - margin;
        }
      }
    };

    words.forEach(w => {
      const testLine = line ? line + ' ' + w : w;
      const width = font.widthOfTextAtSize(testLine, fontSize);
      if (width > maxWidth) {
        flushLine();
        line = w;
      } else {
        line = testLine;
      }
    });
    flushLine();

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (title || 'note') + '.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = 'Done. Downloaded.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
