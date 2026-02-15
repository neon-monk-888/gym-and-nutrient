import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  HomeIcon, 
  CameraIcon, 
  FireIcon, 
  ChartBarIcon, 
  UserIcon 
} from '@heroicons/react/24/outline'

const Navigation = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Dashboard' },
    { path: '/meals', icon: CameraIcon, label: 'Meals' },
    { path: '/workouts', icon: FireIcon, label: 'Workouts' },
    { path: '/progress', icon: ChartBarIcon, label: 'Progress' },
    { path: '/profile', icon: UserIcon, label: 'Profile' }
  ]

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FireIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Gym & Nutrient
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:space-x-8 sm:items-center">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === path
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-1" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center py-2 px-3 text-xs font-medium rounded-md transition-colors ${
                location.pathname === path
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Navigation