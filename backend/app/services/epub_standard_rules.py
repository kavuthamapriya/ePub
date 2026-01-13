import os
from pathlib import Path
import pandas as pd
from lxml import etree
from bs4 import BeautifulSoup

SUPPORTED_EXTS = (".opf", ".xhtml", ".html")


# ==================================================
# ENTRY POINT
# ==================================================

def apply_standard_rules_from_excel(
    extracted_dir: Path,
    excel_path: Path,
):
    print("\n📘 STANDARD RULE ENGINE STARTED")

    if not excel_path.exists():
        print("⚠️ Excel file not found – skipping standard rules\n")
        return

    rules = load_rules(excel_path)

    print(f"📘 Loaded {len(rules)} rules from Excel\n")

    for root, _, files in os.walk(extracted_dir):
        for fname in files:
            path = Path(root) / fname
            lname = fname.lower()

            if not lname.endswith(SUPPORTED_EXTS):
                continue

            if lname.endswith(".opf"):
                apply_opf_rules(path, rules)

            elif lname.endswith((".xhtml", ".html")):
                apply_xhtml_rules(path, rules)

    print("📘 STANDARD RULE ENGINE COMPLETED\n")


# ==================================================
# LOAD RULES
# ==================================================

def load_rules(excel_path: Path) -> list[dict]:
    df = pd.read_excel(excel_path).fillna("")

    rules = []
    for _, row in df.iterrows():
        rules.append({
            "rule_id": row.get("Rule_ID"),
            "rule_type": row.get("Rule_Type", "").upper(),
            "target_file": row.get("Target_File", "").lower(),
            "target_element": row.get("Target_Element", "").lower(),
            "action": row.get("Action", "").lower(),
            "value": row.get("Value", ""),
            "rule_content": row.get("Rule_Content", ""),
        })

    return rules


# ==================================================
# OPF RULES
# ==================================================

def apply_opf_rules(opf_path: Path, rules: list[dict]):
    parser = etree.XMLParser(recover=True)
    tree = etree.parse(str(opf_path), parser)
    root = tree.getroot()

    metadata = root.find(".//{*}metadata")
    if metadata is None:
        return

    changed = False

    for rule in rules:
        if rule["rule_type"] != "AUTO":
            log_skip(rule, "manual rule")
            continue

        if rule["target_file"] != "opf":
            continue

        if rule["target_element"] != "metadata":
            log_skip(rule, "target element not metadata")
            continue

        if rule["action"] != "ensure":
            log_skip(rule, f"unsupported action '{rule['action']}'")
            continue

        prop, _, value = rule["value"].partition("=")
        if not prop:
            log_skip(rule, "invalid value format")
            continue

        if any(m.get("property") == prop for m in metadata.findall(".//{*}meta")):
            log_skip(rule, f"metadata '{prop}' already exists")
            continue

        m = etree.SubElement(metadata, "meta")
        m.set("property", prop)
        m.text = value
        changed = True

        log_apply(rule, f"OPF metadata '{prop}' added")

    if changed:
        tree.write(
            str(opf_path),
            encoding="utf-8",
            xml_declaration=True,
            pretty_print=True,
        )


# ==================================================
# XHTML RULES
# ==================================================

def apply_xhtml_rules(xhtml_path: Path, rules: list[dict]):
    with open(xhtml_path, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f, "lxml")

    changed = False

    for rule in rules:
        if rule["rule_type"] != "AUTO":
            log_skip(rule, "manual rule")
            continue

        if rule["target_file"] not in ("xhtml", "nav"):
            continue

        elements = soup.find_all(rule["target_element"])
        if not elements:
            log_skip(rule, f"<{rule['target_element']}> not found")
            continue

        for el in elements:
            if rule["action"] == "ensure":
                attr, _, val = rule["value"].partition("=")
                if not el.get(attr):
                    el[attr] = val or f"auto-{id(el)}"
                    changed = True
                    log_apply(rule, f"attribute '{attr}' ensured")

            elif rule["action"] == "add_role":
                if not el.get("role"):
                    el["role"] = rule["value"]
                    changed = True
                    log_apply(rule, f"role '{rule['value']}' added")

            else:
                log_skip(rule, f"unsupported action '{rule['action']}'")

    if changed:
        with open(xhtml_path, "w", encoding="utf-8") as f:
            f.write(str(soup))


# ==================================================
# LOG HELPERS
# ==================================================

def log_apply(rule: dict, msg: str):
    print(f"[AUTO][{rule['rule_id']}] ✅ APPLIED → {msg}")


def log_skip(rule: dict, reason: str):
    print(f"[{rule['rule_type']}][{rule['rule_id']}] ⏭️ SKIPPED → {reason}")
