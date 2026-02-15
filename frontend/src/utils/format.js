import { format, parseISO, startOfWeek, addDays } from 'date-fns'

export const formatDate = (date, formatString = 'yyyy-MM-dd') => {
  if (typeof date === 'string') {
    return format(parseISO(date), formatString)
  }
  return format(date, formatString)
}

export const formatTime = (time) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

export const getCurrentWeekStart = () => {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

export const getWeekDates = (weekStart) => {
  const start = parseISO(weekStart)
  return Array.from({ length: 7 }, (_, i) => 
    format(addDays(start, i), 'yyyy-MM-dd')
  )
}

export const formatMacros = (value, unit = 'g') => {
  return `${Math.round(value)}${unit}`
}

export const formatWeight = (weight) => {
  return `${weight.toFixed(1)}kg`
}

export const calculatePercentage = (current, target) => {
  if (target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

export const formatCalories = (calories) => {
  return `${Math.round(calories)}`
}

export const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}