import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { mealsApi } from '../utils/api'
import { formatTime, formatMacros } from '../utils/format'
import { 
  CameraIcon, 
  PlusIcon, 
  TrashIcon, 
  PhotoIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const MealLog = () => {
  const [meals, setMeals] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false)

  useEffect(() => {
    loadMeals()
  }, [selectedDate])

  const loadMeals = async () => {
    try {
      setLoading(true)
      const response = await mealsApi.getByDate(selectedDate)
      setMeals(response.data)
    } catch (err) {
      console.error('Failed to load meals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoAnalysis = async (file) => {
    try {
      setAnalyzingPhoto(true)
      const response = await mealsApi.analysePhoto(file)
      setAnalysisResult({
        ...response.data.analysis,
        photo_file: file,
        temp_photo_path: response.data.temp_photo_path
      })
    } catch (err) {
      alert('Failed to analyze photo. Please try manual entry.')
      console.error(err)
    } finally {
      setAnalyzingPhoto(false)
    }
  }

  const confirmAnalysis = async () => {
    if (!analysisResult) return

    const mealData = {
      date: selectedDate,
      time: format(new Date(), 'HH:mm'),
      calories: analysisResult.calories,
      protein: analysisResult.protein_g,
      carbs: analysisResult.carbs_g,
      fat: analysisResult.fat_g,
      fibre: analysisResult.fibre_g,
      source: 'photo',
      file: analysisResult.photo_file,
      items: analysisResult.items || []
    }

    try {
      await mealsApi.create(mealData)
      setAnalysisResult(null)
      setShowAddMeal(false)
      loadMeals()
    } catch (err) {
      alert('Failed to save meal')
      console.error(err)
    }
  }

  const deleteMeal = async (mealId) => {
    if (!confirm('Delete this meal?')) return

    try {
      await mealsApi.delete(mealId)
      loadMeals()
    } catch (err) {
      alert('Failed to delete meal')
      console.error(err)
    }
  }

  const dailyTotals = meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
      fibre: totals.fibre + meal.fibre
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meal Log</h1>
        <button
          onClick={() => setShowAddMeal(true)}
          className="btn-primary inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Meal
        </button>
      </div>

      {/* Date picker */}
      <div className="card">
        <label className="label">Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {/* Daily totals */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Totals</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{Math.round(dailyTotals.calories)}</p>
            <p className="text-sm text-gray-500">Calories</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{formatMacros(dailyTotals.protein)}</p>
            <p className="text-sm text-gray-500">Protein</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{formatMacros(dailyTotals.carbs)}</p>
            <p className="text-sm text-gray-500">Carbs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{formatMacros(dailyTotals.fat)}</p>
            <p className="text-sm text-gray-500">Fat</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatMacros(dailyTotals.fibre)}</p>
            <p className="text-sm text-gray-500">Fiber</p>
          </div>
        </div>
      </div>

      {/* Meals list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          </div>
        ) : meals.length > 0 ? (
          meals.map((meal) => (
            <div key={meal.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {meal.photo_path && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{formatTime(meal.time)}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        meal.source === 'photo' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {meal.source === 'photo' ? 'Photo' : 'Manual'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                      <span><strong>{Math.round(meal.calories)}</strong> cal</span>
                      <span><strong>{formatMacros(meal.protein)}</strong> protein</span>
                      <span><strong>{formatMacros(meal.carbs)}</strong> carbs</span>
                      <span><strong>{formatMacros(meal.fat)}</strong> fat</span>
                      <span><strong>{formatMacros(meal.fibre)}</strong> fiber</span>
                    </div>

                    {meal.items && meal.items.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {meal.items.map((item, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            • {item.name} ({item.portion})
                          </div>
                        ))}
                      </div>
                    )}

                    {meal.notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">{meal.notes}</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => deleteMeal(meal.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-8">
            <CameraIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meals logged</h3>
            <p className="text-gray-500 mb-4">Start tracking by adding your first meal</p>
            <button
              onClick={() => setShowAddMeal(true)}
              className="btn-primary"
            >
              Add First Meal
            </button>
          </div>
        )}
      </div>

      {/* Add meal modal */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Meal</h3>
                <button
                  onClick={() => {
                    setShowAddMeal(false)
                    setAnalysisResult(null)
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {!analysisResult ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <CameraIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h4 className="font-medium text-gray-900 mb-2">Take a photo</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      AI will analyze your meal and estimate nutrition
                    </p>
                    
                    <label className="btn-primary cursor-pointer inline-flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            handlePhotoAnalysis(e.target.files[0])
                          }
                        }}
                      />
                      <PhotoIcon className="h-5 w-5 mr-2" />
                      {analyzingPhoto ? 'Analyzing...' : 'Take Photo'}
                    </label>

                    {analyzingPhoto && (
                      <div className="mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">Analyzing your meal...</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Review Analysis</h4>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Calories:</strong> {analysisResult.calories}
                      </div>
                      <div>
                        <strong>Protein:</strong> {formatMacros(analysisResult.protein_g)}
                      </div>
                      <div>
                        <strong>Carbs:</strong> {formatMacros(analysisResult.carbs_g)}
                      </div>
                      <div>
                        <strong>Fat:</strong> {formatMacros(analysisResult.fat_g)}
                      </div>
                    </div>

                    {analysisResult.items && analysisResult.items.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium text-gray-900 mb-2">Detected items:</p>
                        <div className="space-y-1">
                          {analysisResult.items.map((item, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              • {item.name} ({item.portion}) - {item.calories} cal
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={confirmAnalysis}
                      className="btn-primary flex-1 inline-flex items-center justify-center"
                    >
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Save Meal
                    </button>
                    <button
                      onClick={() => setAnalysisResult(null)}
                      className="btn-secondary flex-1"
                    >
                      Retake Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MealLog