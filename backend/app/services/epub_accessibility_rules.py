import os
import pandas as pd

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
RULES_DIR = os.path.join(BASE_DIR, "rules")
EXCEL_PATH = os.path.join(
    RULES_DIR, "INForm to Accessibility_Conversion Points.xlsx"
)

SUPPORTED_EXTS = (".xhtml", ".html", ".opf", ".ncx")


# ------------------------------------------------------------
# 1. Load Excel rules (STRICT & SAFE)
# ------------------------------------------------------------
def load_rules():
    if not os.path.exists(EXCEL_PATH):
        raise FileNotFoundError(f"Rules file missing: {EXCEL_PATH}")

    df = pd.read_excel(EXCEL_PATH)

    df = df.dropna(subset=["INForm Tag", "Accessibility Tag"])

    rules = []

    for _, row in df.iterrows():
        inform = str(row["INForm Tag"]).strip()
        acc = str(row["Accessibility Tag"]).strip()
        remarks = str(row.get("Remarks", "")).strip()

        rule_type = "replace"
        if remarks.lower().startswith("insert before"):
            rule_type = "insert_before"
        elif remarks.lower().startswith("insert after"):
            rule_type = "insert_after"
        elif "convert" in remarks.lower():
            rule_type = "global_convert"

        file_type = classify_file_target(inform, remarks)

        rules.append({
            "inform": inform,
            "acc": acc,
            "remarks": remarks,
            "type": rule_type,
            "file_type": file_type,
        })

    return rules


# ------------------------------------------------------------
# 2. Classify rule target file
# ------------------------------------------------------------
def classify_file_target(inform, remarks):
    tag = inform.lower()

    if any(k in tag for k in ["<package", "<metadata", "<dc:", "<manifest", "<spine"]):
        return "opf"

    if any(k in tag for k in ["<navmap", "<navpoint"]):
        return "ncx"

    if "<nav" in tag:
        return "nav"

    if any(k in tag for k in ["<html", "<body", "<h1", "<h2", "<title"]):
        return "xhtml"

    if ".html" in tag or ".xhtml" in tag:
        return "global"

    return "all"


# ------------------------------------------------------------
# 3. Apply rules to extracted EPUB directory
# ------------------------------------------------------------
def apply_accessibility_rules(extracted_dir):
    rules = load_rules()
    report = []

    for root, _, files in os.walk(extracted_dir):
        for filename in files:
            if not filename.lower().endswith(SUPPORTED_EXTS):
                continue

            file_path = os.path.join(root, filename)
            ftype = detect_file_type(filename)

            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            original = content
            actions = []

            for rule in rules:
                if not rule_applies_to_file(rule["file_type"], ftype):
                    continue

                applied = False
                i, a, t = rule["inform"], rule["acc"], rule["type"]

                if t == "replace" and i in content:
                    content = content.replace(i, a)
                    applied = True

                elif t == "insert_before" and i in content:
                    content = content.replace(i, a + "\n" + i)
                    applied = True

                elif t == "insert_after" and i in content:
                    content = content.replace(i, i + "\n" + a)
                    applied = True

                elif t == "global_convert" and i in content:
                    content = content.replace(i, a)
                    applied = True

                actions.append({
                    "inform": i,
                    "type": t,
                    "status": "applied" if applied else "not_found",
                })

            if content != original:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)

            report.append({
                "file": filename,
                "actions": actions,
            })

    return report


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def detect_file_type(filename):
    f = filename.lower()
    if f.endswith(".opf"):
        return "opf"
    if f.endswith(".ncx"):
        return "ncx"
    if f == "nav.xhtml":
        return "nav"
    return "xhtml"


def rule_applies_to_file(rule_type, file_type):
    if rule_type in ("all", "global"):
        return True
    return rule_type == file_type
