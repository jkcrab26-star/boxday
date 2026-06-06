import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import type { Task, TaskList } from '../types'
import { estimatedBucket } from '../lib/time'

const BUCKETS = [15, 30, 60, 90] as const
const MUST_DO_CAP = 3

export function BrainDump() {
  const [input, setInput] = useState('')
  const [capNudge, setCapNudge] = useState(false)
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { tasks, addTask, editTask, deleteTask, setTaskEstimate, scheduleTask, setView, selectedDate, pinToMustDo, unpinFromMustDo, taskLists, addTaskList, deleteTaskList, renameTaskList, addListItem, toggleListItem, deleteListItem, scheduleTaskList } = useStore()

  const dumpTasks = tasks.filter(t => t.status === 'open' && !t.scheduledDate)
  const openMustDoCount = tasks.filter(t => t.mustDoToday && t.status === 'open').length

  function handlePin(task: Task) {
    if (task.mustDoToday) {
      unpinFromMustDo(task.id)
    } else if (openMustDoCount >= MUST_DO_CAP) {
      setCapNudge(true)
      setTimeout(() => setCapNudge(false), 4000)
    } else {
      pinToMustDo(task.id)
    }
  }

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

  function handleCreateList() {
    if (!newListName.trim()) return
    addTaskList(newListName.trim())
    setNewListName('')
    setShowNewList(false)
  }

  const dumpLists = taskLists.filter(l => !l.scheduledDate)

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
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none text-base leading-relaxed"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">Press Enter to add · Shift+Enter for new line</p>
          <button
            onClick={() => setShowNewList(s => !s)}
            className="text-xs text-violet-600 font-medium hover:text-violet-800 flex items-center gap-1"
          >
            + New list
          </button>
        </div>
      </div>

      {showNewList && (
        <div className="mb-4 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
          <input
            autoFocus
            type="text"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateList()
              if (e.key === 'Escape') { setShowNewList(false); setNewListName('') }
            }}
            placeholder="List name (e.g. Costco)"
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400"
          />
          <button onClick={handleCreateList} className="text-xs text-violet-600 font-semibold px-2 py-1 hover:bg-violet-100 rounded-lg">Create</button>
          <button onClick={() => { setShowNewList(false); setNewListName('') }} className="text-xs text-gray-400 px-2 py-1 hover:bg-gray-100 rounded-lg">Cancel</button>
        </div>
      )}

      {capNudge && (
        <div className="mb-4 text-sm font-semibold text-amber-800 bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>⚡</span>
          <span>You already have 3 must-dos today. Swap one out first!</span>
        </div>
      )}

      {dumpTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Captured ({dumpTasks.length})
            </h2>
            <button
              onClick={() => setView('day')}
              className="text-sm text-violet-600 font-medium hover:text-violet-800"
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
                onPin={() => handlePin(task)}
              />
            ))}
          </div>
        </div>
      )}

      {dumpLists.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Lists ({dumpLists.length})
          </h2>
          <div className="space-y-3">
            {dumpLists.map(list => (
              <TaskListCard
                key={list.id}
                list={list}
                onAddItem={(title) => addListItem(list.id, title)}
                onToggleItem={(itemId) => toggleListItem(list.id, itemId)}
                onDeleteItem={(itemId) => deleteListItem(list.id, itemId)}
                onRename={(name) => renameTaskList(list.id, name)}
                onDelete={() => deleteTaskList(list.id)}
                onBoxToday={() => { scheduleTaskList(list.id, selectedDate); setView('day') }}
              />
            ))}
          </div>
        </div>
      )}

      {dumpTasks.length === 0 && dumpLists.length === 0 && (
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
      <div className="bg-white border-2 border-violet-300 rounded-xl px-4 py-3 flex items-center gap-2">
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
        <button onClick={saveEdit} className="text-xs text-violet-600 font-medium px-2 py-1 hover:bg-violet-50 rounded-lg">Save</button>
        <button onClick={() => setEditing(false)} className="text-xs text-gray-400 px-2 py-1 hover:bg-gray-50 rounded-lg">Cancel</button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2 group shadow-sm hover:shadow-md hover:border-violet-200 transition-all">
      <div className="flex-1 min-w-0">
        <p
          className="text-gray-900 text-sm truncate cursor-pointer hover:text-violet-700"
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
                className="text-xs px-2 py-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-700 font-mono text-gray-700"
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
        className="text-xs text-violet-600 font-medium bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0"
      >
        Box today
      </button>
    </div>
  )
}

function TaskListCard({
  list,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onRename,
  onDelete,
  onBoxToday,
}: {
  list: TaskList
  onAddItem: (title: string) => void
  onToggleItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onRename: (name: string) => void
  onDelete: () => void
  onBoxToday: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [newItem, setNewItem] = useState('')
  const [renamingName, setRenamingName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const doneCount = list.items.filter(i => i.done).length
  const total = list.items.length

  function handleAddItem() {
    if (!newItem.trim()) return
    onAddItem(newItem.trim())
    setNewItem('')
  }

  function saveRename() {
    if (renamingName.trim()) onRename(renamingName.trim())
    setRenaming(false)
  }

  return (
    <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setExpanded(s => !s)}
          className="text-gray-400 hover:text-gray-600 text-xs shrink-0 w-4"
        >
          {expanded ? '▼' : '▶'}
        </button>

        {renaming ? (
          <input
            autoFocus
            type="text"
            value={renamingName}
            onChange={e => setRenamingName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(false) }}
            onBlur={saveRename}
            className="flex-1 text-sm font-semibold text-gray-800 bg-transparent outline-none border-b border-violet-300"
          />
        ) : (
          <button
            onClick={() => { setRenamingName(list.name); setRenaming(true) }}
            className="flex-1 text-sm font-semibold text-gray-800 text-left hover:text-violet-700"
          >
            🛒 {list.name}
          </button>
        )}

        {total > 0 && (
          <span className="text-xs text-gray-400 font-mono shrink-0">{doneCount}/{total}</span>
        )}

        <button
          onClick={onDelete}
          className="text-xs text-gray-300 hover:text-red-500 px-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          title="Delete list"
        >
          🗑️
        </button>

        <button
          onClick={onBoxToday}
          className="text-xs text-violet-600 font-medium bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0"
        >
          Box today
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-violet-400 transition-all"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>
      )}

      {/* Items */}
      {expanded && (
        <div className="px-4 py-2">
          <div className="space-y-1 mb-2">
            {list.items.map(item => (
              <div key={item.id} className="group flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggleItem(item.id)}
                  className="w-3.5 h-3.5 accent-violet-500 shrink-0 cursor-pointer"
                />
                <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.title}
                </span>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem() }}
              placeholder="Add item..."
              className="flex-1 text-xs text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-400"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItem.trim()}
              className="text-xs text-violet-600 font-medium px-2 py-1.5 hover:bg-violet-50 rounded-lg disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
