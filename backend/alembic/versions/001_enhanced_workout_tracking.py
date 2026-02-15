"""Enhanced workout tracking with detailed sets and timing

Revision ID: 001
Revises: 
Create Date: 2024-01-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to workouts table
    op.add_column('workouts', sa.Column('start_time', sa.String(), nullable=True))
    op.add_column('workouts', sa.Column('end_time', sa.String(), nullable=True))
    op.add_column('workouts', sa.Column('intensity', sa.String(), nullable=True))
    op.add_column('workouts', sa.Column('location', sa.String(), nullable=True))
    
    # Add new columns to exercises table
    op.add_column('exercises', sa.Column('muscle_group', sa.String(), nullable=True))
    op.add_column('exercises', sa.Column('exercise_order', sa.Integer(), nullable=True, default=0))
    op.add_column('exercises', sa.Column('target_sets', sa.Integer(), nullable=True))
    op.add_column('exercises', sa.Column('target_reps', sa.Integer(), nullable=True))
    op.add_column('exercises', sa.Column('notes', sa.Text(), nullable=True))
    
    # Remove old columns from exercises table that are now in exercise_sets
    op.drop_column('exercises', 'sets')
    op.drop_column('exercises', 'reps')
    op.drop_column('exercises', 'weight_kg')
    
    # Create exercise_sets table
    op.create_table('exercise_sets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('exercise_id', sa.Integer(), nullable=True),
        sa.Column('set_number', sa.Integer(), nullable=True),
        sa.Column('reps', sa.Integer(), nullable=True),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('rest_seconds', sa.Integer(), nullable=True),
        sa.Column('rpe', sa.Integer(), nullable=True),
        sa.Column('completed', sa.Boolean(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exercise_sets_id'), 'exercise_sets', ['id'], unique=False)


def downgrade() -> None:
    # Remove new workout columns
    op.drop_column('workouts', 'location')
    op.drop_column('workouts', 'intensity')
    op.drop_column('workouts', 'end_time')
    op.drop_column('workouts', 'start_time')
    
    # Remove new exercise columns
    op.drop_column('exercises', 'notes')
    op.drop_column('exercises', 'target_reps')
    op.drop_column('exercises', 'target_sets')
    op.drop_column('exercises', 'exercise_order')
    op.drop_column('exercises', 'muscle_group')
    
    # Add back old exercise columns
    op.add_column('exercises', sa.Column('weight_kg', sa.Float(), nullable=True))
    op.add_column('exercises', sa.Column('reps', sa.Integer(), nullable=True))
    op.add_column('exercises', sa.Column('sets', sa.Integer(), nullable=True))
    
    # Drop exercise_sets table
    op.drop_index(op.f('ix_exercise_sets_id'), table_name='exercise_sets')
    op.drop_table('exercise_sets')