from fastapi import APIRouter
from app.models.suggest_models import SuggestRequest
from app.services.gemini_service import run_gemini

router = APIRouter()


@router.post("")
def suggest(req: SuggestRequest):
    prompt = (
        "You are an accessibility tagging assistant. "
        "Given a source HTML tag and some HTML context, suggest the best accessible semantic tag. "
        "Return strict JSON: {\"suggested_tag\": \"H1\"}.\n\n"
        f"HTML_TAG: {req.html_tag}\nCONTEXT_HTML: ```{req.context_html}```"
    )
    ai = run_gemini(prompt, expect_json=True)
    return ai
