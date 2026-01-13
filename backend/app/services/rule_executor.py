from bs4 import BeautifulSoup
from lxml import etree


# -----------------------------
# XHTML RULES
# -----------------------------

def apply_xhtml_rule(soup: BeautifulSoup, rule: dict) -> bool:
    changed = False

    elements = soup.find_all(rule["element"])

    for el in elements:
        if rule["condition"] == "missing aria-labelledby":
            if not el.get("aria-labelledby"):
                el["aria-labelledby"] = f"auto-{id(el)}"
                changed = True

        elif rule["condition"] == "missing role":
            if not el.get("role"):
                el["role"] = rule["value"]
                changed = True

        elif rule["condition"] == "missing epub:type":
            if not el.get("epub:type"):
                el["epub:type"] = rule["value"]
                changed = True

    return changed


# -----------------------------
# OPF RULES
# -----------------------------

def apply_opf_rule(tree: etree._ElementTree, rule: dict) -> bool:
    root = tree.getroot()
    metadata = root.find(".//{*}metadata")
    if metadata is None:
        return False

    for meta in metadata.findall(".//{*}meta"):
        if meta.get("property") == rule["value"]:
            return False

    m = etree.SubElement(metadata, "meta")
    m.set("property", rule["value"])
    m.text = rule["condition"]

    return True
