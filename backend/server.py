from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from typing import List, Optional
import json, re
from io import BytesIO
import fitz  # PyMuPDF

app = FastAPI()

# ✅ CORS: allow your front-end origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend-domain.com",   # change this
        "http://localhost:5173",              # dev
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/burn")
async def burn_pdf(
    pdf: UploadFile = File(...),                         # original PDF
    overlays: List[UploadFile] = File(default=[]),       # overlay_0.png, overlay_1.png...
    keep: Optional[str] = Form(None)                     # JSON array of page indexes to keep
):
    try:
        src_bytes = await pdf.read()
        doc = fitz.open(stream=src_bytes, filetype="pdf")

        # Keep only selected pages (optional)
        if keep:
            keep_idx = set(json.loads(keep))
            for i in reversed(range(len(doc))):
                if i not in keep_idx:
                    doc.delete_page(i)

        # Map overlay_X.png -> bytes
        by_index = {}
        for o in overlays:
            # expect filenames like overlay_3.png
            m = re.search(r"overlay_(\d+)\.png", o.filename or "")
            if not m:
                continue
            by_index[int(m.group(1))] = await o.read()

        # Burn overlays (full-page) on remaining pages
        for i, page in enumerate(doc):
            if i in by_index:
                rect = page.rect
                page.insert_image(rect, stream=by_index[i], keep_proportion=False, overlay=True)

        out = BytesIO()
        # small optimizations; safe defaults
        doc.save(out, deflate=True, clean=True, garbage=3)
        doc.close()
        out.seek(0)
        return Response(
            content=out.read(),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="edited.pdf"'}
        )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
