from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Profile(Base):
    __tablename__ = "profile"
    
    id = Column(Integer, primary_key=True, index=True)
    current_weight = Column(Float)  # kg
    goal_weight = Column(Float)  # kg
    height_cm = Column(Integer)
    activity_level = Column(String)  # sedentary, lightly_active, moderately_active, very_active
    tdee = Column(Integer)  # calculated TDEE
    daily_calorie_target = Column(Integer)
    daily_protein_target = Column(Integer)  # grams
    daily_carbs_target = Column(Integer)  # grams  
    daily_fat_target = Column(Integer)  # grams
    dietary_preference = Column(String, default="vegetarian")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Meal(Base):
    __tablename__ = "meals"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String)  # YYYY-MM-DD format
    time = Column(String)  # HH:MM format
    photo_path = Column(String, nullable=True)
    calories = Column(Integer)
    protein = Column(Float)  # grams
    carbs = Column(Float)   # grams
    fat = Column(Float)     # grams
    fibre = Column(Float)   # grams
    source = Column(String)  # 'photo' or 'manual'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")

class MealItem(Base):
    __tablename__ = "meal_items"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"))
    name = Column(String)
    portion = Column(String)  # e.g. "1 cup", "150g"
    calories = Column(Integer)
    protein = Column(Float)   # grams
    carbs = Column(Float)     # grams
    fat = Column(Float)       # grams
    
    meal = relationship("Meal", back_populates="items")

class Workout(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String)  # YYYY-MM-DD format
    start_time = Column(String, nullable=True)  # HH:MM format when workout started
    end_time = Column(String, nullable=True)    # HH:MM format when workout ended
    type = Column(String)  # muay_thai, weightlifting, cardio, flexibility, sports
    duration_minutes = Column(Integer)
    intensity = Column(String, nullable=True)   # light, moderate, intense, max
    location = Column(String, nullable=True)    # gym, home, park, etc
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    name = Column(String)  # e.g. "Bench Press", "Squats"
    muscle_group = Column(String, nullable=True)  # chest, legs, back, arms, shoulders, core
    exercise_order = Column(Integer, default=0)   # order within the workout
    target_sets = Column(Integer, nullable=True)  # planned sets
    target_reps = Column(Integer, nullable=True)  # planned reps per set
    notes = Column(Text, nullable=True)           # exercise-specific notes
    
    workout = relationship("Workout", back_populates="exercises")
    sets = relationship("ExerciseSet", back_populates="exercise", cascade="all, delete-orphan")

class ExerciseSet(Base):
    __tablename__ = "exercise_sets"
    
    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    set_number = Column(Integer)              # 1, 2, 3, etc
    reps = Column(Integer)                    # actual reps performed
    weight_kg = Column(Float, nullable=True)  # weight used (null for bodyweight)
    rest_seconds = Column(Integer, nullable=True)  # rest time before this set
    rpe = Column(Integer, nullable=True)      # Rate of Perceived Exertion (1-10)
    completed = Column(Boolean, default=True) # whether the set was completed as planned
    notes = Column(Text, nullable=True)       # set-specific notes (form, difficulty, etc)
    timestamp = Column(DateTime, server_default=func.now())  # when this set was logged
    
    exercise = relationship("Exercise", back_populates="sets")

class WeighIn(Base):
    __tablename__ = "weigh_ins"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String)  # YYYY-MM-DD format
    weight_kg = Column(Float)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())