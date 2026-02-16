import React from 'react'
import { calculatePercentage, formatMacros, formatCalories } from '../utils/format'

const MacroBar = ({ label, current, target, unit = 'g', color = 'primary' }) => {
  const percentage = calculatePercentage(current, target)
  const remaining = Math.max(0, target - current)

  const colorClasses = {
    primary: 'bg-primary-600',
    blue: 'bg-blue-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600'
  }

  const bgColorClasses = {
    primary: 'bg-primary-100',
    blue: 'bg-blue-100', 
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900">
            {unit === 'cal' ? formatCalories(current) : formatMacros(current, unit)}
          </span>
          <span className="text-xs text-gray-500 ml-1">
            / {unit === 'cal' ? formatCalories(target) : formatMacros(target, unit)}
          </span>
        </div>
      </div>
      
      <div className="w-full">
        <div className={`w-full h-3 rounded-full ${bgColorClasses[color]}`}>
          <div
            className={`h-3 rounded-full transition-all duration-300 ${colorClasses[color]}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{percentage}%</span>
          {remaining > 0 && (
            <span className="text-xs text-gray-500">
              {formatMacros(remaining, unit)} remaining
            </span>
          )}
          {remaining <= 0 && percentage > 100 && (
            <span className="text-xs text-red-500">
              +{formatMacros(current - target, unit)} over
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MacroBar