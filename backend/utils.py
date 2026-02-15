import os
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import Profile, WeighIn, Meal, Workout

def calculate_tdee(weight_kg: float, height_cm: int, age: int, activity_level: str, gender: str = "male") -> int:
    """Calculate Total Daily Energy Expenditure"""
    # Mifflin-St Jeor Equation
    if gender.lower() == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    
    # Activity multipliers
    activity_multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "extra_active": 1.9
    }
    
    multiplier = activity_multipliers.get(activity_level, 1.55)
    return int(bmr * multiplier)

def calculate_macro_targets(tdee: int, surplus: int = 300) -> Dict[str, int]:
    """Calculate macro targets for bulking"""
    total_calories = tdee + surplus
    
    # Bulking macros (rough guidelines)
    # Protein: 1.6-2.2g per kg body weight (we'll use 2g/kg)
    # Fat: 25-30% of calories
    # Carbs: remainder
    
    protein_calories = int(total_calories * 0.20)  # 20% protein
    fat_calories = int(total_calories * 0.27)      # 27% fat  
    carb_calories = total_calories - protein_calories - fat_calories
    
    return {
        "calories": total_calories,
        "protein": protein_calories // 4,  # 4 cal/g
        "fat": fat_calories // 9,          # 9 cal/g
        "carbs": carb_calories // 4        # 4 cal/g
    }

def save_uploaded_file(file_content: bytes, filename: str) -> str:
    """Save uploaded file and return path"""
    photos_dir = os.getenv("PHOTOS_DIR", "/data/photos")
    os.makedirs(photos_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = os.path.splitext(filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(photos_dir, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    return file_path

def get_weight_trend(db: Session, days: int = 30) -> List[Dict[str, Any]]:
    """Get weight trend with 7-day rolling average"""
    cutoff_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    weigh_ins = db.query(WeighIn).filter(
        WeighIn.date >= cutoff_date
    ).order_by(WeighIn.date.asc()).all()
    
    if len(weigh_ins) < 2:
        return []
    
    trend_data = []
    for i, weigh_in in enumerate(weigh_ins):
        # Calculate 7-day rolling average
        start_idx = max(0, i - 6)
        recent_weights = [w.weight_kg for w in weigh_ins[start_idx:i+1]]
        rolling_avg = sum(recent_weights) / len(recent_weights)
        
        trend_data.append({
            "date": weigh_in.date,
            "weight": weigh_in.weight_kg,
            "rolling_avg": round(rolling_avg, 1)
        })
    
    return trend_data

def get_daily_nutrition(db: Session, date: str) -> Dict[str, float]:
    """Get total nutrition for a specific date"""
    meals = db.query(Meal).filter(Meal.date == date).all()
    
    totals = {
        "calories": 0,
        "protein": 0.0,
        "carbs": 0.0,
        "fat": 0.0,
        "fibre": 0.0
    }
    
    for meal in meals:
        totals["calories"] += meal.calories
        totals["protein"] += meal.protein
        totals["carbs"] += meal.carbs
        totals["fat"] += meal.fat
        totals["fibre"] += meal.fibre
    
    return totals

def get_weekly_summary(db: Session, week_start: str) -> Dict[str, Any]:
    """Generate weekly summary stats"""
    week_end = (datetime.strptime(week_start, "%Y-%m-%d") + timedelta(days=6)).strftime("%Y-%m-%d")
    
    # Get all meals for the week
    meals = db.query(Meal).filter(
        Meal.date >= week_start,
        Meal.date <= week_end
    ).all()
    
    # Calculate daily averages
    daily_totals = {}
    for meal in meals:
        if meal.date not in daily_totals:
            daily_totals[meal.date] = {"calories": 0, "protein": 0}
        daily_totals[meal.date]["calories"] += meal.calories
        daily_totals[meal.date]["protein"] += meal.protein
    
    days_with_data = len(daily_totals)
    avg_calories = sum(day["calories"] for day in daily_totals.values()) / max(1, days_with_data)
    avg_protein = sum(day["protein"] for day in daily_totals.values()) / max(1, days_with_data)
    
    # Get workouts for the week
    workouts = db.query(Workout).filter(
        Workout.date >= week_start,
        Workout.date <= week_end
    ).all()
    
    workouts_by_type = {}
    for workout in workouts:
        if workout.type not in workouts_by_type:
            workouts_by_type[workout.type] = 0
        workouts_by_type[workout.type] += 1
    
    # Weight change
    start_weight_entry = db.query(WeighIn).filter(WeighIn.date >= week_start).order_by(WeighIn.date.asc()).first()
    end_weight_entry = db.query(WeighIn).filter(WeighIn.date <= week_end).order_by(WeighIn.date.desc()).first()
    
    weight_change = 0.0
    if start_weight_entry and end_weight_entry:
        weight_change = end_weight_entry.weight_kg - start_weight_entry.weight_kg
    
    return {
        "week_start": week_start,
        "avg_daily_calories": int(avg_calories),
        "avg_daily_protein": round(avg_protein, 1),
        "total_workouts": len(workouts),
        "workouts_by_type": workouts_by_type,
        "weight_change": round(weight_change, 1)
    }