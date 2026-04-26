import { useState } from 'react'
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
import { getSlots, formatSlot, estimatedBucket } from '../lib/time'

const SLOTS = getSlots()

export function DayView() {
  const { tasks, selectedDate, scheduleTask, unscheduleTask, startFocus } = useStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

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
          {/* Busy day indicator — non-shaming per Doc's red line 1 */}
          {busyHours > 8 && (
            <div className="mx-4 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              Busy day — consider moving some tasks to another day
            </div>
          )}

          <div className="pb-6">
            {SLOTS.map(slot => (
              <TimeSlot
                key={slot}
                slot={slot}
                tasks={getTasksForSlot(slot)}
                onFocus={startFocus}
              />
            ))}
          </div>
        </div>

        {/* Right sidebar: unscheduled pile + done */}
        <div className="w-64 border-l border-gray-200 bg-gray-50 overflow-y-auto flex flex-col">
          <UnscheduledPile
            tasks={[...getUnscheduledForGrid(), ...unscheduledTasks]}
            onFocus={startFocus}
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
          <div className="bg-white border border-indigo-300 rounded-xl px-3 py-2 shadow-lg text-sm text-gray-900 max-w-xs opacity-90">
            {activeTask.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function TimeSlot({ slot, tasks, onFocus }: {
  slot: string
  tasks: Task[]
  onFocus: (id: string) => void
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
          <DraggableTaskChip key={task.id} task={task} onFocus={onFocus} />
        ))}
      </div>
    </div>
  )
}

function UnscheduledPile({ tasks, onFocus }: { tasks: Task[]; onFocus: (id: string) => void }) {
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
            <DraggableTaskChip key={task.id} task={task} onFocus={onFocus} sidebar />
          ))}
        </div>
      )}
    </div>
  )
}

function DraggableTaskChip({ task, onFocus, sidebar = false }: {
  task: Task
  onFocus: (id: string) => void
  sidebar?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-1 bg-white border border-gray-200 rounded-lg
        cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'opacity-40' : 'hover:border-indigo-300 hover:shadow-sm'}
        ${sidebar ? 'px-2 py-1.5 text-xs w-full' : 'px-2 py-1 text-xs'}
      `}
    >
      <span className="flex-1 truncate text-gray-800">{task.title}</span>
      <span className="text-gray-400 font-mono shrink-0">
        {estimatedBucket(task.estimatedMinutes)}
      </span>
      {!isDragging && (
        <button
          onClick={e => { e.stopPropagation(); onFocus(task.id) }}
          className="ml-1 text-indigo-500 hover:text-indigo-700 shrink-0"
          title="Start focus"
        >
          ▶
        </button>
      )}
    </div>
  )
}
