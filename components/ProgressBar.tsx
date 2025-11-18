'use client'

interface ProgressBarProps {
  currentGroup: number
  totalGroups: number
}

export default function ProgressBar({ currentGroup, totalGroups }: ProgressBarProps) {
  const progress = (currentGroup / totalGroups) * 100

  return (
    <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
      <div
        className="bg-primary h-3 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>Grupo {currentGroup} de {totalGroups}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  )
}
