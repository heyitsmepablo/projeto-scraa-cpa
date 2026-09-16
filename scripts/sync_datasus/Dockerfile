FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry

COPY sync_datasus/pyproject.toml sync_datasus/poetry.lock* ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --only main || pip install --no-cache-dir pysus pandas sqlalchemy python-dotenv psycopg2-binary

COPY shared ./scripts/shared
COPY sync_datasus/src ./src

ENV PYTHONPATH="/app:/app/src"
CMD ["python", "-m", "sync_datasus"]
