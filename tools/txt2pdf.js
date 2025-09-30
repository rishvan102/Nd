// txt2pdf.js — combine .txt/.md files into a single A4 PDF using jsPDF

const $ = (id) => document.getElementById(id);

$('go').addEventListener('click', async () => {
  const files = Array.from($('files').files || []);
  const title = ($('docTitle').value || '').trim();
  const outName = sanitizeName($('outName').value || 'notes.pdf');
  const fontName = $('font').value;
  const fontSize = clamp(+$('fontSize').value || 11, 6, 48);
  const margin = clamp(+$('margin').value || 36, 0, 96);
  const pageBreaks = $('pageBreaks').checked;
  const mdHeadings = $('useMdHeadings').checked;
  const status = $('status');

  if (!files.length) {
    status.textContent = 'Please choose at least one .txt or .md file.';
    return;
  }

  try {
    status.textContent = 'Reading files…';

    // Read all files as text (in selection order)
    const sections = [];
    for (const f of files) {
      const text = await f.text();
      sections.push({ name: stripExt(f.name), text });
    }

    status.textContent = 'Building PDF…';

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });

    // Dimensions
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const usableW = pageW - margin * 2;

    // Fonts
    const fontMap = {
      Helvetica: 'helvetica',
      Times: 'times',
      Courier: 'courier',
    };
    pdf.setFont(fontMap[fontName] || 'helvetica', 'normal');

    let y = margin;

    // Optional document title
    if (title) {
      pdf.setFontSize(fontSize + 5);
      pdf.setFont(fontMap[fontName] || 'helvetica', 'bold');
      const lines = pdf.splitTextToSize(title, usableW);
      y = drawLines(pdf, lines, margin, y, pageH, margin, fontSize + 5, { bold: true });
      y += 8; // small spacer
      pdf.setFont(fontMap[fontName] || 'helvetica', 'normal');
    }

    pdf.setFontSize(fontSize);

    // Render each section
    for (let s = 0; s < sections.length; s++) {
      const sec = sections[s];

      // Section heading from filename
      pdf.setFont(fontMap[fontName] || 'helvetica', 'bold');
      pdf.setFontSize(fontSize + 2);
      const secTitle = prettifyTitle(sec.name);
      const headLines = pdf.splitTextToSize(secTitle, usableW);
      y = ensurePageSpace(pdf, y, headLines.length * (fontSize + 2) * 1.2, pageH, margin, () => (y = margin));
      y = drawLines(pdf, headLines, margin, y, pageH, margin, fontSize + 2, { bold: true });
      y += 6;
      pdf.setFont(fontMap[fontName] || 'helvetica', 'normal');
      pdf.setFontSize(fontSize);

      // Body: simple Markdown-aware rendering (headings only)
      const paragraphs = sec.text.replace(/\r\n/g, '\n').split('\n');
      for (let i = 0; i < paragraphs.length; i++) {
        let line = paragraphs[i];

        // Blank line => spacer
        if (/^\s*$/.test(line)) {
          y += fontSize * 0.6;
          if (y > pageH - margin) { pdf.addPage(); y = margin; }
          continue;
        }

        // Markdown headings
        if (mdHeadings && /^#{1,6}\s+/.test(line)) {
          const level = Math.min(6, line.match(/^#+/)[0].length);
          line = line.replace(/^#{1,6}\s+/, '');

          const hSize = clamp(fontSize + (7 - level), fontSize + 1, fontSize + 6);
          pdf.setFont(fontMap[fontName] || 'helvetica', 'bold');
          pdf.setFontSize(hSize);
          const lines = pdf.splitTextToSize(line, usableW);
          y = ensurePageSpace(pdf, y, lines.length * hSize * 1.25, pageH, margin, () => (y = margin));
          y = drawLines(pdf, lines, margin, y, pageH, margin, hSize, { bold: true, lineHeight: 1.25 });
          pdf.setFont(fontMap[fontName] || 'helvetica', 'normal');
          pdf.setFontSize(fontSize);
          y += 4;
          continue;
        }

        // Regular paragraph
        const lines = pdf.splitTextToSize(line, usableW);
        y = ensurePageSpace(pdf, y, lines.length * fontSize * 1.2, pageH, margin, () => (y = margin));
        y = drawLines(pdf, lines, margin, y, pageH, margin, fontSize, { lineHeight: 1.2 });
      }

      // Section separator
      if (s < sections.length - 1) {
        if (pageBreaks) {
          pdf.addPage();
          y = margin;
        } else {
          y += fontSize * 1.4;
          if (y > pageH - margin) { pdf.addPage(); y = margin; }
        }
      }
    }

    pdf.save(outName);
    status.textContent = `Done. Saved “${outName}”.`;
  } catch (err) {
    console.error(err);
    status.textContent = 'Error: ' + (err?.message || err);
  }
});

/* ---------- helpers ---------- */

function sanitizeName(name) {
  name = name.trim();
  if (!/\.pdf$/i.test(name)) name += '.pdf';
  return name.replace(/[\\/:*?"<>|]+/g, '_');
}
function stripExt(name) {
  return name.replace(/\.[^.]+$/, '');
}
function prettifyTitle(s) {
  return s.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

/**
 * Draw array of lines with auto paging
 */
function drawLines(pdf, lines, x, y, pageH, margin, size, opts = {}) {
  const lh = size * (opts.lineHeight || 1.2);
  lines.forEach(line => {
    if (y > pageH - margin) { pdf.addPage(); y = margin; }
    if (opts.bold) pdf.setFont(undefined, 'bold');
    pdf.text(line, x, y);
    if (opts.bold) pdf.setFont(undefined, 'normal');
    y += lh;
  });
  return y;
}

/**
 * Ensure there is enough vertical space; if not, add a page and call onNewPage()
 */
function ensurePageSpace(pdf, y, needed, pageH, margin, onNewPage) {
  if (y + needed > pageH - margin) {
    pdf.addPage();
    onNewPage();
  }
  return y;
}
