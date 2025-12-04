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
