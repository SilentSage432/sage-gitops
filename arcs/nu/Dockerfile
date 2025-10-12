FROM python:3.12-alpine
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UVICORN_WORKERS=1 PORT=8000 \
    PYTHONPATH=/app/app:/app
WORKDIR /app
COPY app/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY app /app/app
EXPOSE 8000
USER 65532:65532
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
