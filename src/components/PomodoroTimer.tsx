'use client'

import { useState, useEffect } from 'react'
import { PlayIcon, PauseIcon, StopIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface PomodoroTimerProps {
  onComplete?: () => void
}

export default function PomodoroTimer({ onComplete }: PomodoroTimerProps) {
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [sessions, setSessions] = useState(0)

  const workTime = 25 * 60 // 25 minutes
  const breakTime = 5 * 60 // 5 minutes
  const longBreakTime = 15 * 60 // 15 minutes (after 4 sessions)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false)
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const handleComplete = () => {
    if (mode === 'work') {
      setSessions(prev => prev + 1)
      setMode('break')
      setTimeLeft(sessions >= 3 ? longBreakTime : breakTime)
    } else {
      setMode('work')
      setTimeLeft(workTime)
    }
    onComplete?.()
  }

  const startTimer = () => setIsActive(true)
  const pauseTimer = () => setIsActive(false)
  const stopTimer = () => {
    setIsActive(false)
    setTimeLeft(mode === 'work' ? workTime : breakTime)
  }
  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(workTime)
    setMode('work')
    setSessions(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const total = mode === 'work' ? workTime : (sessions >= 3 ? longBreakTime : breakTime)
    return ((total - timeLeft) / total) * 100
  }

  const getModeColor = () => {
    if (mode === 'work') return 'text-red-500'
    return 'text-green-500'
  }

  const getModeBg = () => {
    if (mode === 'work') return 'bg-red-50 border-red-200'
    return 'bg-green-50 border-green-200'
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${getModeBg()} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">
            {mode === 'work' ? '🍅' : '☕'}
          </span>
          <div>
            <h3 className={`font-semibold ${getModeColor()}`}>
              {mode === 'work' ? 'Focus Time' : 'Break Time'}
            </h3>
            <p className="text-sm text-slate-600">
              Session {sessions + 1} • {mode === 'work' ? '25 min' : sessions >= 3 ? '15 min' : '5 min'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-3xl font-mono font-bold ${getModeColor()}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="w-32 bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                mode === 'work' ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-3">
        {!isActive ? (
          <button
            onClick={startTimer}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlayIcon className="h-5 w-5" />
            <span>Start</span>
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PauseIcon className="h-5 w-5" />
            <span>Pause</span>
          </button>
        )}
        
        <button
          onClick={stopTimer}
          className="flex items-center space-x-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <StopIcon className="h-5 w-5" />
          <span>Stop</span>
        </button>
        
        <button
          onClick={resetTimer}
          className="flex items-center space-x-2 bg-slate-300 hover:bg-slate-400 text-slate-700 px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowPathIcon className="h-5 w-5" />
          <span>Reset</span>
        </button>
      </div>

      {sessions > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-600">
            Completed {sessions} {sessions === 1 ? 'session' : 'sessions'} today
          </p>
        </div>
      )}
    </div>
  )
}
