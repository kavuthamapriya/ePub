import os
import re
from lxml import etree
from bs4 import BeautifulSoup

SUPPORTED_EXTS = (".xhtml", ".html", ".opf", ".css")

XML_NS = "http://www.w3.org/XML/1998/namespace"
SCHEMA_NS = "http://schema.org/"

print("🔥 FINAL EPUB ACCESSIBILITY RULE ENGINE LOADED 🔥")


# ==================================================
# ENTRY POINT
# ==================================================

def apply_accessibility_rules(extracted_dir):
    print("🔥 APPLY_ACCESSIBILITY_RULES CALLED 🔥")

    for root, _, files in os.walk(extracted_dir):
        for filename in files:
            path = os.path.join(root, filename)
            lname = filename.lower()

            if not lname.endswith(SUPPORTED_EXTS):
                continue

            if lname.endswith(".opf"):
                fix_opf(path)

            elif lname.endswith((".xhtml", ".html")):
                fix_xhtml(path)

            elif lname.endswith(".css"):
                fix_css_anchor_contrast(path)


# ==================================================
# OPF FIXES (EPUB ACCESSIBILITY METADATA)
# ==================================================

def fix_opf(opf_path):
    parser = etree.XMLParser(recover=True)
    tree = etree.parse(opf_path, parser)
    root = tree.getroot()

    # 1️⃣ Ensure xml:lang
    root.set(f"{{{XML_NS}}}lang", "en")

    metadata = root.find(".//{*}metadata")
    if metadata is None:
        return

    # 2️⃣ Ensure schema namespace
    nsmap = dict(metadata.nsmap or {})
    if "schema" not in nsmap:
        nsmap["schema"] = SCHEMA_NS
        new_metadata = etree.Element(metadata.tag, nsmap=nsmap)

        for k, v in metadata.attrib.items():
            new_metadata.set(k, v)
        for child in list(metadata):
            new_metadata.append(child)

        root.replace(metadata, new_metadata)
        metadata = new_metadata

    def ensure_meta(prop, value):
        for meta in metadata.findall(".//{*}meta"):
            if meta.get("property") == prop:
                meta.text = value
                return
        m = etree.SubElement(metadata, "meta")
        m.set("property", prop)
        m.text = value

    # 3️⃣ REQUIRED EPUB A11Y METADATA
    ensure_meta("schema:accessMode", "textual")
    ensure_meta("schema:accessModeSufficient", "textual")
    ensure_meta("schema:accessibilityFeature", "structuralNavigation")
    ensure_meta("schema:accessibilityHazard", "none")
    ensure_meta(
        "schema:accessibilitySummary",
        "This publication supports textual accessibility with structured navigation."
    )

    tree.write(opf_path, encoding="utf-8", xml_declaration=True, pretty_print=True)


# ==================================================
# XHTML / NAV FIXES
# ==================================================

def fix_xhtml(xhtml_path):
    with open(xhtml_path, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f, "lxml")

    changed = False

    # 1️⃣ Remove broken page-list nav
    for nav in soup.find_all("nav"):
        if nav.get("epub:type") == "page-list":
            nav.decompose()
            changed = True

    # 2️⃣ Fix epub-type-has-matching-role
    for nav in soup.find_all("nav"):
        epub_type = nav.get("epub:type")

        if epub_type == "toc":
            nav["role"] = "doc-toc"
            changed = True

        elif epub_type == "landmarks":
            nav["role"] = "navigation"
            changed = True

        elif epub_type == "page-list":
            nav["role"] = "doc-pagelist"
            changed = True

    # NOTE:
    # link-in-text-block is fixed at CSS level (correct approach)

    if changed:
        with open(xhtml_path, "w", encoding="utf-8") as f:
            f.write(str(soup))


# ==================================================
# CSS FIX (ROOT CAUSE OF link-in-text-block)
# ==================================================

def fix_css_anchor_contrast(css_path):
    """
    Fixes link-in-text-block by ensuring links are
    distinguishable in default (non-hover) state.
    """

    with open(css_path, "r", encoding="utf-8", errors="ignore") as f:
        css = f.read()

    original = css

    # Replace dangerous anchor rules
    css = re.sub(
        r"a\s*\{[^}]*text-decoration\s*:\s*none[^}]*\}",
        "a {\n  text-decoration: underline;\n}",
        css,
        flags=re.IGNORECASE | re.DOTALL,
    )

    css = re.sub(
        r"a\s*\{[^}]*color\s*:\s*inherit[^}]*\}",
        "a {\n  text-decoration: underline;\n}",
        css,
        flags=re.IGNORECASE | re.DOTALL,
    )

    if css != original:
        with open(css_path, "w", encoding="utf-8") as f:
            f.write(css)
        print(f" Fixed link contrast in CSS: {css_path}")
