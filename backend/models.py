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
    type = Column(String)  # muay_thai, weightlifting, cardio
    duration_minutes = Column(Integer)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    name = Column(String)  # e.g. "Bench Press", "Squats"
    sets = Column(Integer)
    reps = Column(Integer)
    weight_kg = Column(Float, nullable=True)  # null for bodyweight/cardio
    
    workout = relationship("Workout", back_populates="exercises")

class WeighIn(Base):
    __tablename__ = "weigh_ins"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String)  # YYYY-MM-DD format
    weight_kg = Column(Float)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())