from pydantic import BaseModel


class SuggestRequest(BaseModel):
    html_tag: str
    context_html: str
