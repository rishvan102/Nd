// watermark.js — add text watermark to each PDF page using pdf-lib

async function fileToArrayBuffer(file) { return await file.arrayBuffer(); }

document.getElementById('go').addEventListener('click', async () => {
  const pdfFile = document.getElementById('pdfFile').files[0];
  const text = document.getElementById('wmText').value || 'CONFIDENTIAL';
  const size = Math.max(6, +document.getElementById('size').value || 48);
  const opacity = Math.min(1, Math.max(0, +document.getElementById('opacity').value || 0.2));
  const angle = ((+document.getElementById('angle').value || 0) % 360 + 360) % 360;
  const mode = document.getElementById('mode').value;
  const colorHex = document.getElementById('color').value;
  const status = document.getElementById('status');

  if (!pdfFile) {
    status.textContent = 'Please choose a PDF file.';
    return;
  }

  try {
    status.textContent = 'Applying watermark…';

    const srcBytes = await fileToArrayBuffer(pdfFile);
    const pdf = await PDFLib.PDFDocument.load(srcBytes);
    const font = await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold);

    const rgb = hexToRgb(colorHex) || { r: 0.8, g: 0.1, b: 0.1 };

    pdf.getPages().forEach(p => {
      const { width, height } = p.getSize();

      if (mode === 'single') {
        const x = width / 2;
        const y = height / 2;
        p.drawText(text, {
          x, y,
          size,
          font,
          color: PDFLib.rgb(rgb.r, rgb.g, rgb.b),
          rotate: PDFLib.degrees(angle),
          opacity,
          xSkew: 0,
          ySkew: 0,
        });
      } else {
        // tiled mode
        const stepX = width / 3;
        const stepY = height / 3;
        for (let x = stepX / 2; x < width; x += stepX) {
          for (let y = stepY / 2; y < height; y += stepY) {
            p.drawText(text, {
              x, y,
              size,
              font,
              color: PDFLib.rgb(rgb.r, rgb.g, rgb.b),
              rotate: PDFLib.degrees(angle),
              opacity,
            });
          }
        }
      }
    });

    const bytes = await pdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'watermarked.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = 'Done. watermarked.pdf downloaded.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255
  } : null;
}
