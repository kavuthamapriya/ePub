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
