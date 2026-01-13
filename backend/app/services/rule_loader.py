import pandas as pd
from pathlib import Path


def load_standard_rules(excel_path: Path) -> list[dict]:
    """
    Loads standard accessibility rules from Excel.
    Excel must contain:
    Rule_ID | Target_File | Target_Element | Condition | Action | Value
    """

    if not excel_path.exists():
        raise FileNotFoundError(f"Rule file not found: {excel_path}")

    df = pd.read_excel(excel_path)
    df = df.fillna("")

    rules = []

    for _, row in df.iterrows():
        rules.append({
            "rule_id": row["Rule_ID"],
            "target_file": row["Target_File"].lower(),
            "element": row["Target_Element"].lower(),
            "condition": row["Condition"].lower(),
            "action": row["Action"].lower(),
            "value": row["Value"],
        })

    return rules
