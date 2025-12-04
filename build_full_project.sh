#!/usr/bin/env bash
set -e

PROJECT_ROOT="accessible-epub-system"

echo "Creating project at: $PROJECT_ROOT"
rm -rf "$PROJECT_ROOT"
mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"

########################################
# BACKEND
########################################
mkdir -p backend/app/models backend/app/routes backend/app/services backend/app/utils

cat > backend/requirements.txt << 'EOF'
fastapi
uvicorn[standard]
pydantic
python-multipart
ebooklib
beautifulsoup4
lxml
PyMuPDF
python-dotenv
google-generativeai
EOF

cat > backend/.env.template << 'EOF'
GEMINI_API_KEY=YOUR_KEY_HERE
MODEL=gemini-1.5-pro
EOF

cat > backend/app/__init__.py << 'EOF'
# backend app package
EOF

cat > backend/app/config.py << 'EOF'
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL = os.getenv("MODEL", "gemini-1.5-pro")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
EOF

cat > backend/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import convert, qc, suggest

app = FastAPI(title="Accessible EPUB Converter – Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(convert.router, prefix="/convert", tags=["Convert"])
app.include_router(qc.router, prefix="/qc", tags=["QC"])
app.include_router(suggest.router, prefix="/suggest", tags=["Suggest"])


@app.get("/")
def home():
    return {"status": "Backend OK"}
EOF

cat > backend/app/models/convert_models.py << 'EOF'
from pydantic import BaseModel
from typing import List


class AccessibleEPUB(BaseModel):
    accessible_html: str
    notes: List[str]
    percentage: float


class ConvertResponse(BaseModel):
    accessible: AccessibleEPUB
EOF

cat > backend/app/models/qc_models.py << 'EOF'
from pydantic import BaseModel
from typing import List


class QCReport(BaseModel):
    status: str
    errors: List[str]
    warnings: List[str]
EOF

cat > backend/app/models/suggest_models.py << 'EOF'
from pydantic import BaseModel


class SuggestRequest(BaseModel):
    html_tag: str
    context_html: str
EOF

cat > backend/app/utils/logger.py << 'EOF'
def log(msg: str):
    print(f"[LOG] {msg}")
EOF

cat > backend/app/services/gemini_service.py << 'EOF'
from typing import Dict, Any
from app.config import GEMINI_API_KEY, MODEL

try:
    import google.generativeai as gen
    if GEMINI_API_KEY:
        gen.configure(api_key=GEMINI_API_KEY)
    _HAS_GEMINI = True
except Exception:
    _HAS_GEMINI = False


def run_gemini(prompt: str, expect_json: bool = True) -> Dict[str, Any]:
    if not GEMINI_API_KEY or not _HAS_GEMINI:
        # Fallback: simple echo-like behavior
        return {
            "accessible_html": "",
            "notes": ["Gemini not configured, running in fallback mode."],
            "percentage": 0,
            "suggested_tag": "P",
        }

    model = gen.GenerativeModel(MODEL)
    resp = model.generate_content(prompt)

    if not expect_json:
        return {"raw": resp.text}

    import json
    try:
        return json.loads(resp.text)
    except Exception:
        return {
            "accessible_html": "",
            "notes": ["Failed to parse Gemini JSON response."],
            "percentage": 0,
        }
EOF

cat > backend/app/services/epub_service.py << 'EOF'
from ebooklib import epub


def extract_epub_html(epub_path: str) -> str:
    book = epub.read_epub(epub_path)
    parts = []
    for item in book.get_items():
        if item.get_type() == epub.ITEM_DOCUMENT:
            parts.append(item.get_content().decode("utf-8", errors="ignore"))
    return "\n".join(parts)
EOF

cat > backend/app/services/pdf_service.py << 'EOF'
import fitz


def extract_pdf_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    texts = [page.get_text() for page in doc]
    return "\n".join(texts)
EOF

cat > backend/app/services/qc_service.py << 'EOF'
from bs4 import BeautifulSoup
from app.models.qc_models import QCReport


def run_qc(accessible_html: str) -> QCReport:
    soup = BeautifulSoup(accessible_html, "lxml")
    errors = []
    warnings = []

    # ALT text check
    for img in soup.find_all("img"):
        if not img.get("alt"):
            errors.append("Image missing ALT text.")

    # Heading hierarchy check
    last_level = 0
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        level = int(tag.name[1])
        if last_level and level > last_level + 1:
            warnings.append(
                f"Heading jump from h{last_level} to h{level}: {tag.get_text(strip=True)[:50]}"
            )
        last_level = level

    status = "pass"
    if errors:
        status = "fail"
    elif warnings:
        status = "pass-with-warnings"

    return QCReport(status=status, errors=errors, warnings=warnings)
EOF

cat > backend/app/routes/convert.py << 'EOF'
from fastapi import APIRouter, UploadFile, File, Form
from pathlib import Path
from app.config import UPLOAD_DIR
from app.services.epub_service import extract_epub_html
from app.services.pdf_service import extract_pdf_text
from app.services.gemini_service import run_gemini
from app.models.convert_models import ConvertResponse, AccessibleEPUB

router = APIRouter()


@router.post("", response_model=ConvertResponse)
async def convert_epub(
    publisher: str = Form(...),
    epub_file: UploadFile = File(...),
    pdf_file: UploadFile | None = None,
):
    upload_dir = Path(UPLOAD_DIR)
    epub_path = upload_dir / epub_file.filename
    epub_path.write_bytes(await epub_file.read())

    html = extract_epub_html(str(epub_path))

    pdf_text = ""
    if pdf_file:
        pdf_path = upload_dir / pdf_file.filename
        pdf_path.write_bytes(await pdf_file.read())
        pdf_text = extract_pdf_text(str(pdf_path))

    prompt = (
        "Convert the following EPUB HTML into accessible HTML. "
        "Return JSON with keys: accessible_html (string), notes (array of strings), "
        "percentage (number 0-100). "
        f"EPUB_HTML: ```{html}```\nPDF_TEXT: ```{pdf_text}```"
    )

    ai = run_gemini(prompt, expect_json=True)

    return ConvertResponse(
        accessible=AccessibleEPUB(
            accessible_html=ai.get("accessible_html", html),
            notes=ai.get("notes", []),
            percentage=ai.get("percentage", 0),
        )
    )
EOF

cat > backend/app/routes/qc.py << 'EOF'
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.qc_service import run_qc
from app.models.qc_models import QCReport

router = APIRouter()


class QCRequest(BaseModel):
    html: str


@router.post("", response_model=QCReport)
def qc(req: QCRequest):
    return run_qc(req.html)
EOF

cat > backend/app/routes/suggest.py << 'EOF'
from fastapi import APIRouter
from app.models.suggest_models import SuggestRequest
from app.services.gemini_service import run_gemini

router = APIRouter()


@router.post("")
def suggest(req: SuggestRequest):
    prompt = (
        "You are an accessibility tagging assistant. "
        "Given a source HTML tag and some HTML context, suggest the best accessible semantic tag. "
        "Return strict JSON: {\"suggested_tag\": \"H1\"}.\n\n"
        f"HTML_TAG: {req.html_tag}\nCONTEXT_HTML: ```{req.context_html}```"
    )
    ai = run_gemini(prompt, expect_json=True)
    return ai
EOF

########################################
# FRONTEND
########################################
mkdir -p frontend/src/{modules,components,layouts,styles,modules/convert,modules/mapping,modules/qc,modules/epub,modules/pdf,router}

cat > frontend/package.json << 'EOF'
{
  "name": "accessible-epub-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0"
  }
}
EOF

cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
});
EOF

cat > frontend/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Accessible EPUB Converter</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="root"></div>

    <!-- EPUB.js from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>

    <!-- PDF.js from CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
      window.pdfjsLib = window["pdfjs-dist/build/pdf"];
      // Worker is embedded in pdf.min.js CDN build
    </script>

    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

cat > frontend/jsconfig.json << 'EOF'
{
  "compilerOptions": {
    "baseUrl": "./src"
  },
  "include": ["src"]
}
EOF

cat > frontend/src/main.jsx << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
EOF

cat > frontend/src/App.jsx << 'EOF'
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ConvertPage from "./modules/convert/ConvertPage";
import MappingPage from "./modules/mapping/MappingPage";
import QCPage from "./modules/qc/QCPage";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/convert" replace />} />
        <Route path="/convert" element={<ConvertPage />} />
        <Route path="/mapping" element={<MappingPage />} />
        <Route path="/qc" element={<QCPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
EOF

cat > frontend/src/layouts/MainLayout.jsx << 'EOF'
import React from "react";
import TopNav from "../components/TopNav";

const layoutStyle = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
};

const contentStyle = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  backgroundColor: "#f5f5f5",
};

function MainLayout({ children }) {
  return (
    <div style={layoutStyle}>
      <TopNav />
      <main style={contentStyle}>{children}</main>
    </div>
  );
}

export default MainLayout;
EOF

cat > frontend/src/components/TopNav.jsx << 'EOF'
import React from "react";
import { NavLink } from "react-router-dom";

const navStyle = {
  display: "flex",
  alignItems: "center",
  padding: "0.5rem 1rem",
  backgroundColor: "#1f2933",
  color: "#fff",
  gap: "1rem",
  fontSize: "0.95rem",
};

const linkStyle = {
  color: "#cbd2d9",
  textDecoration: "none",
  padding: "0.35rem 0.75rem",
  borderRadius: "4px",
};

const activeStyle = {
  ...linkStyle,
  backgroundColor: "#3e4c59",
  color: "#f9fafb",
};

function TopNav() {
  return (
    <header style={navStyle}>
      <div style={{ fontWeight: "600" }}>Accessible EPUB System</div>
      <NavLink
        to="/convert"
        style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
      >
        Convert
      </NavLink>
      <NavLink
        to="/mapping"
        style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
      >
        Tag Mapping
      </NavLink>
      <NavLink
        to="/qc"
        style={({ isActive }) => (isActive ? activeStyle : linkStyle)}
      >
        QC
      </NavLink>
    </header>
  );
}

export default TopNav;
EOF

cat > frontend/src/styles/global.css << 'EOF'
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background-color: #e5e7eb;
}

h1,
h2,
h3 {
  margin: 0 0 0.5rem 0;
}

p {
  margin: 0.25rem 0;
}

button {
  font-family: inherit;
  cursor: pointer;
}
EOF

########################################
# CONVERT PAGE + EPUB/PDF VIEWERS
########################################
cat > frontend/src/modules/epub/EPUBViewer.jsx << 'EOF'
import React, { useEffect, useRef } from "react";

function EPUBViewer({ file }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!file || !window.ePub) return;

    const blobURL = URL.createObjectURL(file);
    const book = window.ePub(blobURL);

    viewerRef.current.innerHTML = "";
    const rendition = book.renderTo(viewerRef.current, {
      width: "100%",
      height: "100%",
      flow: "scrolled",
    });

    rendition.display();

    return () => {
      URL.revokeObjectURL(blobURL);
    };
  }, [file]);

  const containerStyle = {
    width: "100%",
    height: "100%",
    overflow: "auto",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    backgroundColor: "#fff",
  };

  return (
    <div style={containerStyle}>
      <div
        ref={viewerRef}
        style={{ width: "100%", height: "100%", minHeight: "500px" }}
      ></div>
    </div>
  );
}

export default EPUBViewer;
EOF

cat > frontend/src/modules/pdf/usePDF.js << 'EOF'
import { useRef, useState } from "react";

export default function usePDF() {
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);

  const renderPage = async (pdf, num, scaleValue) => {
    const page = await pdf.getPage(num);
    const viewport = page.getViewport({ scale: scaleValue });

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport,
    };

    await page.render(renderContext).promise;
  };

  const loadPDF = async (file) => {
    const url = URL.createObjectURL(file);
    const pdf = await window.pdfjsLib.getDocument(url).promise;
    setPdfDoc(pdf);
    setPageNum(1);
    await renderPage(pdf, 1, scale);
  };

  const nextPage = async () => {
    if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
    const next = pageNum + 1;
    setPageNum(next);
    await renderPage(pdfDoc, next, scale);
  };

  const prevPage = async () => {
    if (!pdfDoc || pageNum <= 1) return;
    const prev = pageNum - 1;
    setPageNum(prev);
    await renderPage(pdfDoc, prev, scale);
  };

  const zoomIn = async () => {
    if (!pdfDoc) return;
    const newScale = scale + 0.2;
    setScale(newScale);
    await renderPage(pdfDoc, pageNum, newScale);
  };

  const zoomOut = async () => {
    if (!pdfDoc) return;
    const newScale = Math.max(0.6, scale - 0.2);
    setScale(newScale);
    await renderPage(pdfDoc, pageNum, newScale);
  };

  return {
    canvasRef,
    pageNum,
    loadPDF,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
  };
}
EOF

cat > frontend/src/modules/pdf/PDFViewer.jsx << 'EOF'
import React, { useEffect } from "react";
import usePDF from "./usePDF";

const wrapperStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const toolsStyle = {
  display: "flex",
  gap: "8px",
  marginBottom: "8px",
  alignItems: "center",
};

const canvasWrapper = {
  flex: 1,
  overflow: "auto",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  backgroundColor: "#fff",
};

function PDFViewer({ file }) {
  const {
    canvasRef,
    pageNum,
    loadPDF,
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
  } = usePDF();

  useEffect(() => {
    if (file && window.pdfjsLib) {
      loadPDF(file);
    }
  }, [file]);

  return (
    <div style={wrapperStyle}>
      <div style={toolsStyle}>
        <button onClick={prevPage}>Prev</button>
        <button onClick={nextPage}>Next</button>
        <button onClick={zoomOut}>-</button>
        <button onClick={zoomIn}>+</button>
        <span style={{ fontSize: "0.9rem" }}>Page: {pageNum}</span>
      </div>
      <div style={canvasWrapper}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}

export default PDFViewer;
EOF

cat > frontend/src/modules/convert/ConvertPage.jsx << 'EOF'
import React, { useState } from "react";
import EPUBViewer from "../epub/EPUBViewer";
import PDFViewer from "../pdf/PDFViewer";

const panelBase = {
  padding: "0.75rem",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  borderRight: "1px solid #e1e4e8",
};

const leftPanelStyle = {
  ...panelBase,
  width: "20%",
  minWidth: "220px",
};

const middlePanelStyle = {
  ...panelBase,
  width: "40%",
};

const rightPanelStyle = {
  ...panelBase,
  flex: 1,
  borderRight: "none",
};

const columnContainer = {
  display: "flex",
  flex: 1,
  minHeight: 0,
};

function ConvertPage() {
  const [epubFile, setEpubFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [publisher, setPublisher] = useState("");
  const [accessibleHtml, setAccessibleHtml] = useState("");

  async function handleConvert() {
    if (!epubFile) {
      alert("Upload an EPUB first");
      return;
    }

    let form = new FormData();
    form.append("publisher", publisher);
    form.append("epub_file", epubFile);
    if (pdfFile) form.append("pdf_file", pdfFile);

    const res = await fetch("/api/convert", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setAccessibleHtml(data.accessible.accessible_html);
  }

  return (
    <div style={columnContainer}>
      <section style={leftPanelStyle}>
        <h3>Controls</h3>

        <label>Publisher</label>
        <input
          style={{ width: "100%", marginBottom: "8px" }}
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
        />

        <label>EPUB File</label>
        <input
          type="file"
          accept=".epub"
          onChange={(e) => setEpubFile(e.target.files[0])}
        />

        <label style={{ marginTop: "10px" }}>Reference PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
        />

        <button
          onClick={handleConvert}
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            width: "100%",
            backgroundColor: "#374151",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Convert
        </button>
      </section>

      <section style={middlePanelStyle}>
        <h3>EPUB View</h3>
        {epubFile ? (
          <EPUBViewer file={epubFile} />
        ) : (
          <p style={{ color: "#777" }}>Upload an EPUB to preview it</p>
        )}
      </section>

      <section style={rightPanelStyle}>
        <h3>PDF / Accessible HTML</h3>
        {pdfFile ? (
          <PDFViewer file={pdfFile} />
        ) : (
          <p style={{ color: "#777" }}>Upload a PDF to preview it</p>
        )}
        <div style={{ marginTop: "8px", height: "40%" }}>
          <h4 style={{ marginBottom: "4px" }}>Accessible HTML Preview</h4>
          <iframe
            style={{
              width: "100%",
              height: "100%",
              border: "1px solid #d1d5db",
              backgroundColor: "white",
            }}
            srcDoc={accessibleHtml}
          />
        </div>
      </section>
    </div>
  );
}

export default ConvertPage;
EOF

########################################
# MAPPING MODULE (Batch 5)
########################################
cat > frontend/src/modules/mapping/TagMappingStore.js << 'EOF'
import { create } from "zustand";

export const useTagMappingStore = create((set) => ({
  htmlTags: [],
  mappings: {},
  completion: 0,

  setHTMLTags: (tags) =>
    set(() => ({
      htmlTags: tags,
      mappings: tags.reduce((acc, tag) => {
        acc[tag] = "";
        return acc;
      }, {}),
    })),

  setMapping: (tag, accessibleTag) =>
    set((state) => {
      const updated = { ...state.mappings, [tag]: accessibleTag };
      const total = Object.keys(updated).length || 1;
      const filled = Object.values(updated).filter(Boolean).length;
      const pct = Math.round((filled / total) * 100);
      return { mappings: updated, completion: pct };
    }),
}));
EOF

cat > frontend/src/modules/mapping/HTMLTagList.jsx << 'EOF'
import React from "react";
import { useTagMappingStore } from "./TagMappingStore";

const htmlTagItem = {
  padding: "6px 10px",
  borderBottom: "1px solid #e1e4e8",
};

function HTMLTagList() {
  const htmlTags = useTagMappingStore((s) => s.htmlTags);

  return (
    <div>
      <h3>HTML Tags</h3>
      <div>
        {htmlTags.map((tag, idx) => (
          <div key={idx} style={htmlTagItem}>
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
}

export default HTMLTagList;
EOF

cat > frontend/src/modules/mapping/AccessibleTagDropdown.jsx << 'EOF'
import React from "react";
import { useTagMappingStore } from "./TagMappingStore";

const dropdown = {
  width: "100%",
  padding: "5px",
};

const accessibleOptions = [
  "H1",
  "H2",
  "H3",
  "P",
  "List",
  "ListItem",
  "Image",
  "Figure",
  "Table",
  "Quote",
];

function AccessibleTagDropdown({ tag }) {
  const setMapping = useTagMappingStore((s) => s.setMapping);
  const current = useTagMappingStore((s) => s.mappings[tag]);

  return (
    <select
      style={dropdown}
      value={current || ""}
      onChange={(e) => setMapping(tag, e.target.value)}
    >
      <option value="">-- Select --</option>
      {accessibleOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

export default AccessibleTagDropdown;
EOF

cat > frontend/src/modules/mapping/AISuggestButton.jsx << 'EOF'
import React, { useState } from "react";
import { useTagMappingStore } from "./TagMappingStore";

function AISuggestButton({ tag, contextHTML }) {
  const setMapping = useTagMappingStore((s) => s.setMapping);
  const [loading, setLoading] = useState(false);

  async function handleSuggest() {
    setLoading(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html_tag: tag, context_html: contextHTML }),
      });
      const data = await res.json();
      const suggestion = data.suggested_tag || data.tag || "";
      if (suggestion) setMapping(tag, suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSuggest}
      disabled={loading}
      style={{
        padding: "4px 8px",
        backgroundColor: loading ? "#9CA3AF" : "#374151",
        color: "white",
        border: "none",
        borderRadius: "4px",
        marginLeft: "6px",
      }}
    >
      {loading ? "..." : "AI Suggest"}
    </button>
  );
}

export default AISuggestButton;
EOF

cat > frontend/src/modules/mapping/TagRow.jsx << 'EOF'
import React from "react";
import AccessibleTagDropdown from "./AccessibleTagDropdown";
import AISuggestButton from "./AISuggestButton";

const rowStyle = {
  display: "flex",
  alignItems: "center",
  padding: "6px 8px",
  borderBottom: "1px solid #e1e4e8",
  gap: "10px",
};

function TagRow({ tag, contextHTML }) {
  return (
    <div style={rowStyle}>
      <div style={{ width: "30%", fontWeight: 500 }}>{tag}</div>
      <div style={{ width: "50%" }}>
        <AccessibleTagDropdown tag={tag} />
      </div>
      <AISuggestButton tag={tag} contextHTML={contextHTML} />
    </div>
  );
}

export default TagRow;
EOF

cat > frontend/src/modules/mapping/MappingPage.jsx << 'EOF'
import React, { useEffect } from "react";
import HTMLTagList from "./HTMLTagList";
import TagRow from "./TagRow";
import { useTagMappingStore } from "./TagMappingStore";

const wrapperStyle = {
  display: "flex",
  flex: 1,
};

const leftStyle = {
  width: "25%",
  borderRight: "1px solid #e1e4e8",
  padding: "0.75rem",
  backgroundColor: "#ffffff",
};

const middleStyle = {
  width: "45%",
  borderRight: "1px solid #e1e4e8",
  padding: "0.75rem",
  backgroundColor: "#ffffff",
  overflowY: "auto",
};

const rightStyle = {
  flex: 1,
  padding: "0.75rem",
  backgroundColor: "#ffffff",
};

function MappingPage() {
  const htmlTags = ["Ahead", "Dhead", "Par", "P.", "List", "ListItem"];
  const setHTMLTags = useTagMappingStore((s) => s.setHTMLTags);
  const completion = useTagMappingStore((s) => s.completion);

  useEffect(() => {
    setHTMLTags(htmlTags);
  }, []);

  return (
    <div style={wrapperStyle}>
      <section style={leftStyle}>
        <HTMLTagList />
      </section>

      <section style={middleStyle}>
        <h3 style={{ marginBottom: "8px" }}>Accessible Tags</h3>
        {htmlTags.map((tag) => (
          <TagRow key={tag} tag={tag} contextHTML={"<mock epub html>"} />
        ))}
      </section>

      <section style={rightStyle}>
        <h3>Progress</h3>
        <div
          style={{
            height: "20px",
            backgroundColor: "#e5e7eb",
            borderRadius: "4px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${completion}%`,
              backgroundColor: "#10b981",
              borderRadius: "4px",
            }}
          ></div>
        </div>
        <p>{completion}% Complete</p>
        <button
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "600",
          }}
        >
          COMPLETE
        </button>
      </section>
    </div>
  );
}

export default MappingPage;
EOF

########################################
# QC MODULE (Batch 6)
########################################
cat > frontend/src/modules/qc/qcUtils.js << 'EOF'
export async function runQC(html) {
  const res = await fetch("/api/qc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });
  return await res.json();
}
EOF

cat > frontend/src/modules/qc/QCItem.jsx << 'EOF'
import React from "react";

function QCItem({ text, type }) {
  const color = type === "error" ? "#dc2626" : "#d97706";

  return (
    <div
      style={{
        padding: "6px 8px",
        borderBottom: "1px solid #e5e7eb",
        color,
        fontSize: "0.9rem",
      }}
    >
      {text}
    </div>
  );
}

export default QCItem;
EOF

cat > frontend/src/modules/qc/QCSummary.jsx << 'EOF'
import React from "react";
import QCItem from "./QCItem";

function QCSummary({ report }) {
  if (!report) return <p>No QC run yet</p>;

  const { status, errors, warnings } = report;

  return (
    <div>
      <h3>QC Summary</h3>
      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: status === "pass" ? "green" : "red" }}>
          {status}
        </span>
      </p>

      <h4>Errors</h4>
      <div style={{ backgroundColor: "#fff" }}>
        {errors.map((e, i) => (
          <QCItem key={i} text={e} type="error" />
        ))}
      </div>

      <h4 style={{ marginTop: "10px" }}>Warnings</h4>
      <div style={{ backgroundColor: "#fff" }}>
        {warnings.map((w, i) => (
          <QCItem key={i} text={w} type="warning" />
        ))}
      </div>
    </div>
  );
}

export default QCSummary;
EOF

cat > frontend/src/modules/qc/QCCompareView.jsx << 'EOF'
import React from "react";

function QCCompareView({ html, pdfFile }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <h3>EPUB / PDF Comparison</h3>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          marginBottom: "6px",
          border: "1px solid #d1d5db",
        }}
      >
        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "100%", border: "none" }}
        ></iframe>
      </div>

      <div style={{ flex: 1, border: "1px solid #d1d5db", overflow: "auto" }}>
        {pdfFile ? (
          <iframe
            src={URL.createObjectURL(pdfFile)}
            style={{ width: "100%", height: "100%" }}
          ></iframe>
        ) : (
          <p style={{ color: "#777", padding: "6px" }}>No PDF Uploaded</p>
        )}
      </div>
    </div>
  );
}

export default QCCompareView;
EOF

cat > frontend/src/modules/qc/QCPage.jsx << 'EOF'
import React, { useState } from "react";
import QCSummary from "./QCSummary";
import QCCompareView from "./QCCompareView";
import { runQC } from "./qcUtils";

const wrapperStyle = {
  display: "flex",
  flex: 1,
};

const leftStyle = {
  width: "25%",
  padding: "0.75rem",
  borderRight: "1px solid #e1e4e8",
  backgroundColor: "#ffffff",
};

const middleStyle = {
  width: "35%",
  padding: "0.75rem",
  borderRight: "1px solid #e1e4e8",
  backgroundColor: "#ffffff",
  overflowY: "auto",
};

const rightStyle = {
  flex: 1,
  padding: "0.75rem",
  backgroundColor: "#ffffff",
  overflow: "auto",
};

function QCPage() {
  const [epubHTML, setEpubHTML] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [qcReport, setQcReport] = useState(null);

  async function handleRunQC() {
    if (!epubHTML) {
      alert("Load accessible HTML first");
      return;
    }
    const report = await runQC(epubHTML);
    setQcReport(report);
  }

  return (
    <div style={wrapperStyle}>
      <section style={leftStyle}>
        <h3>Load Files</h3>

        <label>Accessible EPUB HTML</label>
        <textarea
          style={{ width: "100%", height: "140px" }}
          placeholder="Paste accessible HTML here"
          onChange={(e) => setEpubHTML(e.target.value)}
        ></textarea>

        <label style={{ marginTop: "8px" }}>Reference PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
        />

        <button
          onClick={handleRunQC}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            backgroundColor: "#374151",
            color: "white",
            border: "none",
            borderRadius: "4px",
            width: "100%",
          }}
        >
          Run QC
        </button>
      </section>

      <section style={middleStyle}>
        <QCSummary report={qcReport} />
      </section>

      <section style={rightStyle}>
        <QCCompareView html={epubHTML} pdfFile={pdfFile} />
      </section>
    </div>
  );
}

export default QCPage;
EOF

########################################
# README
########################################
cat > README.md << 'EOF'
# Accessible EPUB System

## Backend

```bash
cd backend
cp .env.template .env
# edit .env and set GEMINI_API_KEY (or leave blank for fallback)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
