FROM python:3.12-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
ENV PYTHONUNBUFFERED=1
RUN adduser -D -u 10001 appuser
USER 10001:10001
CMD ["python","/app/main.py"]


