FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /data/photos

# Make scripts executable
RUN chmod +x init_db.py migrate.py

EXPOSE 8000

# Initialize database and start server
CMD ["sh", "-c", "python init_db.py && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"]