import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { workoutsApi } from '../utils/api'
import { formatDate, formatTime, formatDuration } from '../utils/format'
import { 
  FireIcon, 
  PlusIcon, 
  TrashIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const WorkoutLog = () => {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddWorkout, setShowAddWorkout] = useState(false)
  const [newWorkout, setNewWorkout] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'weightlifting',
    duration_minutes: 60,
    notes: '',
    exercises: []
  })

  useEffect(() => {
    loadWorkouts()
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

  const handleAddExercise = () => {
    setNewWorkout({
      ...newWorkout,
      exercises: [
        ...newWorkout.exercises,
        { name: '', sets: 3, reps: 10, weight_kg: null }
      ]
    })
  }

  const handleExerciseChange = (index, field, value) => {
    const exercises = [...newWorkout.exercises]
    exercises[index] = {
      ...exercises[index],
      [field]: field === 'weight_kg' ? (value === '' ? null : parseFloat(value)) : value
    }
    setNewWorkout({ ...newWorkout, exercises })
  }

  const handleRemoveExercise = (index) => {
    const exercises = newWorkout.exercises.filter((_, i) => i !== index)
    setNewWorkout({ ...newWorkout, exercises })
  }

  const handleSubmitWorkout = async () => {
    try {
      await workoutsApi.create(newWorkout)
      setShowAddWorkout(false)
      setNewWorkout({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'weightlifting',
        duration_minutes: 60,
        notes: '',
        exercises: []
      })
      loadWorkouts()
    } catch (err) {
      alert('Failed to save workout')
      console.error(err)
    }
  }

  const deleteWorkout = async (workoutId) => {
    if (!confirm('Delete this workout?')) return

    try {
      await workoutsApi.delete(workoutId)
      loadWorkouts()
    } catch (err) {
      alert('Failed to delete workout')
      console.error(err)
    }
  }

  const workoutTypes = [
    { value: 'weightlifting', label: 'Weightlifting' },
    { value: 'muay_thai', label: 'Muay Thai' },
    { value: 'cardio', label: 'Cardio' }
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

      {/* Workouts list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          </div>
        ) : workouts.length > 0 ? (
          workouts.map((workout) => (
            <div key={workout.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FireIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900 capitalize">
                        {workout.type.replace('_', ' ')}
                      </h3>
                      <span className="text-sm text-gray-500">
                        • {formatDate(workout.date, 'MMM d, yyyy')}
                        • {formatDuration(workout.duration_minutes)}
                      </span>
                    </div>

                    {workout.exercises && workout.exercises.length > 0 && (
                      <div className="space-y-2">
                        {workout.exercises.map((exercise, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                            <span className="font-medium">{exercise.name}</span>
                            {exercise.weight_kg ? (
                              <span className="ml-2">
                                {exercise.sets}×{exercise.reps} @ {exercise.weight_kg}kg
                              </span>
                            ) : (
                              <span className="ml-2">
                                {exercise.sets}×{exercise.reps}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {workout.notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">{workout.notes}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteWorkout(workout.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
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

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newWorkout.duration_minutes}
                    onChange={(e) => setNewWorkout({ 
                      ...newWorkout, 
                      duration_minutes: parseInt(e.target.value) 
                    })}
                    className="input max-w-xs"
                    min="1"
                  />
                </div>

                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea
                    value={newWorkout.notes}
                    onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                    className="input"
                    rows="2"
                    placeholder="How did it feel? Any observations?"
                  />
                </div>

                {/* Exercises section */}
                {newWorkout.type === 'weightlifting' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="label mb-0">Exercises</label>
                      <button
                        type="button"
                        onClick={handleAddExercise}
                        className="btn-secondary text-sm"
                      >
                        Add Exercise
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newWorkout.exercises.map((exercise, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                placeholder="Exercise name"
                                value={exercise.name}
                                onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                                className="input"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Sets"
                                value={exercise.sets}
                                onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                                className="input"
                                min="1"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Reps"
                                value={exercise.reps}
                                onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                                className="input"
                                min="1"
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="max-w-xs">
                              <input
                                type="number"
                                placeholder="Weight (kg, optional)"
                                value={exercise.weight_kg || ''}
                                onChange={(e) => handleExerciseChange(index, 'weight_kg', e.target.value)}
                                className="input"
                                step="0.5"
                                min="0"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
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