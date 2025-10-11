# lambda-api/Dockerfile
FROM python:3.12-alpine

# deps
RUN apk add --no-cache curl && pip install --no-cache-dir fastapi uvicorn

# app
WORKDIR /app
RUN printf '%s\n' \
"from fastapi import FastAPI" \
"app = FastAPI()" \
"@app.get('/health')" \
"def health(): return {'status':'ok'}" > app.py

# run as non-root for PodSecurity 'restricted'
RUN addgroup -S app && adduser -S -G app -u 10001 app && chown -R app:app /app
USER 10001:10001

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
