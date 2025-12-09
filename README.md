# Accessible EPUB System

## Backend

```bash
cd backend
cp .env.template .env
# edit .env and set GEMINI_API_KEY (or leave blank for fallback)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
venv\Scripts\activate
npm install @daisy/ace --save-dev
