from ebooklib import epub, ITEM_DOCUMENT


def extract_epub_html(epub_path: str) -> str:
    book = epub.read_epub(epub_path)
    parts = []
    for item in book.get_items():
        # Use top-level ITEM_DOCUMENT constant instead of epub.ITEM_DOCUMENT
        if item.get_type() == ITEM_DOCUMENT:
            parts.append(item.get_content().decode("utf-8", errors="ignore"))
    return "\n".join(parts)
