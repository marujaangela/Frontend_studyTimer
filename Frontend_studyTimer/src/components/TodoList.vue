// cSpell:ignore todos
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

/**
 * Repräsentiert ein einzelnes Todo-Objekt
 */
interface Todo {
  id?: number
  taskDescription: string
  completed: boolean
  completedAt?: Date
  editing?: boolean
}

const emit = defineEmits<{
  (e: 'archive-completed', todos: Array<{ text: string, completedAt: Date }>): void
}>()

const todos = ref<Todo[]>([])
const newTodo = ref('')
const editText = ref('')
const showOpen = ref(true)
const showCompleted = ref(true)
const draggedTodo = ref<Todo | null>(null)

/**
 * Lädt alle Todos vom Backend und speichert sie lokal
 */
const fetchTodos = async () => {
  try {
    const response = await fetch('https://backend-studytimer.onrender.com/api/todos')
    const data = await response.json()
    todos.value = data.map((t: any) => ({
      ...t,
      completedAt: t.completed ? new Date() : undefined
    }))
  } catch (err) {
    console.error('Fehler beim Laden der Todos:', err)
  }
}

/**
 * Erstellt ein neues Todo und speichert es im Backend
 */
const addTodo = async () => {
  if (newTodo.value.trim()) {
    const todoToSend = {
      taskDescription: newTodo.value.trim(),
      completed: false
    }

    try {
      const response = await fetch('https://backend-studytimer.onrender.com/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoToSend)
      })
      const savedTodo = await response.json()
      todos.value.push(savedTodo)
      newTodo.value = ''
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
    }
  }
}

/**
 * Wechselt den Status eines Todos (offen ⇄ erledigt) und speichert ihn
 * @param todo - Das Todo, das aktualisiert werden soll
 */
const toggleTodo = async (todo: Todo) => {
  todo.completed = !todo.completed
  todo.completedAt = todo.completed ? new Date() : undefined

  if (todo.id) {
    await fetch(`https://backend-studytimer.onrender.com/api/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo)
    })
  }
}

/**
 * Löscht ein Todo aus Backend und lokaler Liste
 * @param todo - Das zu löschende Todo
 */
const removeTodo = async (todo: Todo) => {
  if (!todo.id) return
  try {
    await fetch(`https://backend-studytimer.onrender.com/api/todos/${todo.id}`, {
      method: 'DELETE'
    })
    todos.value = todos.value.filter(t => t.id !== todo.id)
  } catch (err) {
    console.error('Fehler beim Löschen:', err)
  }
}

/**
 * Aktiviert den Bearbeitungsmodus für ein Todo
 * @param todo - Das zu bearbeitende Todo
 */
const startEditing = (todo: Todo) => {
  todo.editing = true
  editText.value = todo.taskDescription
}

/**
 * Speichert die geänderte Beschreibung eines Todos
 * @param todo - Das zu aktualisierende Todo
 */
const saveEdit = async (todo: Todo) => {
  if (editText.value.trim()) {
    todo.taskDescription = editText.value.trim()
    todo.editing = false

    if (todo.id) {
      await fetch(`https://backend-studytimer.onrender.com/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
      })
    }
  }
}

/**
 * Bricht die Bearbeitung ab
 * @param todo - Das Todo, dessen Bearbeitung abgebrochen wird
 */
const cancelEdit = (todo: Todo) => {
  todo.editing = false
}

/**
 * Archiviert alle erledigten Todos und entfernt sie aus der Liste
 */
const archiveAndClearCompleted = () => {
  const completed = todos.value.filter(t => t.completed)
  if (completed.length > 0) {
    emit('archive-completed', completed.map(t => ({ text: t.taskDescription, completedAt: t.completedAt! })))
    todos.value = todos.value.filter(t => !t.completed)
  }
}

/**
 * Setzt das aktuell gezogene Todo für Drag & Drop
 * @param todo - Das gezogene Todo
 */
const handleDragStart = (todo: Todo) => {
  draggedTodo.value = todo
}

/**
 * Lässt ein Todo in einen Zielbereich fallen (offen oder erledigt)
 * @param targetCompleted - Zielstatus des Todos
 */
const handleDrop = async (targetCompleted: boolean) => {
  if (!draggedTodo.value || draggedTodo.value.completed === targetCompleted) return
  draggedTodo.value.completed = targetCompleted
  draggedTodo.value.completedAt = targetCompleted ? new Date() : undefined
  await toggleTodo(draggedTodo.value)
  draggedTodo.value = null
}

/**
 * Erlaubt das Drop-Verhalten im Zielbereich
 * @param e - DragEvent
 */
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

/**
 * Formatiert ein Datum für die Anzeige
 * @param date - Das zu formatierende Datum
 * @returns Formatiertes Datum als String
 */
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const openTodos = computed(() => todos.value.filter(t => !t.completed))
const completedTodos = computed(() => todos.value.filter(t => t.completed))

onMounted(fetchTodos)

</script>

<template>
  <div class="max-w-md mx-auto">
    <!-- Titel der Todo-Liste -->
    <h2 class="text-2xl font-bold mb-4">Todo List</h2>

    <!-- Eingabe für neue Todos -->
    <div class="flex mb-6">
      <input
        v-model="newTodo"
        @keyup.enter="addTodo"
        type="text"
        placeholder="Add a new task..."
        class="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:border-blue-500"
      >
      <button
        @click="addTodo"
        class="px-6 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600"
      >
        Add
      </button>
    </div>

    <!-- Offene Todos -->
    <div class="mb-6 bg-white rounded-lg shadow-sm overflow-hidden"
         @dragover="handleDragOver"
         @drop="handleDrop(false)">
      <!-- Header für offene Todos mit Toggle-Funktion -->
      <button
        @click="showOpen = !showOpen"
        class="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50"
      >
        <!-- Ersetzt h3 durch span mit semibold class -->
        <span class="text-lg font-semibold">Open ({{ openTodos.length }})</span>
        <span class="transform transition-transform" :class="{ 'rotate-180': showOpen }">
          ▼
        </span>
      </button>

      <!-- Liste der offenen Todos -->
      <div v-show="showOpen" class="divide-y">
        <div v-for="todo in openTodos" :key="todo.id"
             class="flex items-center justify-between p-4 hover:bg-gray-50"
             draggable="true"
             @dragstart="handleDragStart(todo)">
          <div class="flex items-center flex-1">
            <input
              type="checkbox"
              :checked="todo.completed"
              @change="toggleTodo(todo)"
              class="mr-3 h-4 w-4"
            />

            <div v-if="!todo.editing"
                 @click="startEditing(todo)"
                 class="flex-1 cursor-pointer">
              {{ todo.taskDescription }}
            </div>

            <div v-else class="flex-1 flex space-x-2">
              <input
                v-model="editText"
                @keyup.enter="saveEdit(todo)"
                @keyup.esc="cancelEdit(todo)"
                type="text"
                class="flex-1 px-2 py-1 border rounded"
                ref="editInput"
                @blur="saveEdit(todo)"
              >
              <button @click="saveEdit(todo)"
                      class="text-green-500 hover:text-green-700">✓</button>
              <button @click="cancelEdit(todo)"
                      class="text-gray-500 hover:text-gray-700">✕</button>
            </div>
          </div>
          <button
            @click="removeTodo(todo)"
            class="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- Erledigte Todos -->
    <div class="bg-white rounded-lg shadow-sm overflow-hidden"
         @dragover="handleDragOver"
         @drop="handleDrop(true)">
      <div class="px-4 py-3 flex justify-between items-center">
        <!-- Header für erledigte Todos mit Toggle-Funktion -->
        <button
          @click="showCompleted = !showCompleted"
          class="flex-1 flex justify-between items-center hover:bg-gray-50"
        >
          <!-- Ersetzt h3 durch span mit semibold class -->
          <span class="text-lg font-semibold">Completed ({{ completedTodos.length }})</span>
          <span class="transform transition-transform" :class="{ 'rotate-180': showCompleted }">
            ▼
          </span>
        </button>
        <!-- Archivieren-Button (nur sichtbar wenn erledigte Todos vorhanden) -->
        <button
          v-if="completedTodos.length > 0"
          @click="archiveAndClearCompleted"
          class="ml-4 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Archive
        </button>
      </div>

      <!-- Liste der erledigten Todos -->
      <div v-show="showCompleted" class="divide-y">
        <div v-for="todo in completedTodos" :key="todo.id"
             class="flex items-center justify-between p-4 hover:bg-gray-50"
             draggable="true"
             @dragstart="handleDragStart(todo)">
          <div class="flex items-center flex-1">
            <input
              type="checkbox"
              :checked="todo.completed"
              @change="toggleTodo(todo)"
              class="mr-3 h-4 w-4"
            >
            <!-- Anzeige oder Bearbeitung des Todo-Textes -->
            <div v-if="!todo.editing"
                 @click="startEditing(todo)"
                 class="flex-1 line-through text-gray-500 cursor-pointer">
              {{ todo.taskDescription }}
            </div>
            <div v-else class="flex-1 flex space-x-2">
              <input
                v-model="editText"
                @keyup.enter="saveEdit(todo)"
                @keyup.esc="cancelEdit(todo)"
                type="text"
                class="flex-1 px-2 py-1 border rounded"
                ref="editInput"
                @blur="saveEdit(todo)"
              >
              <button @click="saveEdit(todo)"
                      class="text-green-500 hover:text-green-700">✓</button>
              <button @click="cancelEdit(todo)"
                      class="text-gray-500 hover:text-gray-700">✕</button>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <!-- Anzeige des Fertigstellungsdatums -->
            <span class="text-sm text-gray-500">{{ formatDate(todo.completedAt!) }}</span>
            <button
              @click="removeTodo(todo)"
              class="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
