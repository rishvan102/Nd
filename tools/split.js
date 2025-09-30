// split.js — split a PDF into multiple PDFs by ranges, download as ZIP

const $ = (id) => document.getElementById(id);

function sanitizeBase(s) {
  return (s || 'part').trim().replace(/[^a-z0-9._-]+/gi, '_');
}

/**
 * Parse a comma-separated ranges string into an array of arrays of 0-based indices.
 * Example: "1-3,5,9-10" -> [ [0,1,2], [4], [8,9] ]
 */
function parseGroups(str, max) {
  const groups = [];
  if (!str) return groups;

  for (const token of String(str).split(',')) {
    const part = token.trim();
    if (!part) continue;

    const m = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;

    let a = +m[1], b = m[2] ? +m[2] : a;
    if (a > b) [a, b] = [b, a];

    // clamp to [1, max]
    a = Math.max(1, a);
    b = max ? Math.min(max, b) : b;
    if (max && a > max) continue;

    const indices = [];
    for (let n = a; n <= b; n++) indices.push(n - 1);
    if (indices.length) groups.push(indices);
  }
  return groups;
}

async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}

$('go').addEventListener('click', async () => {
  const f = $('file').files[0];
  const ranges = $('ranges').value;
  const base = sanitizeBase($('base').value);
  const pad = Math.max(1, Math.min(4, parseInt($('pad').value || '2', 10)));
  const status = $('status');

  if (!f) { status.textContent = 'Pick a PDF first.'; return; }

  try {
    status.textContent = 'Loading PDF…';
    const srcBytes = await fileToArrayBuffer(f);
    const src = await PDFLib.PDFDocument.load(srcBytes);
    const total = src.getPageCount();

    const groups = parseGroups(ranges, total);
    if (!groups.length) { status.textContent = 'Enter valid ranges (e.g., 1-3,5).'; return; }

    status.textContent = `Splitting into ${groups.length} file(s)…`;

    const zip = new JSZip();

    for (let i = 0; i < groups.length; i++) {
      status.textContent = `Creating part ${i + 1} of ${groups.length}…`;
      const out = await PDFLib.PDFDocument.create();
      const pages = await out.copyPages(src, groups[i]);
      pages.forEach(p => out.addPage(p));

      const bytes = await out.save();
      const name = `${base}-${String(i + 1).padStart(pad, '0')}.pdf`;
      zip.file(name, bytes);
    }

    status.textContent = 'Packaging ZIP…';
    const blob = await zip.generateAsync({ type: 'blob' });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${base}-split.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = `Done. Created ${groups.length} file(s).`;
  } catch (err) {
    console.error(err);
    $('status').textContent = 'Error: ' + (err?.message || err);
  }
});
