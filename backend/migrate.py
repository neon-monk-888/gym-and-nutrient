#!/usr/bin/env python3
"""
Database migration management script for Gym and Food Log
"""

import os
import sys
import subprocess
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

def run_command(cmd):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=os.path.dirname(__file__))
        if result.returncode != 0:
            print(f"❌ Command failed: {cmd}")
            print(f"Error: {result.stderr}")
            return False
        if result.stdout:
            print(result.stdout)
        return True
    except Exception as e:
        print(f"❌ Error running command: {e}")
        return False

def init_db():
    """Initialize the database with current schema"""
    print("🔧 Initializing database...")
    
    # Create data directory if it doesn't exist
    os.makedirs("/data", exist_ok=True)
    
    # Import and create tables
    try:
        from database import init_db as create_tables
        create_tables()
        print("✅ Database initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        return False

def create_migration(message):
    """Create a new migration"""
    if not message:
        print("❌ Migration message is required")
        return False
    
    print(f"📝 Creating migration: {message}")
    cmd = f"python -m alembic revision --autogenerate -m \"{message}\""
    return run_command(cmd)

def run_migrations():
    """Run pending migrations"""
    print("🔄 Running migrations...")
    cmd = "python -m alembic upgrade head"
    return run_command(cmd)

def migration_history():
    """Show migration history"""
    print("📋 Migration history:")
    cmd = "python -m alembic history"
    return run_command(cmd)

def current_revision():
    """Show current revision"""
    print("📍 Current revision:")
    cmd = "python -m alembic current"
    return run_command(cmd)

def downgrade(revision="base"):
    """Downgrade to a specific revision"""
    print(f"⬇️ Downgrading to: {revision}")
    cmd = f"python -m alembic downgrade {revision}"
    return run_command(cmd)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Database migration management")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Init command
    subparsers.add_parser("init", help="Initialize database with current schema")
    
    # Create migration
    create_parser = subparsers.add_parser("create", help="Create a new migration")
    create_parser.add_argument("message", help="Migration message")
    
    # Run migrations
    subparsers.add_parser("migrate", help="Run pending migrations")
    
    # History
    subparsers.add_parser("history", help="Show migration history")
    
    # Current
    subparsers.add_parser("current", help="Show current revision")
    
    # Downgrade
    downgrade_parser = subparsers.add_parser("downgrade", help="Downgrade database")
    downgrade_parser.add_argument("revision", nargs="?", default="-1", help="Target revision (default: previous)")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    success = False
    
    if args.command == "init":
        success = init_db()
    elif args.command == "create":
        success = create_migration(args.message)
    elif args.command == "migrate":
        success = run_migrations()
    elif args.command == "history":
        success = migration_history()
    elif args.command == "current":
        success = current_revision()
    elif args.command == "downgrade":
        success = downgrade(args.revision)
    
    sys.exit(0 if success else 1)