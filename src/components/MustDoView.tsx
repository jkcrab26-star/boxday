import { useState } from 'react'
import { useStore } from '../store'
import type { Task } from '../types'

const MUST_DO_CAP = 3

export function MustDoView() {
  const { tasks, addTask, completeTask, deleteTask, editTask, pinToMustDo, unpinFromMustDo, scheduleTask, selectedDate } = useStore()
  const [input, setInput] = useState('')
  const [capNudge, setCapNudge] = useState(false)

  const mustDoTasks = tasks.filter(t => t.mustDoToday && t.status === 'open')
  const completedMustDo = tasks.filter(t => t.mustDoToday && t.status === 'done')
  const atCap = mustDoTasks.length >= MUST_DO_CAP

  function showCapNudge() {
    setCapNudge(true)
    setTimeout(() => setCapNudge(false), 4000)
  }

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (atCap) { showCapNudge(); return }
    addTask(trimmed)
    setInput('')
    setTimeout(() => {
      const store = useStore.getState()
      const newTask = [...store.tasks].reverse().find(t => t.title === trimmed && t.mustDoToday === false)
      if (newTask) {
        pinToMustDo(newTask.id)
        scheduleTask(newTask.id, selectedDate, null)
      }
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-rose-700 mb-1">⚡ Must Do Today</h1>
        <p className="text-sm text-gray-500 mb-1">These HAVE to happen today. Keep it short.</p>
        <p className="text-xs text-gray-400 mb-4">
          {mustDoTasks.length}/{MUST_DO_CAP} slots used
          {atCap && <span className="ml-1 text-amber-600 font-semibold">· cap reached — swap one to add more</span>}
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a must-do task..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Cap nudge */}
      {capNudge && (
        <div className="mb-4 text-sm font-semibold text-amber-800 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>⚡</span>
          <span>You already have 3 must-dos today. Swap one out first!</span>
        </div>
      )}

      {/* Tip: pin from dump or day view */}
      {!atCap && (
        <div className="mb-4 text-xs text-gray-400 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          Tip: You can also pin any task from Brain Dump or Day View using the 📌 button.
        </div>
      )}

      {mustDoTasks.length === 0 && completedMustDo.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-sm">Nothing pinned yet. Add a task above or pin from the Dump.</p>
        </div>
      )}

      {mustDoTasks.length > 0 && (
        <div className="space-y-2 mb-6">
          {mustDoTasks.map(task => (
            <MustDoTaskRow
              key={task.id}
              task={task}
              onComplete={() => completeTask(task.id)}
              onUnpin={() => unpinFromMustDo(task.id)}
              onDelete={() => deleteTask(task.id)}
              onEdit={(title, minutes) => editTask(task.id, title, minutes, task.horizon)}
            />
          ))}
        </div>
      )}

      {completedMustDo.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Completed today ✓
          </p>
          <div className="space-y-1">
            {completedMustDo.map(t => (
              <div key={t.id} className="text-sm text-gray-400 line-through px-3 py-2 bg-white border border-gray-100 rounded-xl">
                {t.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MustDoTaskRow({
  task,
  onComplete,
  onUnpin,
  onDelete,
  onEdit,
}: {
  task: Task
  onComplete: () => void
  onUnpin: () => void
  onDelete: () => void
  onEdit: (title: string, minutes: number | null) => void
}) {
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
      <div className="bg-white border-2 border-rose-300 rounded-xl px-4 py-3 flex items-center gap-2">
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
        <button onClick={saveEdit} className="text-xs text-rose-600 font-medium px-2 py-1 hover:bg-rose-50 rounded-lg">Save</button>
        <button onClick={() => setEditing(false)} className="text-xs text-gray-400 px-2 py-1 hover:bg-gray-50 rounded-lg">Cancel</button>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-rose-100 rounded-2xl px-4 py-3 flex items-center gap-3 group shadow-sm hover:border-rose-300 hover:shadow-md transition-all">
      {/* Complete checkbox */}
      <button
        onClick={onComplete}
        className="w-5 h-5 rounded-full border-2 border-rose-400 hover:bg-rose-100 flex items-center justify-center shrink-0 transition-colors"
        title="Mark done"
      >
        <span className="text-[10px] text-rose-400 opacity-0 group-hover:opacity-100">✓</span>
      </button>

      <span
        className="flex-1 text-sm text-gray-900 cursor-pointer hover:text-rose-700"
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        {task.title}
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-gray-400 hover:text-gray-700 px-1.5 py-1 rounded-lg hover:bg-gray-100"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={onUnpin}
          className="text-xs text-gray-400 hover:text-amber-600 px-1.5 py-1 rounded-lg hover:bg-amber-50"
          title="Unpin from Must Do"
        >
          📌
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-1 rounded-lg hover:bg-red-50"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
