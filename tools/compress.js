/* tools/compress.js
   Compress (rasterize) PDF pages to images, rebuild a smaller PDF with jsPDF
*/
(async () => {
  const { jsPDF } = window.jspdf || {};

  const input   = document.getElementById('cmpInput');
  const btn     = document.getElementById('cmpBtn');
  const scaleEl = document.getElementById('cmpScale');
  const qualEl  = document.getElementById('cmpQuality');
  const fmtEl   = document.getElementById('cmpFormat');

  const UI = window.__cmpUI__ || {
    setStatus(){}, setProgress(){}, addPreview(){}, clearPreviews(){}
  };

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function status(s){ UI.setStatus(s); }
  function progress(p){ UI.setProgress(p); }

  async function readAsArrayBuffer(file){
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsArrayBuffer(file);
    });
  }

  // Render a single page to canvas
  async function renderPageToCanvas(pdf, pageIndex, scale=1){
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const deviceScale = clamp(Number(scale) || 1, 0.3, 2.5);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: false, alpha: false });

    canvas.width  = Math.floor(viewport.width  * deviceScale);
    canvas.height = Math.floor(viewport.height * deviceScale);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport: page.getViewport({ scale: deviceScale })
    });

    await renderTask.promise;
    return canvas;
  }

  // Convert canvas to data URL with chosen format/quality
  function canvasToDataURL(canvas, format='jpeg', quality=0.8){
    if (format === 'png') return canvas.toDataURL('image/png');
    return canvas.toDataURL('image/jpeg', clamp(Number(quality) || 0.8, 0.3, 0.95));
  }

  // Build a new PDF from an array of {img, w, h}
  async function buildPDFFromImages(pages, filename='compressed.pdf'){
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'p' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const margin = 24;

    pages.forEach((pg, i) => {
      if (i > 0) pdf.addPage();
      const maxW = pw - margin * 2;
      const maxH = ph - margin * 2;
      const sW = pg.w, sH = pg.h;
      const s = Math.min(maxW / sW, maxH / sH);
      const dW = sW * s, dH = sH * s;
      const x = (pw - dW) / 2, y = (ph - dH) / 2;
      pdf.addImage(pg.img, pg.type, x, y, dW, dH);
    });

    pdf.save(filename);

    // 🔔 Guaranteed celebration hook
    if (window.ndCelebrate) {
      window.ndCelebrate(`“${filename}” — Small steps make big things.`);
    }
  }

  async function run(){
    try {
      const file = input.files?.[0];
      if (!file) { alert('Choose a PDF first.'); return; }

      UI.clearPreviews();
      status('Loading PDF…'); progress(0);

      const ab = await readAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;

      const total = pdf.numPages;
      const scale = Number(scaleEl.value) || 1;
      const quality = Number(qualEl.value) || 0.8;
      const format = (fmtEl.value || 'jpeg').toLowerCase();
      const imgType = (format === 'png') ? 'PNG' : 'JPEG';

      status(`Rendering ${total} page(s)…`);
      const pages = [];

      for (let i = 0; i < total; i++) {
        status(`Rendering page ${i+1}/${total}…`);
        const canvas = await renderPageToCanvas(pdf, i, scale);

        // show a few previews
        if (i < 6) {
          const prev = document.createElement('canvas');
          // Copy bitmap cheaply
          prev.width = canvas.width; prev.height = canvas.height;
          prev.getContext('2d').drawImage(canvas, 0, 0);
          UI.addPreview(prev);
        }

        const dataUrl = canvasToDataURL(canvas, format, quality);
        const img = dataUrl;
        pages.push({ img, w: canvas.width, h: canvas.height, type: imgType });

        progress((i + 0.5) / total);
        // Yield to UI
        await new Promise(r => setTimeout(r, 0));
      }

      status('Building PDF…'); progress(0.98);
      const outName = (file.name.replace(/\.pdf$/i,'') || 'compressed') + '-compressed.pdf';
      await buildPDFFromImages(pages, outName);

      status('Done. ✨'); progress(1);
      setTimeout(() => progress(0), 600);
    } catch (err) {
      console.error(err);
      status('Error: ' + (err?.message || err));
      progress(0);
    }
  }

  btn?.addEventListener('click', run);
})();
