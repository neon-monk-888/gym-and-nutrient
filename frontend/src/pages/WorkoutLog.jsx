import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { workoutsApi } from '../utils/api'
import { formatDate, formatTime, formatDuration } from '../utils/format'
import { 
  FireIcon, 
  PlusIcon, 
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  MapPinIcon,
  BoltIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const WorkoutLog = () => {
  const [workouts, setWorkouts] = useState([])
  const [workoutStats, setWorkoutStats] = useState(null)
  const [exerciseLibrary, setExerciseLibrary] = useState({})
  const [loading, setLoading] = useState(false)
  const [showAddWorkout, setShowAddWorkout] = useState(false)
  const [expandedWorkouts, setExpandedWorkouts] = useState(new Set())
  const [newWorkout, setNewWorkout] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '',
    end_time: '',
    type: 'weightlifting',
    duration_minutes: 60,
    intensity: 'moderate',
    location: '',
    notes: '',
    exercises: []
  })

  useEffect(() => {
    loadWorkouts()
    loadWorkoutStats()
    loadExerciseLibrary()
  }, [])

  const loadWorkouts = async () => {
    try {
      setLoading(true)
      const response = await workoutsApi.getByRange('month')
      setWorkouts(response.data)
    } catch (err) {
      console.error('Failed to load workouts:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkoutStats = async () => {
    try {
      const response = await fetch('/api/workouts/stats/summary?days=30')
      const stats = await response.json()
      setWorkoutStats(stats)
    } catch (err) {
      console.error('Failed to load workout stats:', err)
    }
  }

  const loadExerciseLibrary = async () => {
    try {
      const response = await fetch('/api/exercises/library')
      const library = await response.json()
      setExerciseLibrary(library)
    } catch (err) {
      console.error('Failed to load exercise library:', err)
    }
  }

  const handleAddExercise = () => {
    setNewWorkout({
      ...newWorkout,
      exercises: [
        ...newWorkout.exercises,
        {
          name: '',
          muscle_group: '',
          exercise_order: newWorkout.exercises.length,
          target_sets: 3,
          target_reps: 10,
          notes: '',
          sets: [
            { set_number: 1, reps: 10, weight_kg: null, rest_seconds: 90, rpe: 7, completed: true, notes: '' }
          ]
        }
      ]
    })
  }

  const handleExerciseChange = (exerciseIndex, field, value) => {
    const exercises = [...newWorkout.exercises]
    exercises[exerciseIndex] = {
      ...exercises[exerciseIndex],
      [field]: value
    }
    setNewWorkout({ ...newWorkout, exercises })
  }

  const handleAddSet = (exerciseIndex) => {
    const exercises = [...newWorkout.exercises]
    const exercise = exercises[exerciseIndex]
    const newSetNumber = exercise.sets.length + 1
    
    // Copy previous set as template
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const newSet = {
      set_number: newSetNumber,
      reps: lastSet?.reps || 10,
      weight_kg: lastSet?.weight_kg || null,
      rest_seconds: 90,
      rpe: 7,
      completed: true,
      notes: ''
    }
    
    exercise.sets.push(newSet)
    setNewWorkout({ ...newWorkout, exercises })
  }

  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    const exercises = [...newWorkout.exercises]
    exercises[exerciseIndex].sets[setIndex] = {
      ...exercises[exerciseIndex].sets[setIndex],
      [field]: field === 'weight_kg' ? (value === '' ? null : parseFloat(value)) : value
    }
    setNewWorkout({ ...newWorkout, exercises })
  }

  const handleRemoveSet = (exerciseIndex, setIndex) => {
    const exercises = [...newWorkout.exercises]
    exercises[exerciseIndex].sets = exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex)
    // Renumber sets
    exercises[exerciseIndex].sets.forEach((set, i) => {
      set.set_number = i + 1
    })
    setNewWorkout({ ...newWorkout, exercises })
  }

  const handleRemoveExercise = (exerciseIndex) => {
    const exercises = newWorkout.exercises.filter((_, i) => i !== exerciseIndex)
    // Renumber exercise order
    exercises.forEach((exercise, i) => {
      exercise.exercise_order = i
    })
    setNewWorkout({ ...newWorkout, exercises })
  }

  const handleSubmitWorkout = async () => {
    try {
      await workoutsApi.create(newWorkout)
      setShowAddWorkout(false)
      setNewWorkout({
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '',
        end_time: '',
        type: 'weightlifting',
        duration_minutes: 60,
        intensity: 'moderate',
        location: '',
        notes: '',
        exercises: []
      })
      loadWorkouts()
      loadWorkoutStats()
    } catch (err) {
      alert('Failed to save workout')
      console.error(err)
    }
  }

  const deleteWorkout = async (workoutId) => {
    if (!confirm('Delete this workout and all its exercises?')) return

    try {
      await workoutsApi.delete(workoutId)
      loadWorkouts()
      loadWorkoutStats()
    } catch (err) {
      alert('Failed to delete workout')
      console.error(err)
    }
  }

  const toggleWorkoutExpanded = (workoutId) => {
    const newExpanded = new Set(expandedWorkouts)
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId)
    } else {
      newExpanded.add(workoutId)
    }
    setExpandedWorkouts(newExpanded)
  }

  const calculateTotalVolume = (exercise) => {
    return exercise.sets.reduce((total, set) => {
      return total + (set.weight_kg ? set.weight_kg * set.reps : 0)
    }, 0)
  }

  const workoutTypes = [
    { value: 'weightlifting', label: 'Weightlifting', emoji: '🏋️' },
    { value: 'muay_thai', label: 'Muay Thai', emoji: '🥊' },
    { value: 'cardio', label: 'Cardio', emoji: '🏃' },
    { value: 'flexibility', label: 'Flexibility', emoji: '🧘' },
    { value: 'sports', label: 'Sports', emoji: '⚽' }
  ]

  const intensityLevels = [
    { value: 'light', label: 'Light', color: 'text-green-600' },
    { value: 'moderate', label: 'Moderate', color: 'text-yellow-600' },
    { value: 'intense', label: 'Intense', color: 'text-orange-600' },
    { value: 'max', label: 'Max Effort', color: 'text-red-600' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workout Log</h1>
        <button
          onClick={() => setShowAddWorkout(true)}
          className="btn-primary inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Workout
        </button>
      </div>

      {/* Workout Stats */}
      {workoutStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-2xl font-bold text-primary-600">{workoutStats.total_workouts}</p>
            <p className="text-sm text-gray-500">Workouts (30d)</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">{Math.round(workoutStats.workouts_per_week * 10) / 10}</p>
            <p className="text-sm text-gray-500">Per Week</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-purple-600">{formatDuration(workoutStats.total_duration_minutes)}</p>
            <p className="text-sm text-gray-500">Total Time</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{Math.round(workoutStats.total_volume_kg)}</p>
            <p className="text-sm text-gray-500">Total Volume (kg)</p>
          </div>
        </div>
      )}

      {/* Workouts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          </div>
        ) : workouts.length > 0 ? (
          workouts.map((workout) => (
            <div key={workout.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FireIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900 capitalize">
                          {workout.type.replace('_', ' ')}
                          {workoutTypes.find(t => t.value === workout.type)?.emoji && (
                            <span className="ml-1">{workoutTypes.find(t => t.value === workout.type)?.emoji}</span>
                          )}
                        </h3>
                        {workout.intensity && (
                          <span className={`text-xs font-medium ${intensityLevels.find(l => l.value === workout.intensity)?.color || 'text-gray-600'}`}>
                            {intensityLevels.find(l => l.value === workout.intensity)?.label}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleWorkoutExpanded(workout.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {expandedWorkouts.has(workout.id) ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>📅 {formatDate(workout.date, 'MMM d, yyyy')}</span>
                      {workout.start_time && (
                        <span>🕐 {formatTime(workout.start_time)}</span>
                      )}
                      <span>⏱️ {formatDuration(workout.duration_minutes)}</span>
                      {workout.location && (
                        <span>📍 {workout.location}</span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{workout.exercises.length}</span> exercises
                      {workout.exercises.length > 0 && (
                        <span className="ml-2">
                          • <span className="font-medium">
                            {workout.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
                          </span> sets
                        </span>
                      )}
                    </div>

                    {workout.notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">{workout.notes}</p>
                    )}

                    {/* Expanded Exercise Details */}
                    {expandedWorkouts.has(workout.id) && workout.exercises.length > 0 && (
                      <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                        {workout.exercises.map((exercise, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{exercise.name}</h4>
                              {exercise.muscle_group && (
                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded capitalize">
                                  {exercise.muscle_group}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              {exercise.sets.map((set, setIndex) => (
                                <div key={setIndex} className="flex items-center justify-between py-1">
                                  <div className="flex items-center space-x-4">
                                    <span className="w-8 text-center text-gray-500">
                                      {set.set_number}
                                    </span>
                                    <span>
                                      {set.reps} reps
                                      {set.weight_kg && <span className="ml-1">@ {set.weight_kg}kg</span>}
                                    </span>
                                    {set.rpe && (
                                      <span className="text-xs text-gray-500">RPE {set.rpe}</span>
                                    )}
                                  </div>
                                  {!set.completed && (
                                    <span className="text-xs text-red-500">Failed</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {exercise.sets.some(s => s.weight_kg) && (
                              <div className="mt-2 text-xs text-gray-500">
                                Volume: {Math.round(calculateTotalVolume(exercise))}kg
                              </div>
                            )}
                            
                            {exercise.notes && (
                              <p className="mt-2 text-xs text-gray-600 italic">{exercise.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteWorkout(workout.id)}
                  className="text-gray-400 hover:text-red-500 p-1 ml-4"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-8">
            <FireIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts logged</h3>
            <p className="text-gray-500 mb-4">Start tracking your fitness journey</p>
            <button
              onClick={() => setShowAddWorkout(true)}
              className="btn-primary"
            >
              Add First Workout
            </button>
          </div>
        )}
      </div>

      {/* Add workout modal */}
      {showAddWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Add Workout</h3>
                <button
                  onClick={() => setShowAddWorkout(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic workout info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Date</label>
                    <input
                      type="date"
                      value={newWorkout.date}
                      onChange={(e) => setNewWorkout({ ...newWorkout, date: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select
                      value={newWorkout.type}
                      onChange={(e) => setNewWorkout({ ...newWorkout, type: e.target.value })}
                      className="input"
                    >
                      {workoutTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.emoji} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Start Time</label>
                    <input
                      type="time"
                      value={newWorkout.start_time}
                      onChange={(e) => setNewWorkout({ ...newWorkout, start_time: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input
                      type="time"
                      value={newWorkout.end_time}
                      onChange={(e) => setNewWorkout({ ...newWorkout, end_time: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Duration (minutes)</label>
                    <input
                      type="number"
                      value={newWorkout.duration_minutes}
                      onChange={(e) => setNewWorkout({ 
                        ...newWorkout, 
                        duration_minutes: parseInt(e.target.value) || 0
                      })}
                      className="input"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="label">Intensity</label>
                    <select
                      value={newWorkout.intensity}
                      onChange={(e) => setNewWorkout({ ...newWorkout, intensity: e.target.value })}
                      className="input"
                    >
                      {intensityLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Location (optional)</label>
                  <input
                    type="text"
                    value={newWorkout.location}
                    onChange={(e) => setNewWorkout({ ...newWorkout, location: e.target.value })}
                    className="input"
                    placeholder="Gym, Home, Park..."
                  />
                </div>

                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea
                    value={newWorkout.notes}
                    onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                    className="input"
                    rows="2"
                    placeholder="How did you feel? Any observations?"
                  />
                </div>

                {/* Exercises section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Exercises</h4>
                    <button
                      type="button"
                      onClick={handleAddExercise}
                      className="btn-secondary text-sm"
                    >
                      Add Exercise
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newWorkout.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-gray-900">Exercise {exerciseIndex + 1}</h5>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exerciseIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="md:col-span-2">
                            <label className="label">Exercise Name</label>
                            <input
                              type="text"
                              placeholder="e.g., Bench Press"
                              value={exercise.name}
                              onChange={(e) => handleExerciseChange(exerciseIndex, 'name', e.target.value)}
                              className="input"
                            />
                          </div>
                          <div>
                            <label className="label">Muscle Group</label>
                            <select
                              value={exercise.muscle_group}
                              onChange={(e) => handleExerciseChange(exerciseIndex, 'muscle_group', e.target.value)}
                              className="input"
                            >
                              <option value="">Select...</option>
                              {Object.keys(exerciseLibrary).map(group => (
                                <option key={group} value={group} className="capitalize">
                                  {group}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div>
                            <label className="label">Target Sets</label>
                            <input
                              type="number"
                              value={exercise.target_sets || ''}
                              onChange={(e) => handleExerciseChange(exerciseIndex, 'target_sets', parseInt(e.target.value) || null)}
                              className="input"
                              min="1"
                            />
                          </div>
                          <div>
                            <label className="label">Target Reps</label>
                            <input
                              type="number"
                              value={exercise.target_reps || ''}
                              onChange={(e) => handleExerciseChange(exerciseIndex, 'target_reps', parseInt(e.target.value) || null)}
                              className="input"
                              min="1"
                            />
                          </div>
                        </div>

                        {/* Sets */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="label mb-0">Sets</label>
                            <button
                              type="button"
                              onClick={() => handleAddSet(exerciseIndex)}
                              className="text-sm text-primary-600 hover:text-primary-800"
                            >
                              + Add Set
                            </button>
                          </div>

                          <div className="space-y-2">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="grid grid-cols-6 gap-2 items-center bg-gray-50 rounded p-2">
                                <div className="text-sm font-medium text-center">
                                  {set.set_number}
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    placeholder="Reps"
                                    value={set.reps}
                                    onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                    className="input text-sm"
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    placeholder="Weight (kg)"
                                    value={set.weight_kg || ''}
                                    onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight_kg', e.target.value)}
                                    className="input text-sm"
                                    step="0.5"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    placeholder="Rest (s)"
                                    value={set.rest_seconds || ''}
                                    onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'rest_seconds', parseInt(e.target.value) || null)}
                                    className="input text-sm"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    placeholder="RPE"
                                    value={set.rpe || ''}
                                    onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'rpe', parseInt(e.target.value) || null)}
                                    className="input text-sm"
                                    min="1"
                                    max="10"
                                  />
                                </div>
                                <div className="text-center">
                                  {exercise.sets.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="label">Exercise Notes (optional)</label>
                          <input
                            type="text"
                            placeholder="Form cues, observations..."
                            value={exercise.notes}
                            onChange={(e) => handleExerciseChange(exerciseIndex, 'notes', e.target.value)}
                            className="input"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSubmitWorkout}
                    className="btn-primary flex-1 inline-flex items-center justify-center"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Save Workout
                  </button>
                  <button
                    onClick={() => setShowAddWorkout(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutLog