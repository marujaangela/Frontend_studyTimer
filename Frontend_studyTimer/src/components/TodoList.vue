// cSpell:ignore todos
<script setup lang="ts">
import { ref, computed } from 'vue'

// Interface für Todo-Items
interface Todo {
  id: number
  text: string
  completed: boolean
  completedAt?: Date
  editing?: boolean
}

// Definition der Events, die diese Komponente emittieren kann
const emit = defineEmits<{
  (e: 'archive-completed', todos: Array<{ text: string, completedAt: Date }>): void
}>()

// Reaktive Zustandsvariablen
const todos = ref<Todo[]>([])          // Liste aller Todos
const newTodo = ref('')                // Text für neues Todo
const showOpen = ref(true)             // Zeigt offene Todos an/aus
const showCompleted = ref(true)        // Zeigt erledigte Todos an/aus
const editText = ref('')               // Text während der Bearbeitung
const draggedTodo = ref<Todo | null>(null) // Aktuell gezogenes Todo

/*
 * Funktionen für Todo-Management
 */

// Fügt ein neues Todo hinzu
const addTodo = () => {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: Date.now(), // Eindeutige ID basierend auf dem aktuellen Zeitstempel
      text: newTodo.value.trim(),
      completed: false,
      editing: false
    })
    newTodo.value = '' // Eingabefeld leeren
  }
}

// Wechselt den completed-Status eines Todos
const toggleTodo = (id: number) => {
  const todo = todos.value.find(t => t.id === id)
  if (todo) {
    todo.completed = !todo.completed
    // Setzt/entfernt completedAt je nach Status
    if (todo.completed) {
      todo.completedAt = new Date()
    } else {
      delete todo.completedAt
    }
  }
}

// Entfernt ein Todo aus der Liste
const removeTodo = (id: number) => {
  todos.value = todos.value.filter(t => t.id !== id)
}

// Startet den Bearbeitungsmodus für ein Todo
const startEditing = (todo: Todo) => {
  todo.editing = true
  editText.value = todo.text // Speichert den aktuellen Text für die Bearbeitung
}

// Speichert die Bearbeitung eines Todos
const saveEdit = (todo: Todo) => {
  if (editText.value.trim()) {
    todo.text = editText.value.trim()
  }
  todo.editing = false
}

// Bricht die Bearbeitung ab
const cancelEdit = (todo: Todo) => {
  todo.editing = false
}

/*
 * Drag & Drop Funktionen
 */

// Wird beim Start des Ziehens aufgerufen
const handleDragStart = (todo: Todo) => {
  draggedTodo.value = todo
}

// Erlaubt das Ablegen von Elementen
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

// Wird beim Ablegen aufgerufen
const handleDrop = (targetCompleted: boolean) => {
  if (draggedTodo.value && draggedTodo.value.completed !== targetCompleted) {
    const todo = todos.value.find(t => t.id === draggedTodo.value!.id)
    if (todo) {
      todo.completed = targetCompleted
      if (targetCompleted) {
        todo.completedAt = new Date()
      } else {
        delete todo.completedAt
      }
    }
  }
  draggedTodo.value = null
}

/*
 * Archivierungsfunktionen
 */

// Archiviert alle erledigten Todos und löscht sie aus der aktuellen Liste
const archiveAndClearCompleted = () => {
  const completedTodos = todos.value.filter(t => t.completed)
  if (completedTodos.length > 0) {
    emit('archive-completed', completedTodos.map(todo => ({
      text: todo.text,
      completedAt: todo.completedAt!
    })))
    todos.value = todos.value.filter(t => !t.completed)
  }
}

/*
 * Berechnete Eigenschaften
 */

// Filtert alle offenen Todos
const openTodos = computed(() => todos.value.filter(t => !t.completed))

// Filtert alle erledigten Todos
const completedTodos = computed(() => todos.value.filter(t => t.completed))

// Formatiert ein Datum für die Anzeige
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('default', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}
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
              @change="toggleTodo(todo.id)"
              class="mr-3 h-4 w-4"
            >
            <!-- Anzeige oder Bearbeitung des Todo-Textes -->
            <div v-if="!todo.editing"
                 @click="startEditing(todo)"
                 class="flex-1 cursor-pointer">
              {{ todo.text }}
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
            @click="removeTodo(todo.id)"
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
              @change="toggleTodo(todo.id)"
              class="mr-3 h-4 w-4"
            >
            <!-- Anzeige oder Bearbeitung des Todo-Textes -->
            <div v-if="!todo.editing"
                 @click="startEditing(todo)"
                 class="flex-1 line-through text-gray-500 cursor-pointer">
              {{ todo.text }}
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
              @click="removeTodo(todo.id)"
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
