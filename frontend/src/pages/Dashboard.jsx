import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { dashboardApi } from '../utils/api'
import MacroBar from '../components/MacroBar'
import { formatWeight, formatDate, formatTime, formatDuration } from '../utils/format'
import { 
  CameraIcon, 
  FireIcon, 
  TrendingUpIcon,
  ClockIcon 
} from '@heroicons/react/24/outline'

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await dashboardApi.get()
      setDashboard(response.data)
    } catch (err) {
      setError('Failed to load dashboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadDashboard}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    )
  }

  const { current_nutrition, targets, remaining, weight_trend, recent_workouts } = dashboard
  const today = format(new Date(), 'EEEE, MMMM d')
  const currentWeight = weight_trend?.length > 0 ? weight_trend[weight_trend.length - 1] : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">{today}</p>
        </div>
        {currentWeight && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Weight</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatWeight(currentWeight.weight)}
            </p>
          </div>
        )}
      </div>

      {/* Nutrition Progress */}
      <div className="card">
        <div className="flex items-center mb-4">
          <CameraIcon className="h-6 w-6 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Today's Nutrition</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <MacroBar
            label="Calories"
            current={current_nutrition.calories}
            target={targets.calories}
            unit="cal"
            color="primary"
          />
          <MacroBar
            label="Protein"
            current={current_nutrition.protein}
            target={targets.protein}
            unit="g"
            color="blue"
          />
          <MacroBar
            label="Carbs"
            current={current_nutrition.carbs}
            target={targets.carbs}
            unit="g"
            color="yellow"
          />
          <MacroBar
            label="Fat"
            current={current_nutrition.fat}
            target={targets.fat}
            unit="g"
            color="purple"
          />
        </div>

        {/* Quick Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">What you need today:</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-gray-600">
              📊 {remaining.calories} calories
            </span>
            <span className="text-gray-600">
              🥩 {Math.round(remaining.protein)}g protein
            </span>
            <span className="text-gray-600">
              🍞 {Math.round(remaining.carbs)}g carbs
            </span>
            <span className="text-gray-600">
              🥑 {Math.round(remaining.fat)}g fat
            </span>
          </div>
        </div>
      </div>

      {/* Weight Trend */}
      {weight_trend && weight_trend.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-4">
            <TrendingUpIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Weight Trend (30 days)</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Current</p>
              <p className="text-xl font-bold text-gray-900">
                {formatWeight(currentWeight.weight)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">7-day Avg</p>
              <p className="text-xl font-bold text-gray-900">
                {formatWeight(currentWeight.rolling_avg)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Change</p>
              <p className={`text-xl font-bold ${
                weight_trend.length > 1 && weight_trend[weight_trend.length - 1].weight > weight_trend[0].weight 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {weight_trend.length > 1 ? (
                  (weight_trend[weight_trend.length - 1].weight - weight_trend[0].weight) >= 0 ? '+' : ''
                ) : ''}
                {weight_trend.length > 1 ? 
                  formatWeight(weight_trend[weight_trend.length - 1].weight - weight_trend[0].weight).replace('kg', '') : '0'
                }kg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FireIcon className="h-6 w-6 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Workouts</h2>
          </div>
          <span className="text-sm text-gray-500">Last 7 days</span>
        </div>
        
        {recent_workouts && recent_workouts.length > 0 ? (
          <div className="space-y-3">
            {recent_workouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <FireIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {workout.type.replace('_', ' ')}
                      {workout.intensity && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded ${
                          workout.intensity === 'light' ? 'bg-green-100 text-green-700' :
                          workout.intensity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          workout.intensity === 'intense' ? 'bg-orange-100 text-orange-700' :
                          workout.intensity === 'max' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {workout.intensity}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(workout.date, 'MMM d')}
                      {workout.start_time && <span> • {formatTime(workout.start_time)}</span>}
                      {workout.location && <span> • {workout.location}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatDuration(workout.duration)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {workout.exercises_count} exercises
                    {workout.total_sets && <span> • {workout.total_sets} sets</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FireIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No workouts this week</p>
            <p className="text-sm">Time to get moving! 💪</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard