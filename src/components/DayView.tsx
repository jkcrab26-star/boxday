import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useStore } from '../store'
import type { Task } from '../types'
import { getSlots, getSectionLabel, formatSlot, estimatedBucket } from '../lib/time'

const MUST_DO_CAP = 3

export function DayView() {
  const { tasks, selectedDate, scheduleTask, unscheduleTask, startFocus, editTask, deleteTask, completeTask, pinToMustDo, unpinFromMustDo, settings, lastCompletedTaskId, focusSession } = useStore()
  const SLOTS = getSlots(settings.dayStartHour, 22)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [capNudge, setCapNudge] = useState(false)
  const [momentumTask, setMomentumTask] = useState<Task | null>(null)
  const [momentumCleared, setMomentumCleared] = useState(false)

  useEffect(() => {
    if (!lastCompletedTaskId) {
      setMomentumTask(null)
      setMomentumCleared(false)
      return
    }
    const remaining = tasks
      .filter(t => t.status === 'open' && t.scheduledDate === selectedDate)
      .sort((a, b) => {
        if (a.scheduledTime && b.scheduledTime) return a.scheduledTime.localeCompare(b.scheduledTime)
        if (a.scheduledTime) return -1
        if (b.scheduledTime) return 1
        return 0
      })
    if (remaining.length > 0) {
      setMomentumTask(remaining[0])
      setMomentumCleared(false)
    } else {
      setMomentumTask(null)
      setMomentumCleared(true)
    }
    const delay = remaining.length > 0 ? 4000 : 3000
    const timer = setTimeout(() => { setMomentumTask(null); setMomentumCleared(false) }, delay)
    return () => clearTimeout(timer)
  }, [lastCompletedTaskId])

  const openMustDoCount = tasks.filter(t => t.mustDoToday && t.status === 'open').length

  function handlePin(id: string, pinned: boolean) {
    if (pinned) {
      unpinFromMustDo(id)
    } else if (openMustDoCount >= MUST_DO_CAP) {
      setCapNudge(true)
      setTimeout(() => setCapNudge(false), 4000)
    } else {
      pinToMustDo(id)
    }
  }

  const scheduledTasks = tasks.filter(
    t => t.status === 'open' && t.scheduledDate === selectedDate
  )
  const unscheduledTasks = tasks.filter(
    t => t.status === 'open' && !t.scheduledDate
  )
  const doneTasks = tasks.filter(
    t => t.status === 'done' && t.scheduledDate === selectedDate
  )

  function getTasksForSlot(slot: string) {
    return scheduledTasks.filter(t => t.scheduledTime === slot)
  }
  function getUnscheduledForGrid() {
    return scheduledTasks.filter(t => !t.scheduledTime)
  }

  function onDragStart(e: DragStartEvent) {
    const task = tasks.find(t => t.id === e.active.id)
    setActiveTask(task ?? null)
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = e
    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string

    if (overId === 'unscheduled-pile') {
      unscheduleTask(taskId)
    } else if (overId.startsWith('slot:')) {
      const slot = overId.replace('slot:', '')
      scheduleTask(taskId, selectedDate, slot)
    } else if (overId === 'day-any') {
      scheduleTask(taskId, selectedDate, null)
    }
  }

  const busyHours = scheduledTasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 30), 0) / 60

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-0 h-[calc(100dvh-56px)] overflow-hidden">
        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          {/* Must-do cap nudge */}
          {capNudge && (
            <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border-2 border-amber-300 rounded-xl text-sm font-semibold text-amber-800 flex items-center gap-2">
              <span>⚡</span>
              <span>You already have 3 must-dos today. Swap one out first!</span>
            </div>
          )}

          {/* Busy day indicator */}
          {busyHours > 8 && (
            <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Busy day — consider moving some tasks to another day
            </div>
          )}

          <div className="pb-6">
            {SLOTS.map(slot => {
              const sectionLabel = getSectionLabel(slot, settings.afternoonStartHour, settings.eveningStartHour, settings.dayStartHour)
              return (
                <div key={slot}>
                  {sectionLabel && (
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{sectionLabel}</span>
                    </div>
                  )}
                  <TimeSlot
                    slot={slot}
                    tasks={getTasksForSlot(slot)}
                    onFocus={startFocus}
                    onComplete={completeTask}
                    onEdit={(id) => setEditingId(id)}
                    onDelete={deleteTask}
                    onPin={(id, pinned) => handlePin(id, pinned)}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Right sidebar: unscheduled pile + done */}
        <div className="w-40 sm:w-56 md:w-64 border-l border-gray-200 bg-gray-50 overflow-y-auto flex flex-col">
          <UnscheduledPile
            tasks={[...getUnscheduledForGrid(), ...unscheduledTasks]}
            onFocus={startFocus}
            onComplete={completeTask}
            onEdit={(id) => setEditingId(id)}
            onDelete={deleteTask}
            onPin={(id, pinned) => handlePin(id, pinned)}
          />

          {doneTasks.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Done today ✓
              </p>
              <div className="space-y-1">
                {doneTasks.map(t => (
                  <div key={t.id} className="text-xs text-gray-400 line-through px-2 py-1">
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="bg-white border border-violet-300 rounded-xl px-3 py-2 shadow-lg text-sm text-gray-900 max-w-xs opacity-90">
            {activeTask.title}
          </div>
        )}
      </DragOverlay>

      {/* Momentum banner */}
      {!focusSession && (momentumTask || momentumCleared) && (
        <div className="fixed bottom-14 inset-x-0 flex justify-center px-4 z-40 pointer-events-none">
          <div className="bg-gray-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl pointer-events-auto max-w-sm w-full">
            <span className="text-green-400 shrink-0">✓</span>
            <div className="flex-1 min-w-0 text-sm">
              {momentumTask
                ? <><span className="text-gray-300">Next up: </span><span className="font-semibold truncate">{momentumTask.title}</span></>
                : <span>You cleared your schedule!</span>
              }
            </div>
            {momentumTask && (
              <button
                onClick={() => { startFocus(momentumTask.id); setMomentumTask(null) }}
                className="shrink-0 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Start ▶
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <EditModal
          task={tasks.find(t => t.id === editingId)!}
          onSave={(title, minutes) => {
            const task = tasks.find(t => t.id === editingId)
            if (task) editTask(editingId, title, minutes, task.horizon)
            setEditingId(null)
          }}
          onClose={() => setEditingId(null)}
        />
      )}
    </DndContext>
  )
}

function EditModal({ task, onSave, onClose }: {
  task: Task
  onSave: (title: string, minutes: number | null) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [minutes, setMinutes] = useState<string>(String(task.estimatedMinutes ?? 30))
  const BUCKETS = [15, 25, 30, 45, 60, 90]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Edit Task</h3>
        <input
          autoFocus
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(title, Number(minutes) || null) }}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 mb-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <p className="text-xs text-gray-500 mb-2">Duration</p>
        <div className="flex gap-1 flex-wrap mb-4">
          {BUCKETS.map(b => (
            <button
              key={b}
              onClick={() => setMinutes(String(b))}
              className={`px-2 py-1 text-xs rounded-lg font-mono ${
                Number(minutes) === b ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {b < 60 ? `${b}m` : `${b / 60}h`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(title, Number(minutes) || null)}
            disabled={!title.trim()}
            className="flex-1 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-xl text-sm font-medium disabled:opacity-40"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function TimeSlot({ slot, tasks, onFocus, onComplete, onEdit, onDelete, onPin }: {
  slot: string
  tasks: Task[]
  onFocus: (id: string) => void
  onComplete: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onPin: (id: string, currentlyPinned: boolean) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${slot}` })
  const isHalfHour = slot.endsWith(':30')

  return (
    <div
      ref={setNodeRef}
      className={`flex gap-2 px-3 border-b min-h-[3rem] ${
        isOver ? 'slot-active' : isHalfHour ? 'border-gray-100' : 'border-gray-200'
      }`}
    >
      <div className="w-12 shrink-0 pt-2">
        {!isHalfHour && (
          <span className="text-xs text-gray-400 font-mono">{formatSlot(slot)}</span>
        )}
      </div>
      <div className="flex-1 flex flex-wrap gap-1 py-1">
        {tasks.map(task => (
          <DraggableTaskChip
            key={task.id}
            task={task}
            onFocus={onFocus}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
          />
        ))}
      </div>
    </div>
  )
}

function UnscheduledPile({ tasks, onFocus, onComplete, onEdit, onDelete, onPin }: {
  tasks: Task[]
  onFocus: (id: string) => void
  onComplete: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onPin: (id: string, currentlyPinned: boolean) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unscheduled-pile' })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-3 min-h-[200px] ${isOver ? 'slot-active rounded-lg' : ''}`}
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        To schedule ({tasks.length})
      </p>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray-300 text-center mt-8">Drop tasks here to unschedule</p>
      ) : (
        <div className="space-y-1">
          {tasks.map(task => (
            <DraggableTaskChip
              key={task.id}
              task={task}
              onFocus={onFocus}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
              sidebar
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DraggableTaskChip({ task, onFocus, onComplete, onEdit, onDelete, onPin, sidebar = false }: {
  task: Task
  onFocus: (id: string) => void
  onComplete: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onPin: (id: string, currentlyPinned: boolean) => void
  sidebar?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })
  const [showActions, setShowActions] = useState(false)

  return (
    <div
      ref={setNodeRef}
      className={`
        group relative flex items-center gap-1 bg-white border rounded-lg
        select-none
        ${task.mustDoToday ? 'border-rose-300' : 'border-gray-200'}
        ${isDragging ? 'opacity-40' : 'hover:border-violet-300 hover:shadow-sm'}
        ${sidebar ? 'px-2 py-1.5 text-xs w-full' : 'px-2 py-1 text-xs'}
      `}
    >
      {/* Drag handle area */}
      <span
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing flex-1 flex items-center gap-1 min-w-0"
      >
        {task.mustDoToday && <span className="text-rose-400 shrink-0" title="Must Do Today">📌</span>}
        <span className="flex-1 truncate text-gray-800">{task.title}</span>
        <span className="text-gray-400 font-mono shrink-0">
          {estimatedBucket(task.estimatedMinutes)}
        </span>
      </span>

      {!isDragging && (
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Complete */}
          <button
            onClick={e => { e.stopPropagation(); onComplete(task.id) }}
            className="text-green-500 hover:text-green-700 px-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Mark done"
          >
            ✓
          </button>
          {/* Focus */}
          <button
            onClick={e => { e.stopPropagation(); onFocus(task.id) }}
            className="text-violet-500 hover:text-violet-700 shrink-0"
            title="Start focus"
          >
            ▶
          </button>
          {/* More actions */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); setShowActions(s => !s) }}
              className="text-gray-400 hover:text-gray-700 px-0.5"
              title="More"
            >
              ···
            </button>
            {showActions && (
              <div className="absolute right-0 top-6 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={() => { onEdit(task.id); setShowActions(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => { onPin(task.id, task.mustDoToday); setShowActions(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-rose-50"
                >
                  📌 {task.mustDoToday ? 'Unpin Must Do' : 'Must Do Today'}
                </button>
                <button
                  onClick={() => { onDelete(task.id); setShowActions(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
