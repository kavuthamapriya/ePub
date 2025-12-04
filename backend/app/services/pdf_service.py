import fitz


def extract_pdf_text(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    texts = [page.get_text() for page in doc]
    return "\n".join(texts)
