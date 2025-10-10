# observer-api/Dockerfile
FROM python:3.12-alpine

# deps
RUN apk add --no-cache curl && pip install --no-cache-dir fastapi uvicorn

# tiny app with /health
WORKDIR /app
RUN printf '%s\n' \
"from fastapi import FastAPI" \
"app = FastAPI()" \
"@app.get('/health')" \
"def health(): return {'status':'ok'}" > app.py

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
