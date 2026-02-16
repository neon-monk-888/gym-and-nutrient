from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# Profile schemas
class ProfileBase(BaseModel):
    current_weight: Optional[float] = None
    goal_weight: Optional[float] = None
    height_cm: Optional[int] = None
    activity_level: Optional[str] = None
    daily_calorie_target: Optional[int] = None
    daily_protein_target: Optional[int] = None
    daily_carbs_target: Optional[int] = None
    daily_fat_target: Optional[int] = None
    dietary_preference: str = "vegetarian"

class ProfileCreate(ProfileBase):
    pass

class Profile(ProfileBase):
    id: int
    tdee: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Meal item schemas
class MealItemBase(BaseModel):
    name: str
    portion: str
    calories: int
    protein: float
    carbs: float
    fat: float

class MealItemCreate(MealItemBase):
    pass

class MealItem(MealItemBase):
    id: int
    meal_id: int
    
    class Config:
        from_attributes = True

# Meal schemas
class MealBase(BaseModel):
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    calories: int
    protein: float
    carbs: float
    fat: float
    fibre: float
    source: str  # 'photo' or 'manual'
    notes: Optional[str] = None

class MealCreate(MealBase):
    items: List[MealItemCreate] = []

class Meal(MealBase):
    id: int
    photo_path: Optional[str] = None
    created_at: datetime
    items: List[MealItem] = []
    
    class Config:
        from_attributes = True

# AI Analysis schemas
class NutritionAnalysis(BaseModel):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fibre_g: float
    items: List[dict]  # [{name, portion, calories}, ...]

# Exercise Set schemas
class ExerciseSetBase(BaseModel):
    set_number: int
    reps: int
    weight_kg: Optional[float] = None
    rest_seconds: Optional[int] = None
    rpe: Optional[int] = None  # Rate of Perceived Exertion 1-10
    completed: bool = True
    notes: Optional[str] = None

class ExerciseSetCreate(ExerciseSetBase):
    pass

class ExerciseSet(ExerciseSetBase):
    id: int
    exercise_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Exercise schemas
class ExerciseBase(BaseModel):
    name: str
    muscle_group: Optional[str] = None
    exercise_order: int = 0
    target_sets: Optional[int] = None
    target_reps: Optional[int] = None
    notes: Optional[str] = None

class ExerciseCreate(ExerciseBase):
    sets: List[ExerciseSetCreate] = []

class Exercise(ExerciseBase):
    id: int
    workout_id: int
    sets: List[ExerciseSet] = []
    
    class Config:
        from_attributes = True

# Workout schemas
class WorkoutBase(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: Optional[str] = None  # HH:MM
    end_time: Optional[str] = None    # HH:MM
    type: str  # muay_thai, weightlifting, cardio, flexibility, sports
    duration_minutes: int
    intensity: Optional[str] = None   # light, moderate, intense, max
    location: Optional[str] = None    # gym, home, park
    notes: Optional[str] = None

class WorkoutCreate(WorkoutBase):
    exercises: List[ExerciseCreate] = []

class Workout(WorkoutBase):
    id: int
    created_at: datetime
    exercises: List[Exercise] = []
    
    class Config:
        from_attributes = True

# Weigh-in schemas
class WeighInBase(BaseModel):
    date: str  # YYYY-MM-DD
    weight_kg: float
    notes: Optional[str] = None

class WeighInCreate(WeighInBase):
    pass

class WeighIn(WeighInBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardData(BaseModel):
    date: str
    current_nutrition: dict  # {calories, protein, carbs, fat, fibre}
    targets: dict  # {calories, protein, carbs, fat}
    remaining: dict  # {calories, protein, carbs, fat}
    weight_trend: List[dict]  # [{date, weight, avg}, ...]
    recent_workouts: List[dict]

class WeeklySummary(BaseModel):
    week_start: str
    avg_daily_calories: int
    avg_daily_protein: float
    total_workouts: int
    workouts_by_type: dict
    weight_change: float
    status: str  # on_track, behind, ahead