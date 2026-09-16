FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry

COPY sync_cpa_data/pyproject.toml sync_cpa_data/poetry.lock* ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --only main || pip install --no-cache-dir pandas openpyxl sqlalchemy python-dotenv psycopg2-binary

COPY shared ./scripts/shared
COPY sync_cpa_data/src ./src

ENV PYTHONPATH="/app:/app/src"
CMD ["python", "-m", "sync_cpa_data"]
