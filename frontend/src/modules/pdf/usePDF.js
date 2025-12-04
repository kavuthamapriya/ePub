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
