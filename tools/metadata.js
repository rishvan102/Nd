// metadata.js — view and edit PDF metadata with pdf-lib

async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}

let loadedDoc = null;
let loadedBytes = null;

document.getElementById("file").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  const status = document.getElementById("status");
  if (!f) return;

  try {
    status.textContent = "Loading PDF…";
    loadedBytes = await fileToArrayBuffer(f);
    loadedDoc = await PDFLib.PDFDocument.load(loadedBytes);

    const meta = loadedDoc.getTitle?.() || "";
    const author = loadedDoc.getAuthor?.() || "";
    const subject = loadedDoc.getSubject?.() || "";
    const keywords = loadedDoc.getKeywords?.()?.join(", ") || "";

    document.getElementById("title").value = meta;
    document.getElementById("author").value = author;
    document.getElementById("subject").value = subject;
    document.getElementById("keywords").value = keywords;

    document.getElementById("metaForm").style.display = "block";
    status.textContent = "Metadata loaded.";
  } catch (err) {
    console.error(err);
    status.textContent = "Error: " + (err?.message || err);
  }
});

document.getElementById("saveBtn").addEventListener("click", async () => {
  if (!loadedDoc) return;
  const status = document.getElementById("status");

  try {
    loadedDoc.setTitle(document.getElementById("title").value || "");
    loadedDoc.setAuthor(document.getElementById("author").value || "");
    loadedDoc.setSubject(document.getElementById("subject").value || "");

    const kw = document.getElementById("keywords").value
      .split(",")
      .map(k => k.trim())
      .filter(Boolean);
    if (kw.length) loadedDoc.setKeywords(kw);

    const bytes = await loadedDoc.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "metadata.pdf";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    status.textContent = "Updated metadata saved!";
  } catch (err) {
    console.error(err);
    status.textContent = "Error: " + (err?.message || err);
  }
});
