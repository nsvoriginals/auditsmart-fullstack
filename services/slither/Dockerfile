# services/slither/Dockerfile
# Python sidecar for Slither static analysis — internal only, no public ports

FROM python:3.11-slim AS base

# System deps: solc build requirements + git (Slither needs it for some detectors)
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        curl \
        build-essential \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-install the common solc versions at BUILD time. The analysis network is
# internet-isolated (docker-compose `analysis` network has internal:true), so
# solc-select CANNOT download versions at runtime — they must be baked in here.
RUN for v in 0.8.26 0.8.24 0.8.20 0.8.19 0.8.17 0.8.13 0.7.6 0.6.12 0.5.16; do \
        solc-select install "$v"; \
    done && \
    solc-select use 0.8.19

COPY main.py .

# Security: non-root user
RUN useradd -r -s /bin/false slither
USER slither

ENV SLITHER_TIMEOUT=120

EXPOSE 8001

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -sf http://localhost:8001/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
