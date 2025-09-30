// sign.js — stamp a signature image on all (or first) pages of a PDF

async function fileToArrayBuffer(file) { return await file.arrayBuffer(); }
async function fileToUint8Array(file) { return new Uint8Array(await file.arrayBuffer()); }

document.getElementById('go').addEventListener('click', async () => {
  const pdfFile = document.getElementById('pdfFile').files[0];
  const imgFile = document.getElementById('imgFile').files[0];
  const widthPx = parseInt(document.getElementById('sigWidth').value, 10) || 120;
  const marginX = parseInt(document.getElementById('marginX').value, 10) || 24;
  const marginY = parseInt(document.getElementById('marginY').value, 10) || 24;
  const pos     = document.getElementById('pos').value;
  const firstOnly = document.getElementById('firstPageOnly').checked;
  const status  = document.getElementById('status');

  if (!pdfFile || !imgFile) {
    status.textContent = 'Please select a PDF and signature image.';
    return;
  }

  try {
    status.textContent = 'Applying signature…';

    const srcBytes = await fileToArrayBuffer(pdfFile);
    const src = await PDFLib.PDFDocument.load(srcBytes);

    const imgBytes = await fileToUint8Array(imgFile);
    let sigImg;
    if (imgFile.type === 'image/png') {
      sigImg = await src.embedPng(imgBytes);
    } else {
      sigImg = await src.embedJpg(imgBytes);
    }

    const sigDims = sigImg.scale(widthPx / sigImg.width);

    const total = src.getPageCount();
    for (let i = 0; i < total; i++) {
      if (firstOnly && i > 0) break;
      const p = src.getPage(i);
      const { width, height } = p.getSize();
      let x = marginX, y = marginY;
      switch (pos) {
        case 'br': x = width - sigDims.width - marginX; y = marginY; break;
        case 'bl': x = marginX; y = marginY; break;
        case 'tr': x = width - sigDims.width - marginX; y = height - sigDims.height - marginY; break;
        case 'tl': x = marginX; y = height - sigDims.height - marginY; break;
      }
      p.drawImage(sigImg, { x, y, width: sigDims.width, height: sigDims.height });
    }

    const bytes = await src.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'signed.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = 'Done. signed.pdf downloaded.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
