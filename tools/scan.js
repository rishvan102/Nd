// scan.js — camera capture → PDF

const $ = id => document.getElementById(id);

const video = $('video');
const thumbs = $('thumbs');
const statusEl = $('status');

let stream = null;
let shots = [];
let sortable = null;

$('open').addEventListener('click', async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    statusEl.textContent = 'Camera ready.';
  } catch (err) {
    statusEl.textContent = 'Camera error: ' + err.message;
  }
});

$('close').addEventListener('click', () => {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    video.srcObject = null;
    statusEl.textContent = 'Camera closed.';
  }
});

$('snap').addEventListener('click', () => {
  if (!stream) { statusEl.textContent = 'Camera not open.'; return; }
  const c = document.createElement('canvas');
  c.width = video.videoWidth;
  c.height = video.videoHeight;
  c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
  const dataUrl = c.toDataURL('image/jpeg', 0.92);
  shots.push(dataUrl);
  renderThumbs();
  statusEl.textContent = `${shots.length} page(s) captured.`;
});

function renderThumbs() {
  thumbs.innerHTML = '';
  shots.forEach((src, i) => {
    const div = document.createElement('div');
    div.className = 'thumb';
    div.dataset.index = i;
    div.innerHTML = `<button title="Remove">✕</button><img src="${src}" alt="Page ${i+1}">`;
    div.querySelector('button').onclick = () => { shots.splice(i, 1); renderThumbs(); };
    thumbs.appendChild(div);
  });

  if (!sortable && shots.length) {
    sortable = new Sortable(thumbs, {
      animation: 150,
      onEnd: () => {
        shots = Array.from(thumbs.children).map(el => shots[el.dataset.index]);
        renderThumbs();
      }
    });
  }
}

$('export').addEventListener('click', async () => {
  if (!shots.length) { statusEl.textContent = 'No pages captured.'; return; }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const margin = 24;

  for (let i = 0; i < shots.length; i++) {
    if (i > 0) pdf.addPage();
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = shots[i]; });
    const sW = img.naturalWidth, sH = img.naturalHeight;
    const maxW = pw - margin * 2, maxH = ph - margin * 2;
    const scale = Math.min(maxW / sW, maxH / sH);
    const dW = sW * scale, dH = sH * scale;
    const x = (pw - dW) / 2, y = (ph - dH) / 2;
    pdf.addImage(img, 'JPEG', x, y, dW, dH);
  }

  pdf.save('scan.pdf');
  statusEl.textContent = 'scan.pdf downloaded.';
});
