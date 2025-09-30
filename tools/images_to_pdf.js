// images_to_pdf.js — combine selected images into one PDF

document.getElementById('go').addEventListener('click', async () => {
  const input = document.getElementById('imgInput');
  const status = document.getElementById('status');
  const files = Array.from(input.files || []);

  if (!files.length) {
    status.textContent = 'Please select one or more images.';
    return;
  }

  status.textContent = 'Building PDF…';

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const margin = 24;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await readFileAsDataURL(file);
      const img = await loadImage(dataUrl);

      if (i > 0) pdf.addPage();

      const maxW = pw - margin * 2;
      const maxH = ph - margin * 2;
      const scale = Math.min(maxW / img.width, maxH / img.height);

      const dw = img.width * scale;
      const dh = img.height * scale;
      const x = (pw - dw) / 2;
      const y = (ph - dh) / 2;

      pdf.addImage(img, file.type.includes("png") ? "PNG" : "JPEG", x, y, dw, dh);
    }

    pdf.save('images.pdf');
    status.textContent = 'Done! Download started.';
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
