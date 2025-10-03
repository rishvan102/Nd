// assets/card-details.js
// One-line descriptions only (no bullets). Also removes any legacy ULs.

(() => {
  // Map file name (without .html) -> single-line description
  const desc = {
    // Docs
    "write": "Type notes into a neat A4 PDF",
    "txt2pdf": "Convert .txt or .md to PDF",

    // Convert
    "scan": "Capture pages using your camera",
    "images-to-pdf": "Combine multiple images into one PDF",
    "pdf-to-images": "Export PDF pages as PNG/JPG (ZIP)",
    "compress": "Reduce PDF size while preserving quality",

    // Organize
    "merge": "Combine multiple PDFs into one",
    "split": "Split a PDF by page ranges",
    "insert-blank": "Insert blank A4 pages at positions",
    "reorder": "Drag & drop pages into new order",
    "duplicate": "Append extra copies of selected pages",

    // Edit
    "rotate": "Rotate pages by 90/180/270°",
    "delete": "Remove selected pages",
    "extract": "Keep only specific pages",
    "numbers": "Add page numbers in header or footer",
    "watermark": "Add diagonal or text watermark",
    "crop": "Trim page margins by points",
    "stamp": "Add a small label to each page",
    "sign": "Place your PNG signature image",

    // Secure
    "metadata": "Create a copy with metadata removed",
    "redact": "Hide content by drawing black boxes"
  };

  const cards = document.querySelectorAll('.card.tool');
  if (!cards.length) return;

  function toolIdFromHref(href) {
    try {
      const url = new URL(href, window.location.href);
      const last = (url.pathname.split('/').pop() || '');
      return last.replace(/\.html?$/i, '');
    } catch {
      return '';
    }
  }

  cards.forEach(card => {
    // Remove any previously injected feature lists
    card.querySelectorAll('.card-features').forEach(el => el.remove());

    // Resolve tool id from href
    const href = card.getAttribute('href');
    if (!href) return;
    const id = toolIdFromHref(href);
    if (!id) return;

    // Set/normalize the single-line description
    const p = card.querySelector('p');
    if (!p) return;
    const text = desc[id];
    if (text) p.textContent = text;
  });
})();
