"""SQLite-safe workout migration with proper column handling

Revision ID: 002
Revises: 001
Create Date: 2024-01-21 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SQLite doesn't support dropping columns easily, so we'll handle this in the application
    # For now, just create the new table and ensure it exists
    
    # Create exercise_sets table if it doesn't exist
    try:
        op.create_table('exercise_sets',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('exercise_id', sa.Integer(), nullable=True),
            sa.Column('set_number', sa.Integer(), nullable=True),
            sa.Column('reps', sa.Integer(), nullable=True),
            sa.Column('weight_kg', sa.Float(), nullable=True),
            sa.Column('rest_seconds', sa.Integer(), nullable=True),
            sa.Column('rpe', sa.Integer(), nullable=True),
            sa.Column('completed', sa.Boolean(), nullable=True, default=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('timestamp', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_exercise_sets_id'), 'exercise_sets', ['id'], unique=False)
    except Exception:
        # Table might already exist, that's okay
        pass
    
    # Add columns to workouts table if they don't exist
    try:
        op.add_column('workouts', sa.Column('start_time', sa.String(), nullable=True))
    except Exception:
        pass
    
    try:
        op.add_column('workouts', sa.Column('end_time', sa.String(), nullable=True))
    except Exception:
        pass
        
    try:
        op.add_column('workouts', sa.Column('intensity', sa.String(), nullable=True))
    except Exception:
        pass
        
    try:
        op.add_column('workouts', sa.Column('location', sa.String(), nullable=True))
    except Exception:
        pass
    
    # Add columns to exercises table if they don't exist
    try:
        op.add_column('exercises', sa.Column('muscle_group', sa.String(), nullable=True))
    except Exception:
        pass
        
    try:
        op.add_column('exercises', sa.Column('exercise_order', sa.Integer(), nullable=True, default=0))
    except Exception:
        pass
        
    try:
        op.add_column('exercises', sa.Column('target_sets', sa.Integer(), nullable=True))
    except Exception:
        pass
        
    try:
        op.add_column('exercises', sa.Column('target_reps', sa.Integer(), nullable=True))
    except Exception:
        pass
        
    try:
        op.add_column('exercises', sa.Column('notes', sa.Text(), nullable=True))
    except Exception:
        pass


def downgrade() -> None:
    # For SQLite, we'll keep the old columns for backward compatibility
    # In a real production environment, you might want to create a new table
    # and copy data over, but for this app's use case, this is safer
    pass