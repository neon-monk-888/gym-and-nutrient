import React, { useState, useEffect } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { weighInsApi, dashboardApi } from '../utils/api'
import { formatWeight, formatDate, getCurrentWeekStart } from '../utils/format'
import { 
  TrendingUpIcon, 
  PlusIcon, 
  XMarkIcon,
  CheckIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'

const Progress = () => {
  const [weighIns, setWeighIns] = useState([])
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [newWeight, setNewWeight] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight_kg: '',
    notes: ''
  })

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)
      
      // Load weight data
      const weighInsResponse = await weighInsApi.get(90) // 90 days
      setWeighIns(weighInsResponse.data)

      // Load weekly summary
      const summaryResponse = await dashboardApi.getWeeklySummary()
      setWeeklySummary(summaryResponse.data)
      
    } catch (err) {
      console.error('Failed to load progress:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWeight = async () => {
    try {
      const weightData = {
        ...newWeight,
        weight_kg: parseFloat(newWeight.weight_kg)
      }
      
      await weighInsApi.create(weightData)
      setShowAddWeight(false)
      setNewWeight({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight_kg: '',
        notes: ''
      })
      loadProgress()
    } catch (err) {
      alert('Failed to save weight')
      console.error(err)
    }
  }

  // Calculate weight statistics
  const currentWeight = weighIns.length > 0 ? weighIns[0] : null
  const weekAgoWeight = weighIns.find(w => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return w.date === format(weekAgo, 'yyyy-MM-dd')
  })
  const monthAgoWeight = weighIns.find(w => {
    const monthAgo = new Date()
    monthAgo.setDate(monthAgo.getDate() - 30)
    return w.date === format(monthAgo, 'yyyy-MM-dd')
  })

  const weightChange7d = currentWeight && weekAgoWeight 
    ? currentWeight.weight_kg - weekAgoWeight.weight_kg 
    : 0
  const weightChange30d = currentWeight && monthAgoWeight 
    ? currentWeight.weight_kg - monthAgoWeight.weight_kg 
    : 0

  const getStatusColor = (status) => {
    switch (status) {
      case 'on_track': return 'text-green-600 bg-green-100'
      case 'ahead': return 'text-blue-600 bg-blue-100'
      case 'behind': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'on_track': return 'On Track'
      case 'ahead': return 'Ahead of Target'
      case 'behind': return 'Behind Target'
      default: return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <button
          onClick={() => setShowAddWeight(true)}
          className="btn-primary inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Weight
        </button>
      </div>

      {/* Weight Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <ScaleIcon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Current Weight</p>
          <p className="text-2xl font-bold text-gray-900">
            {currentWeight ? formatWeight(currentWeight.weight_kg) : 'No data'}
          </p>
          {currentWeight && (
            <p className="text-xs text-gray-500">
              {formatDate(currentWeight.date, 'MMM d')}
            </p>
          )}
        </div>

        <div className="card text-center">
          <TrendingUpIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">7-Day Change</p>
          <p className={`text-2xl font-bold ${
            weightChange7d > 0 ? 'text-green-600' : 
            weightChange7d < 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {weightChange7d > 0 ? '+' : ''}{weightChange7d.toFixed(1)}kg
          </p>
          <p className="text-xs text-gray-500">Past week</p>
        </div>

        <div className="card text-center">
          <TrendingUpIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">30-Day Change</p>
          <p className={`text-2xl font-bold ${
            weightChange30d > 0 ? 'text-green-600' : 
            weightChange30d < 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {weightChange30d > 0 ? '+' : ''}{weightChange30d.toFixed(1)}kg
          </p>
          <p className="text-xs text-gray-500">Past month</p>
        </div>
      </div>

      {/* Weekly Summary */}
      {weeklySummary && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week's Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  getStatusColor(weeklySummary.status)
                }`}>
                  {getStatusText(weeklySummary.status)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Daily Calories</span>
                <span className="font-semibold">{weeklySummary.avg_daily_calories}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Daily Protein</span>
                <span className="font-semibold">{weeklySummary.avg_daily_protein}g</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Workouts</span>
                <span className="font-semibold">{weeklySummary.total_workouts}</span>
              </div>
              
              {Object.entries(weeklySummary.workouts_by_type || {}).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize ml-4">
                    {type.replace('_', ' ')}
                  </span>
                  <span className="text-sm">{count}</span>
                </div>
              ))}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Weight Change</span>
                <span className={`font-semibold ${
                  weeklySummary.weight_change > 0 ? 'text-green-600' : 
                  weeklySummary.weight_change < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {weeklySummary.weight_change > 0 ? '+' : ''}
                  {weeklySummary.weight_change}kg
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weight History */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weight History (90 days)</h2>
        
        {weighIns.length > 0 ? (
          <div className="space-y-3">
            {weighIns.slice(0, 10).map((weighIn) => (
              <div key={weighIn.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">
                    {formatWeight(weighIn.weight_kg)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(weighIn.date, 'EEEE, MMM d')}
                  </p>
                  {weighIn.notes && (
                    <p className="text-xs text-gray-600 italic mt-1">{weighIn.notes}</p>
                  )}
                </div>
                
                {weighIns.indexOf(weighIn) > 0 && (
                  <div className="text-right">
                    {(() => {
                      const prevWeight = weighIns[weighIns.indexOf(weighIn) - 1]
                      const change = weighIn.weight_kg - prevWeight.weight_kg
                      return (
                        <span className={`text-sm font-medium ${
                          change > 0 ? 'text-green-600' : 
                          change < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}kg
                        </span>
                      )
                    })()}
                  </div>
                )}
              </div>
            ))}
            
            {weighIns.length > 10 && (
              <p className="text-center text-sm text-gray-500 pt-3">
                Showing latest 10 entries • {weighIns.length - 10} more in history
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <ScaleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No weight data</h3>
            <p className="text-gray-500 mb-4">Start tracking your progress</p>
            <button
              onClick={() => setShowAddWeight(true)}
              className="btn-primary"
            >
              Add First Entry
            </button>
          </div>
        )}
      </div>

      {/* Add weight modal */}
      {showAddWeight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Weight</h3>
                <button
                  onClick={() => setShowAddWeight(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={newWeight.date}
                    onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newWeight.weight_kg}
                    onChange={(e) => setNewWeight({ ...newWeight, weight_kg: e.target.value })}
                    className="input"
                    placeholder="65.5"
                  />
                </div>

                <div>
                  <label className="label">Notes (optional)</label>
                  <textarea
                    value={newWeight.notes}
                    onChange={(e) => setNewWeight({ ...newWeight, notes: e.target.value })}
                    className="input"
                    rows="2"
                    placeholder="How are you feeling? Any observations?"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleAddWeight}
                    disabled={!newWeight.weight_kg}
                    className="btn-primary flex-1 inline-flex items-center justify-center disabled:opacity-50"
                  >
                    <CheckIcon className="h-5 w-5 mr-2" />
                    Save Weight
                  </button>
                  <button
                    onClick={() => setShowAddWeight(false)}
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

export default Progress