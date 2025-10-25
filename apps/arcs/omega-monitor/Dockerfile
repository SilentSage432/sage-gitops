FROM python:3.11-slim

# App directory
WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Security best practices
ENV PYTHONUNBUFFERED=1 \
    PORT=8080

# Expose port
EXPOSE 8080

# Run via gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8080", "main:app"]
