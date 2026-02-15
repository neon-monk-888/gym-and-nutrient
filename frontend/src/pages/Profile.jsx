import React, { useState, useEffect } from 'react'
import { profileApi } from '../utils/api'
import { formatWeight } from '../utils/format'
import { 
  UserIcon, 
  CheckIcon,
  CalculatorIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const Profile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await profileApi.get()
      setProfile(response.data)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await profileApi.update(profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert('Failed to save profile')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setProfile({ 
      ...profile, 
      [field]: field.includes('weight') || field.includes('height') || field.includes('target') 
        ? parseFloat(value) || null 
        : value 
    })
  }

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)' },
    { value: 'extra_active', label: 'Extra Active (very hard exercise, physical job)' }
  ]

  const calculateProjectedDate = () => {
    if (!profile?.current_weight || !profile?.goal_weight) return null
    
    const weightDiff = Math.abs(profile.goal_weight - profile.current_weight)
    const weeksNeeded = Math.ceil(weightDiff / 0.3) // Assuming 0.3kg per week
    const projectedDate = new Date()
    projectedDate.setDate(projectedDate.getDate() + (weeksNeeded * 7))
    
    return projectedDate.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load profile</p>
        <button onClick={loadProfile} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`btn-primary inline-flex items-center ${
            saved ? 'bg-green-600 hover:bg-green-700' : ''
          }`}
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="card">
        <div className="flex items-center mb-4">
          <UserIcon className="h-6 w-6 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Current Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={profile.current_weight || ''}
              onChange={(e) => handleInputChange('current_weight', e.target.value)}
              className="input"
              placeholder="65.0"
            />
          </div>
          
          <div>
            <label className="label">Goal Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={profile.goal_weight || ''}
              onChange={(e) => handleInputChange('goal_weight', e.target.value)}
              className="input"
              placeholder="63.0"
            />
          </div>
          
          <div>
            <label className="label">Height (cm)</label>
            <input
              type="number"
              min="0"
              value={profile.height_cm || ''}
              onChange={(e) => handleInputChange('height_cm', e.target.value)}
              className="input"
              placeholder="175"
            />
          </div>
          
          <div>
            <label className="label">Activity Level</label>
            <select
              value={profile.activity_level || 'moderately_active'}
              onChange={(e) => handleInputChange('activity_level', e.target.value)}
              className="input"
            >
              {activityLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Dietary Preference</label>
          <select
            value={profile.dietary_preference || 'vegetarian'}
            onChange={(e) => handleInputChange('dietary_preference', e.target.value)}
            className="input max-w-xs"
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="pescatarian">Pescatarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>
      </div>

      {/* Goals & Progress */}
      {profile.current_weight && profile.goal_weight && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Goal Progress</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Current</p>
              <p className="text-xl font-bold text-gray-900">
                {formatWeight(profile.current_weight)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">Target</p>
              <p className="text-xl font-bold text-primary-600">
                {formatWeight(profile.goal_weight)}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">To Go</p>
              <p className="text-xl font-bold text-gray-900">
                {formatWeight(Math.abs(profile.goal_weight - profile.current_weight))}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, 
                  (Math.abs(profile.current_weight - profile.goal_weight) / 
                   Math.abs(profile.current_weight - profile.goal_weight)) * 100
                ))}%`
              }}
            />
          </div>
          
          {calculateProjectedDate() && (
            <p className="text-sm text-gray-600 text-center">
              Projected completion: {calculateProjectedDate()}
              <span className="block text-xs text-gray-500 mt-1">
                (Assuming 0.3kg per week)
              </span>
            </p>
          )}
        </div>
      )}

      {/* Daily Targets */}
      <div className="card">
        <div className="flex items-center mb-4">
          <CalculatorIcon className="h-6 w-6 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Daily Targets</h2>
        </div>
        
        {profile.tdee && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>TDEE (maintenance):</strong> {profile.tdee} calories/day
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Total Daily Energy Expenditure based on your stats
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Daily Calories</label>
            <input
              type="number"
              min="0"
              value={profile.daily_calorie_target || ''}
              onChange={(e) => handleInputChange('daily_calorie_target', e.target.value)}
              className="input"
              placeholder="2500"
            />
          </div>
          
          <div>
            <label className="label">Daily Protein (g)</label>
            <input
              type="number"
              min="0"
              value={profile.daily_protein_target || ''}
              onChange={(e) => handleInputChange('daily_protein_target', e.target.value)}
              className="input"
              placeholder="150"
            />
          </div>
          
          <div>
            <label className="label">Daily Carbs (g)</label>
            <input
              type="number"
              min="0"
              value={profile.daily_carbs_target || ''}
              onChange={(e) => handleInputChange('daily_carbs_target', e.target.value)}
              className="input"
              placeholder="300"
            />
          </div>
          
          <div>
            <label className="label">Daily Fat (g)</label>
            <input
              type="number"
              min="0"
              value={profile.daily_fat_target || ''}
              onChange={(e) => handleInputChange('daily_fat_target', e.target.value)}
              className="input"
              placeholder="80"
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Macro Distribution</h3>
          {profile.daily_calorie_target && profile.daily_protein_target && profile.daily_carbs_target && profile.daily_fat_target && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Protein:</span>
                <span className="ml-1">
                  {Math.round((profile.daily_protein_target * 4 / profile.daily_calorie_target) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-yellow-600 font-medium">Carbs:</span>
                <span className="ml-1">
                  {Math.round((profile.daily_carbs_target * 4 / profile.daily_calorie_target) * 100)}%
                </span>
              </div>
              <div>
                <span className="text-purple-600 font-medium">Fat:</span>
                <span className="ml-1">
                  {Math.round((profile.daily_fat_target * 9 / profile.daily_calorie_target) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="card">
        <div className="flex items-center mb-4">
          <CogIcon className="h-6 w-6 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">App Information</h2>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <p>🎯 Designed for vegetarian bulking</p>
          <p>📱 Mobile-optimized for easy logging</p>
          <p>🤖 AI-powered meal analysis via OpenAI</p>
          <p>💾 All data stored locally in SQLite</p>
          <p>🔒 Zero cloud dependencies, complete privacy</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Gym & Nutrient Tracker v1.0.0
            <br />
            Built with FastAPI + React + SQLite
          </p>
        </div>
      </div>
    </div>
  )
}

export default Profile