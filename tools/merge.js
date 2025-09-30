// merge.js — merge multiple PDFs into one using pdf-lib

async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}

document.getElementById('go').addEventListener('click', async () => {
  const fileInput = document.getElementById('files');
  const status = document.getElementById('status');

  const files = Array.from(fileInput.files || []);
  if (!files.length) {
    status.textContent = 'Pick at least 2 PDFs.';
    return;
  }

  try {
    status.textContent = 'Merging…';

    const out = await PDFLib.PDFDocument.create();

    for (const f of files) {
      const bytes = await fileToArrayBuffer(f);
      const src = await PDFLib.PDFDocument.load(bytes);
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach(p => out.addPage(p));
    }

    const mergedBytes = await out.save();
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'merged.pdf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = `Done! Merged ${files.length} file(s).`;
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});
