import os
import shutil
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from database import SessionLocal, engine, init_db
from models import Base, Profile, Meal, MealItem, Workout, Exercise, ExerciseSet, WeighIn
import schemas
from ai_analysis import meal_analyzer
from utils import (
    calculate_tdee, 
    calculate_macro_targets, 
    save_uploaded_file,
    get_weight_trend,
    get_daily_nutrition,
    get_weekly_summary
)

# Initialize database
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")
except Exception as e:
    print(f"⚠️ Database initialization warning: {e}")
    # Continue anyway - tables might already exist

app = FastAPI(title="Gym and Food Log", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

# Profile endpoints
@app.get("/profile", response_model=schemas.Profile)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        # Create default profile
        profile = Profile(
            current_weight=65.0,
            goal_weight=63.0,
            height_cm=175,
            activity_level="moderately_active",
            dietary_preference="vegetarian"
        )
        # Calculate targets
        tdee = calculate_tdee(65.0, 175, 25, "moderately_active")
        targets = calculate_macro_targets(tdee)
        profile.tdee = tdee
        profile.daily_calorie_target = targets["calories"]
        profile.daily_protein_target = targets["protein"]
        profile.daily_carbs_target = targets["carbs"]
        profile.daily_fat_target = targets["fat"]
        
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return profile

@app.put("/profile", response_model=schemas.Profile)
def update_profile(profile_data: schemas.ProfileCreate, db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    
    if not profile:
        profile = Profile()
        db.add(profile)
    
    # Update fields
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    
    # Recalculate targets if weight/height/activity changed
    if profile.current_weight and profile.height_cm and profile.activity_level:
        tdee = calculate_tdee(profile.current_weight, profile.height_cm, 25, profile.activity_level)
        targets = calculate_macro_targets(tdee)
        profile.tdee = tdee
        profile.daily_calorie_target = targets["calories"]
        profile.daily_protein_target = targets["protein"]
        profile.daily_carbs_target = targets["carbs"]
        profile.daily_fat_target = targets["fat"]
    
    db.commit()
    db.refresh(profile)
    return profile

# Meal analysis endpoint
@app.post("/meals/analyse")
async def analyse_meal_photo(file: UploadFile = File(...)):
    """Analyze meal photo and return nutrition estimate"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Save temporary file
        file_content = await file.read()
        temp_path = save_uploaded_file(file_content, file.filename)
        
        # Analyze with AI
        analysis_data = meal_analyzer.analyze_meal(temp_path)
        
        # Validate response
        analysis = meal_analyzer.validate_analysis(analysis_data)
        
        return {
            "analysis": analysis.dict(),
            "temp_photo_path": temp_path
        }
        
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

# Meal endpoints
@app.post("/meals", response_model=schemas.Meal)
async def create_meal(
    date: str = Form(...),
    time: str = Form(...),
    calories: int = Form(...),
    protein: float = Form(...),
    carbs: float = Form(...),
    fat: float = Form(...),
    fibre: float = Form(...),
    source: str = Form(...),
    notes: str = Form(None),
    photo_path: str = Form(None),
    items: str = Form("[]"),  # JSON string of items
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Create a new meal entry"""
    import json
    
    # Handle photo upload
    final_photo_path = None
    if file and file.content_type.startswith('image/'):
        file_content = await file.read()
        final_photo_path = save_uploaded_file(file_content, file.filename)
    elif photo_path:
        final_photo_path = photo_path
    
    # Create meal
    meal = Meal(
        date=date,
        time=time,
        calories=calories,
        protein=protein,
        carbs=carbs,
        fat=fat,
        fibre=fibre,
        source=source,
        notes=notes,
        photo_path=final_photo_path
    )
    
    db.add(meal)
    db.flush()  # Get the meal ID
    
    # Add meal items
    try:
        items_data = json.loads(items) if items else []
        for item_data in items_data:
            meal_item = MealItem(
                meal_id=meal.id,
                name=item_data["name"],
                portion=item_data["portion"], 
                calories=item_data["calories"],
                protein=item_data.get("protein", 0),
                carbs=item_data.get("carbs", 0),
                fat=item_data.get("fat", 0)
            )
            db.add(meal_item)
    except json.JSONDecodeError:
        pass  # Ignore invalid JSON
    
    db.commit()
    db.refresh(meal)
    return meal

@app.get("/meals", response_model=List[schemas.Meal])
def get_meals(date: Optional[str] = None, db: Session = Depends(get_db)):
    """Get meals, optionally filtered by date"""
    query = db.query(Meal)
    if date:
        query = query.filter(Meal.date == date)
    
    meals = query.order_by(Meal.date.desc(), Meal.time.desc()).all()
    return meals

@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    # Delete photo file if exists
    if meal.photo_path and os.path.exists(meal.photo_path):
        try:
            os.remove(meal.photo_path)
        except:
            pass
    
    db.delete(meal)
    db.commit()
    return {"message": "Meal deleted"}

# Workout endpoints
@app.post("/workouts", response_model=schemas.Workout)
def create_workout(workout: schemas.WorkoutCreate, db: Session = Depends(get_db)):
    """Create a new workout with detailed exercise tracking"""
    db_workout = Workout(
        date=workout.date,
        start_time=workout.start_time,
        end_time=workout.end_time,
        type=workout.type,
        duration_minutes=workout.duration_minutes,
        intensity=workout.intensity,
        location=workout.location,
        notes=workout.notes
    )
    
    db.add(db_workout)
    db.flush()
    
    # Add exercises with sets
    for exercise_data in workout.exercises:
        exercise = Exercise(
            workout_id=db_workout.id,
            name=exercise_data.name,
            muscle_group=exercise_data.muscle_group,
            exercise_order=exercise_data.exercise_order,
            target_sets=exercise_data.target_sets,
            target_reps=exercise_data.target_reps,
            notes=exercise_data.notes
        )
        db.add(exercise)
        db.flush()
        
        # Add individual sets
        for set_data in exercise_data.sets:
            exercise_set = ExerciseSet(
                exercise_id=exercise.id,
                set_number=set_data.set_number,
                reps=set_data.reps,
                weight_kg=set_data.weight_kg,
                rest_seconds=set_data.rest_seconds,
                rpe=set_data.rpe,
                completed=set_data.completed,
                notes=set_data.notes
            )
            db.add(exercise_set)
    
    db.commit()
    db.refresh(db_workout)
    return db_workout

@app.get("/workouts", response_model=List[schemas.Workout])
def get_workouts(
    range: str = "week",  # week, month, all
    db: Session = Depends(get_db)
):
    """Get workouts by date range"""
    query = db.query(Workout)
    
    if range == "week":
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        query = query.filter(Workout.date >= start_date)
    elif range == "month":
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        query = query.filter(Workout.date >= start_date)
    
    workouts = query.order_by(Workout.date.desc(), Workout.start_time.desc()).all()
    return workouts

@app.get("/workouts/{workout_id}", response_model=schemas.Workout)
def get_workout(workout_id: int, db: Session = Depends(get_db)):
    """Get detailed workout by ID"""
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout

@app.delete("/workouts/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    """Delete a workout and all its exercises/sets"""
    workout = db.query(Workout).filter(Workout.id == workout_id).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    db.delete(workout)
    db.commit()
    return {"message": "Workout deleted"}

@app.get("/workouts/stats/summary")
def get_workout_stats(days: int = 30, db: Session = Depends(get_db)):
    """Get workout statistics and trends"""
    cutoff_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    # Get recent workouts
    workouts = db.query(Workout).filter(
        Workout.date >= cutoff_date
    ).order_by(Workout.date.desc()).all()
    
    # Calculate stats
    total_workouts = len(workouts)
    total_duration = sum(w.duration_minutes for w in workouts)
    
    # Group by workout type
    type_counts = {}
    type_duration = {}
    intensity_counts = {}
    
    for workout in workouts:
        # Type stats
        if workout.type not in type_counts:
            type_counts[workout.type] = 0
            type_duration[workout.type] = 0
        type_counts[workout.type] += 1
        type_duration[workout.type] += workout.duration_minutes
        
        # Intensity stats
        if workout.intensity:
            if workout.intensity not in intensity_counts:
                intensity_counts[workout.intensity] = 0
            intensity_counts[workout.intensity] += 1
    
    # Get exercise frequency (most common exercises)
    exercise_counts = {}
    total_sets = 0
    total_volume = 0  # weight * reps
    
    for workout in workouts:
        for exercise in workout.exercises:
            if exercise.name not in exercise_counts:
                exercise_counts[exercise.name] = 0
            exercise_counts[exercise.name] += 1
            
            for exercise_set in exercise.sets:
                total_sets += 1
                if exercise_set.weight_kg:
                    total_volume += exercise_set.weight_kg * exercise_set.reps
    
    # Sort exercises by frequency
    top_exercises = sorted(exercise_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "period_days": days,
        "total_workouts": total_workouts,
        "total_duration_minutes": total_duration,
        "avg_duration_minutes": total_duration / max(1, total_workouts),
        "workouts_per_week": (total_workouts / max(1, days)) * 7,
        "workout_types": type_counts,
        "type_duration": type_duration,
        "intensity_breakdown": intensity_counts,
        "total_sets": total_sets,
        "total_volume_kg": total_volume,
        "top_exercises": top_exercises,
        "recent_workouts": [
            {
                "id": w.id,
                "date": w.date,
                "type": w.type,
                "duration": w.duration_minutes,
                "intensity": w.intensity,
                "exercise_count": len(w.exercises)
            } for w in workouts[:5]
        ]
    }

@app.get("/exercises/library")
def get_exercise_library():
    """Get common exercises organized by muscle group"""
    return {
        "chest": [
            "Bench Press", "Incline Bench Press", "Decline Bench Press", 
            "Dumbbell Press", "Incline Dumbbell Press", "Chest Flyes",
            "Push-ups", "Chest Dips", "Cable Crossover"
        ],
        "back": [
            "Pull-ups", "Chin-ups", "Lat Pulldown", "Seated Row",
            "Bent-over Row", "T-Bar Row", "Deadlift", "Hyperextensions",
            "Face Pulls", "Reverse Flyes"
        ],
        "legs": [
            "Squats", "Front Squats", "Leg Press", "Romanian Deadlift",
            "Leg Curls", "Leg Extensions", "Calf Raises", "Lunges",
            "Bulgarian Split Squats", "Hip Thrusts"
        ],
        "shoulders": [
            "Overhead Press", "Dumbbell Press", "Lateral Raises",
            "Front Raises", "Rear Delt Flyes", "Arnold Press",
            "Upright Rows", "Pike Push-ups", "Handstand Push-ups"
        ],
        "arms": [
            "Bicep Curls", "Hammer Curls", "Tricep Dips", "Close-grip Bench",
            "Tricep Extensions", "Cable Curls", "Preacher Curls",
            "Diamond Push-ups", "21s", "Concentration Curls"
        ],
        "core": [
            "Planks", "Side Planks", "Crunches", "Bicycle Crunches",
            "Russian Twists", "Leg Raises", "Dead Bug", "Mountain Climbers",
            "Hollow Body Hold", "V-ups"
        ],
        "cardio": [
            "Running", "Cycling", "Rowing", "Jump Rope", "Burpees",
            "High Knees", "Jumping Jacks", "Stair Climbing", "Swimming"
        ],
        "muay_thai": [
            "Jab", "Cross", "Hook", "Uppercut", "Knee Strike", 
            "Front Kick", "Roundhouse Kick", "Elbow Strike",
            "Clinch Work", "Pad Work", "Heavy Bag", "Shadow Boxing"
        ]
    }

# Weight tracking endpoints
@app.post("/weigh-ins", response_model=schemas.WeighIn)
def create_weigh_in(weigh_in: schemas.WeighInCreate, db: Session = Depends(get_db)):
    """Create a new weigh-in entry"""
    # Check if weigh-in already exists for this date
    existing = db.query(WeighIn).filter(WeighIn.date == weigh_in.date).first()
    if existing:
        # Update existing
        existing.weight_kg = weigh_in.weight_kg
        existing.notes = weigh_in.notes
        db.commit()
        db.refresh(existing)
        return existing
    
    db_weigh_in = WeighIn(**weigh_in.dict())
    db.add(db_weigh_in)
    db.commit()
    db.refresh(db_weigh_in)
    return db_weigh_in

@app.get("/weigh-ins", response_model=List[schemas.WeighIn])
def get_weigh_ins(days: int = 30, db: Session = Depends(get_db)):
    """Get recent weigh-ins"""
    cutoff_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    weigh_ins = db.query(WeighIn).filter(
        WeighIn.date >= cutoff_date
    ).order_by(WeighIn.date.desc()).all()
    return weigh_ins

# Dashboard endpoint
@app.get("/dashboard", response_model=schemas.DashboardData)
def get_dashboard(db: Session = Depends(get_db)):
    """Get dashboard data for today"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Get profile for targets
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Current nutrition
    current_nutrition = get_daily_nutrition(db, today)
    
    # Targets
    targets = {
        "calories": profile.daily_calorie_target or 2500,
        "protein": profile.daily_protein_target or 150,
        "carbs": profile.daily_carbs_target or 300,
        "fat": profile.daily_fat_target or 80
    }
    
    # Remaining
    remaining = {
        "calories": max(0, targets["calories"] - current_nutrition["calories"]),
        "protein": max(0, targets["protein"] - current_nutrition["protein"]),
        "carbs": max(0, targets["carbs"] - current_nutrition["carbs"]),
        "fat": max(0, targets["fat"] - current_nutrition["fat"])
    }
    
    # Weight trend
    weight_trend = get_weight_trend(db, 30)
    
    # Recent workouts (last 7 days)
    week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    recent_workouts = db.query(Workout).filter(
        Workout.date >= week_ago
    ).order_by(Workout.date.desc()).all()
    
    workouts_summary = []
    for workout in recent_workouts:
        workouts_summary.append({
            "date": workout.date,
            "type": workout.type,
            "duration": workout.duration_minutes,
            "exercises_count": len(workout.exercises)
        })
    
    return schemas.DashboardData(
        date=today,
        current_nutrition=current_nutrition,
        targets=targets,
        remaining=remaining,
        weight_trend=weight_trend,
        recent_workouts=workouts_summary
    )

# Weekly summary endpoint
@app.get("/weekly-summary", response_model=schemas.WeeklySummary)
def get_weekly_summary_endpoint(
    week_start: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get weekly summary statistics"""
    if not week_start:
        # Default to current week (Monday)
        today = datetime.now()
        days_since_monday = today.weekday()
        monday = today - timedelta(days=days_since_monday)
        week_start = monday.strftime("%Y-%m-%d")
    
    summary = get_weekly_summary(db, week_start)
    
    # Determine status (simple heuristic)
    profile = db.query(Profile).first()
    target_calories = profile.daily_calorie_target if profile else 2500
    
    if summary["avg_daily_calories"] >= target_calories * 0.95:
        status = "on_track"
    elif summary["avg_daily_calories"] >= target_calories * 0.8:
        status = "behind"
    else:
        status = "behind"
    
    return schemas.WeeklySummary(
        **summary,
        status=status
    )

# Photo serving endpoint
@app.get("/photos/{filename}")
async def get_photo(filename: str):
    """Serve meal photos"""
    photos_dir = os.getenv("PHOTOS_DIR", "/data/photos")
    file_path = os.path.join(photos_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)