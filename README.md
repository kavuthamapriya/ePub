# Accessible EPUB System

## Backend
cd backend
cp .env.template .env

pip install -r requirements.txt
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
npm install @daisy/ace --save-dev
npm install winston@3.3.3 --save-dev
npm install epubjs
npm install react-icons