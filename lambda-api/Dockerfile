# lambda-api/Dockerfile
FROM python:3.12-alpine

# Install dependencies
RUN apk add --no-cache curl

# Copy app files
WORKDIR /app
COPY app/ ./app/

# Install Python dependencies
RUN pip install --no-cache-dir -r app/requirements.txt

# run as non-root for PodSecurity 'restricted'
RUN addgroup -S app && adduser -S -G app -u 10001 app && chown -R app:app /app
USER 10001:10001

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
