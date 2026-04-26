import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { Task } from '../types'
import { estimatedBucket } from '../lib/time'

const BUCKETS = [15, 30, 60, 90] as const

export function BrainDump() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { tasks, addTask, setTaskEstimate, scheduleTask, setView, selectedDate } = useStore()

  const dumpTasks = tasks.filter(t => t.status === 'open' && !t.scheduledDate)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
      e.preventDefault()
      addTask(input.trim())
      setInput('')
    }
  }

  function boxTaskToday(task: Task) {
    scheduleTask(task.id, selectedDate, null)
    setView('day')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">
          Get it all out. No order, no judgment.
        </p>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind? Press Enter to capture."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-base leading-relaxed"
        />
        <p className="text-xs text-gray-400 mt-1">Press Enter to add · Shift+Enter for new line</p>
      </div>

      {dumpTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Captured ({dumpTasks.length})
            </h2>
            {dumpTasks.length > 0 && (
              <button
                onClick={() => setView('day')}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
              >
                Go to day view →
              </button>
            )}
          </div>

          <div className="space-y-2">
            {dumpTasks.map(task => (
              <DumpTaskRow
                key={task.id}
                task={task}
                onBucket={(mins) => setTaskEstimate(task.id, mins)}
                onBoxToday={() => boxTaskToday(task)}
              />
            ))}
          </div>
        </div>
      )}

      {dumpTasks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🧠</p>
          <p className="text-sm">Nothing captured yet. Start typing above.</p>
        </div>
      )}
    </div>
  )
}

function DumpTaskRow({
  task,
  onBucket,
  onBoxToday,
}: {
  task: Task
  onBucket: (minutes: number) => void
  onBoxToday: () => void
}) {
  const [showBuckets, setShowBuckets] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 group">
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 text-sm truncate">{task.title}</p>
      </div>

      {/* Estimate bucket */}
      <div className="relative">
        <button
          onClick={() => setShowBuckets(s => !s)}
          className="text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg font-mono"
        >
          {estimatedBucket(task.estimatedMinutes)}
        </button>
        {showBuckets && (
          <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1">
            {BUCKETS.map(b => (
              <button
                key={b}
                onClick={() => { onBucket(b); setShowBuckets(false) }}
                className="text-xs px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 font-mono text-gray-700"
              >
                {b < 60 ? `${b}m` : `${b / 60}h`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Box to today */}
      <button
        onClick={onBoxToday}
        className="text-xs text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg whitespace-nowrap"
      >
        Box today
      </button>
    </div>
  )
}
