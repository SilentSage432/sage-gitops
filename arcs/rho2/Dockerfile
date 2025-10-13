FROM python:3.12-alpine
RUN apk add --no-cache git openssh bash curl jq \
 && curl -fsSL https://github.com/getsops/sops/releases/download/v3.9.0/sops-v3.9.0.linux.amd64 \
    -o /usr/local/bin/sops && chmod +x /usr/local/bin/sops \
 && curl -fsSL https://github.com/mikefarah/yq/releases/download/v4.44.2/yq_linux_amd64 \
    -o /usr/local/bin/yq && chmod +x /usr/local/bin/yq
WORKDIR /app
COPY arcs/rho2/app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY arcs/rho2/app /app
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8000"]
