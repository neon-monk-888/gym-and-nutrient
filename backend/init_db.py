#!/usr/bin/env python3
"""
Initialize database for Gym and Food Log
Creates all tables and runs initial setup
"""

import os
import sys
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

def init_database():
    """Initialize the database with all tables"""
    print("🔧 Initializing database...")
    
    try:
        # Ensure data directory exists
        data_dir = Path("/data")
        data_dir.mkdir(exist_ok=True)
        
        # Create photos directory
        photos_dir = data_dir / "photos"
        photos_dir.mkdir(exist_ok=True)
        
        print("✅ Data directories created")
        
        # Import database module and create tables
        from database import engine, Base
        from models import Profile, Meal, MealItem, Workout, Exercise, ExerciseSet, WeighIn
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        print("✅ Database tables created successfully")
        
        # Check if we can connect
        from database import SessionLocal
        db = SessionLocal()
        
        # Test query
        profile_count = db.query(Profile).count()
        print(f"📊 Database connection verified (profiles: {profile_count})")
        
        db.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    if success:
        print("🎉 Database initialization completed successfully!")
        sys.exit(0)
    else:
        print("💥 Database initialization failed!")
        sys.exit(1)