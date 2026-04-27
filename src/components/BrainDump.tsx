import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { Task } from '../types'
import { estimatedBucket } from '../lib/time'

const BUCKETS = [15, 30, 60, 90] as const

export function BrainDump() {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { tasks, addTask, editTask, deleteTask, setTaskEstimate, scheduleTask, setView, selectedDate, pinToMustDo, unpinFromMustDo } = useStore()

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
    <div className="max-w-2xl mx-auto px-4 py-6 overflow-y-auto h-[calc(100dvh-56px)]">
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
            <button
              onClick={() => setView('day')}
              className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              Go to day view →
            </button>
          </div>

          <div className="space-y-2">
            {dumpTasks.map(task => (
              <DumpTaskRow
                key={task.id}
                task={task}
                onBucket={(mins) => setTaskEstimate(task.id, mins)}
                onBoxToday={() => boxTaskToday(task)}
                onEdit={(title, minutes) => editTask(task.id, title, minutes, task.horizon)}
                onDelete={() => deleteTask(task.id)}
                onPin={() => task.mustDoToday ? unpinFromMustDo(task.id) : pinToMustDo(task.id)}
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
  onEdit,
  onDelete,
  onPin,
}: {
  task: Task
  onBucket: (minutes: number) => void
  onBoxToday: () => void
  onEdit: (title: string, minutes: number | null) => void
  onDelete: () => void
  onPin: () => void
}) {
  const [showBuckets, setShowBuckets] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)

  function saveEdit() {
    if (editTitle.trim()) {
      onEdit(editTitle.trim(), task.estimatedMinutes)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white border-2 border-indigo-300 rounded-xl px-4 py-3 flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') saveEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="flex-1 text-sm text-gray-900 bg-transparent outline-none"
        />
        <button onClick={saveEdit} className="text-xs text-indigo-600 font-medium px-2 py-1 hover:bg-indigo-50 rounded-lg">Save</button>
        <button onClick={() => setEditing(false)} className="text-xs text-gray-400 px-2 py-1 hover:bg-gray-50 rounded-lg">Cancel</button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 group">
      <div className="flex-1 min-w-0">
        <p
          className="text-gray-900 text-sm truncate cursor-pointer hover:text-indigo-700"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {task.mustDoToday && <span className="text-rose-500 mr-1" title="Must Do Today">📌</span>}
          {task.title}
        </p>
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

      {/* Pin to Must Do */}
      <button
        onClick={onPin}
        className={`text-xs px-1.5 py-1 rounded-lg transition-colors shrink-0 ${
          task.mustDoToday
            ? 'text-rose-500 bg-rose-50'
            : 'text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100'
        }`}
        title={task.mustDoToday ? 'Unpin from Must Do' : 'Pin to Must Do Today'}
      >
        📌
      </button>

      {/* Edit */}
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-gray-300 hover:text-gray-600 px-1.5 py-1 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        title="Edit"
      >
        ✏️
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="text-xs text-gray-300 hover:text-red-500 px-1.5 py-1 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        title="Delete"
      >
        🗑️
      </button>

      {/* Box to today */}
      <button
        onClick={onBoxToday}
        className="text-xs text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0"
      >
        Box today
      </button>
    </div>
  )
}
