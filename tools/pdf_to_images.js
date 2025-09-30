/* pdf_to_images.js  — NiceDay PDF Jar
 * Export PDF pages to images (PNG / JPEG / WebP) inside a single ZIP
 * Requires: pdf.js (pdfjsLib), JSZip
 */

(() => {
  const $ = (id) => document.getElementById(id);

  // UI
  const fileEl = $('file');
  const fmtEl = $('fmt');
  const scaleEl = $('scale');
  const qualityEl = $('quality');
  const baseEl = $('basename');
  const pagesEl = $('pages');
  const goBtn = $('go');
  const cancelBtn = $('cancel');
  const bar = $('bar');
  const barIn = $('barIn');
  const statusEl = $('status');

  // PDF state
  let pdfDoc = null;
  let cancelFlag = false;

  // --- Helpers -------------------------------------------------------------

  function setStatus(msg, isErr = false) {
    statusEl.textContent = msg || '';
    statusEl.className = 'status' + (isErr ? ' err' : '');
  }

  function setProgress(p) {
    // p in [0,1]
    if (p > 0 && p < 1) {
      bar.style.display = 'block';
      barIn.style.width = Math.round(p * 100) + '%';
    } else {
      bar.style.display = 'none';
      barIn.style.width = '0%';
    }
  }

  function pad(n, width) {
    const s = String(n);
    return s.length >= width ? s : '0'.repeat(width - s.length) + s;
  }

  // Parse "1-3,7,10" into [1,2,3,7,10], clamp to [1..max]
  function parseRanges(str, max) {
    if (!str) return [];
    const out = new Set();
    str.split(',').map(s => s.trim()).forEach(part => {
      if (!part) return;
      if (part.includes('-')) {
        const [aStr, bStr] = part.split('-');
        const a = Number(aStr), b = Number(bStr);
        if (Number.isFinite(a) && Number.isFinite(b) && a >= 1 && b >= a) {
          for (let i = a; i <= b; i++) out.add(i);
        }
      } else {
        const n = Number(part);
        if (Number.isFinite(n) && n >= 1) out.add(n);
      }
    });
    return [...out].filter(n => n <= max).sort((x, y) => x - y);
  }

  async function nextFrame() {
    return new Promise(r => requestAnimationFrame(r));
  }

  // --- Load PDF when a file is chosen -------------------------------------

  fileEl.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) { pdfDoc = null; setStatus('No file selected.'); return; }
    setStatus('Loading PDF…');
    setProgress(0);
    cancelFlag = false;
    try {
      const buf = await f.arrayBuffer();
      pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
      setStatus(`Loaded ${pdfDoc.numPages} pages. Choose options and press “Export (ZIP)”.`);
    } catch (err) {
      console.error(err);
      pdfDoc = null;
      setStatus('Failed to load PDF.', true);
    } finally {
      setProgress(0);
    }
  });

  // --- Export --------------------------------------------------------------

  goBtn.addEventListener('click', async () => {
    if (!pdfDoc) { setStatus('Please choose a PDF first.', true); return; }

    const fmt = fmtEl.value;                       // png | jpeg | webp
    const scale = Math.max(0.25, Number(scaleEl.value) || 1);
    const quality = Math.min(0.95, Math.max(0.3, Number(qualityEl.value) || 0.92));
    const base = (baseEl.value || 'page').trim();
    const pageCount = pdfDoc.numPages;

    // Which pages?
    let pages = parseRanges(pagesEl.value, pageCount);
    if (pages.length === 0) {
      pages = Array.from({ length: pageCount }, (_, i) => i + 1);
    }

    // Prepare zip
    const zip = new JSZip();

    // UI state
    cancelFlag = false;
    goBtn.disabled = true;
    cancelBtn.disabled = false;
    setStatus('Rendering pages…');
    setProgress(0);

    try {
      const digits = String(pages[pages.length - 1]).length; // padding width based on max page index in selection

      // Render page-by-page
      for (let idx = 0; idx < pages.length; idx++) {
        if (cancelFlag) throw new Error('Cancelled');
        const pNum = pages[idx];

        // Get page & viewport
        const page = await pdfDoc.getPage(pNum);
        const vp = page.getViewport({ scale: scale });

        // Create canvas with some safety max (pdf.js can handle large, but avoid > 8192)
        const maxSide = 8192;
        const tgtScale = Math.min(1, maxSide / Math.max(vp.width, vp.height));
        const width = Math.floor(vp.width * tgtScale);
        const height = Math.floor(vp.height * tgtScale);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = width;
        canvas.height = height;

        // Render
        const renderTask = page.render({
          canvasContext: ctx,
          viewport: page.getViewport({ scale: scale * tgtScale })
        });
        await renderTask.promise;

        // To blob
        let blob;
        if (fmt === 'png') {
          blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        } else if (fmt === 'jpeg') {
          blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
        } else { // webp
          blob = await new Promise(res => canvas.toBlob(res, 'image/webp', quality));
        }
        if (!blob) throw new Error('Failed to encode image.');

        // Add to zip with tidy name
        const name = `${base}-${pad(pNum, digits)}.${fmt === 'jpeg' ? 'jpg' : fmt}`;
        zip.file(name, blob);

        // Update progress
        setProgress((idx + 1) / pages.length);
        setStatus(`Rendered page ${pNum} / ${pages[pages.length - 1]}`);
        // Yield to UI a bit (keeps mobile responsive)
        await nextFrame();
      }

      setStatus('Packaging ZIP…');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);

      // Download
      const a = document.createElement('a');
      a.href = url;
      a.download = (base || 'pages') + '.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();

      setStatus('Done. ZIP downloaded.');
      window.showCelebration?.(url);
    } catch (err) {
      if (err && err.message === 'Cancelled') {
        setStatus('Export cancelled.');
      } else {
        console.error(err);
        setStatus('Error during export.', true);
      }
    } finally {
      setProgress(0);
      goBtn.disabled = false;
      cancelBtn.disabled = true;
      cancelFlag = false;
    }
  });

  // Cancel button
  cancelBtn.addEventListener('click', () => {
    cancelFlag = true;
    cancelBtn.disabled = true;
    setStatus('Stopping…');
  });
})();
