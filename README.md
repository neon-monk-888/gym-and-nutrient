# Gym & Nutrient Tracker

Personal gym and nutrition tracking app for vegetarian bulking. Zero cloud dependencies, all data stored locally.

## Features

- **Meal Photo Analysis**: Upload meal photos → AI nutritional breakdown via OpenAI GPT-4o
- **Daily Nutrition Tracking**: Real-time macro tracking with targets and remaining budget
- **Workout Logging**: Track Muay Thai, weightlifting, cardio with progressive overload monitoring
- **Body Tracking**: Weight trends with 7-day rolling averages
- **Weekly Summaries**: Progress tracking with on-track indicators

## Quick Start

```bash
# Clone and start
git clone https://github.com/neon-monk-888/gym-and-nutrient
cd gym-and-nutrient
cp .env.example .env
# Add your OpenAI API key to .env
docker-compose up
```

App runs at http://localhost:8000

## Data Storage

- SQLite database: `/data/bulkup.db`
- Meal photos: `/data/photos/`
- Both persist in Docker volume

## Backup

```bash
# Full backup
docker-compose exec api python backup.py

# Manual backup
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

## Tech Stack

- Backend: FastAPI + SQLite + Alembic
- Frontend: React + Tailwind CSS
- AI: OpenAI GPT-4o Vision API
- Deploy: Docker Compose + Caddy

Zero running costs locally, under £5/month on VPS.