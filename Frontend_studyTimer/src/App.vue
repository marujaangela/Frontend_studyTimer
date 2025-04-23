<script setup lang="ts">
// Importe der benötigten Vue-Funktionen und Komponenten
import Timer from './components/Timer.vue'
import TodoList from './components/TodoList.vue'
import { ref, onMounted, computed } from 'vue'

/*
 * TYPENDEFINITIONEN
 * Hier definieren wir Interfaces für unsere Datenstrukturen
 * Das gibt TypeScript mehr Informationen und hilft bei der Fehlererkennung
 */
interface Background {
  type: 'color' | 'image'  // Kann entweder 'color' oder 'image' sein
  value: string           // CSS-Klasse oder Bild-URL
  label: string           // Anzeigename für den Hintergrund
  lightText?: boolean     // Optional: Soll Text hell dargestellt werden?
}

interface TodoItem {
  text: string           // Text der Todo-Aufgabe
  completedAt: Date      // Fertigstellungsdatum
}

interface Settings {
  breakDuration: number     // Dauer der Pause in Minuten
  exerciseInterval: number  // Interval für Übungserinnerungen
  breakMessage: string      // Nachricht bei Pausenbeginn
  exerciseMessage: string   // Nachricht für Übungserinnerung
}

/*
 * HINTERGRUNDAUSWAHL
 * Verschiedene Hintergrundoptionen für die App
 */
const backgrounds: Background[] = [
  // Farbhintergründe
  { type: 'color', value: 'bg-rose-50', label: 'Soft Pink' },
  { type: 'color', value: 'bg-sky-50', label: 'Soft Blue' },
  { type: 'color', value: 'bg-violet-50', label: 'Soft Purple' },
  { type: 'color', value: 'bg-emerald-50', label: 'Soft Green' },
  { type: 'color', value: 'bg-amber-50', label: 'Soft Yellow' },
  // Bildhintergründe
  { type: 'image', value: 'https://images.unsplash.com/photo-1616628188859-7a11abb6fcc9?auto=format&fit=crop&q=80', label: 'Study Desk', lightText: true },
  { type: 'image', value: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80', label: 'Study Notes', lightText: true },
  { type: 'image', value: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80', label: 'Library', lightText: true },
  { type: 'image', value: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80', label: 'Cafe' },
  { type: 'image', value: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80', label: 'Forest', lightText: true },
]

/*
 * REAKTIVE ZUSTÄNDE
 * Hier definieren wir alle Variablen, die sich ändern können und die UI aktualisieren
 */
const showBackgroundSelector = ref(false)    // Steuert die Anzeige des Hintergrundauswahl-Dialogs
const showSettingsModal = ref(false)        // Steuert die Anzeige des Einstellungs-Dialogs
const showCalendarModal = ref(false)        // Steuert die Anzeige des Kalender-Dialogs
const selectedBackground = ref(backgrounds[0].value)  // Aktuell ausgewählter Hintergrund

// Berechneter Wert: Gibt das aktuell ausgewählte Background-Objekt zurück
const currentBackground = computed(() =>
  backgrounds.find(bg => bg.value === selectedBackground.value)
)

/*
 * STANDARDEINSTELLUNGEN
 * Diese werden beim ersten Start der App verwendet
 */
const defaultSettings: Settings = {
  breakDuration: 5,             // 5 Minuten Pausendauer
  exerciseInterval: 50,         // Alle 50 Minuten Übungserinnerung
  breakMessage: "Time's up! Take a break.",          // Standard-Pausennachricht
  exerciseMessage: "Time for a quick exercise break!" // Standard-Übungsnachricht
}

// Temporäre Einstellungen (während der Bearbeitung im Dialog)
const tempSettings = ref<Settings>({ ...defaultSettings })

// Aktive Einstellungen (die tatsächlich verwendet werden)
const settings = ref<Settings>({ ...defaultSettings })

/*
 * ARCHIVIERTE TODOS
 * Hier werden abgeschlossene Aufgaben nach Datum gruppiert gespeichert
 */
const archivedTodos = ref<Record<string, TodoItem[]>>({})

/*
 * LIFECYCLE HOOK
 * Wird ausgeführt, wenn die Komponente im DOM eingebunden ist
 */
onMounted(() => {
  // Versuche gespeicherte Einstellungen aus dem localStorage zu laden
  const savedBackground = localStorage.getItem('selectedBackground')
  const savedSettings = localStorage.getItem('settings')
  const savedArchive = localStorage.getItem('archivedTodos')

  if (savedBackground) {
    selectedBackground.value = savedBackground
  }

  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      settings.value = {
        breakDuration: Number(parsed.breakDuration) || defaultSettings.breakDuration,
        exerciseInterval: Number(parsed.exerciseInterval) || defaultSettings.exerciseInterval,
        breakMessage: parsed.breakMessage || defaultSettings.breakMessage,
        exerciseMessage: parsed.exerciseMessage || defaultSettings.exerciseMessage
      }
      tempSettings.value = { ...settings.value }
    } catch (e) {
      console.error('Fehler beim Laden der Einstellungen:', e)
    }
  }

  if (savedArchive) {
    try {
      // Custom Reviver für das Datum-Objekt
      archivedTodos.value = JSON.parse(savedArchive, (key, value) => {
        if (key === 'completedAt') return new Date(value)
        return value
      })
    } catch (e) {
      console.error('Fehler beim Laden des Archivs:', e)
    }
  }
})

/*
 * FUNKTIONEN
 */

// Aktualisiert den Hintergrund und speichert ihn im localStorage
const updateBackground = (bg: string) => {
  selectedBackground.value = bg
  localStorage.setItem('selectedBackground', bg)
  showBackgroundSelector.value = false
}

// Validiert die Einstellungen vor dem Speichern
const validateSettings = (): boolean => {
  return (
    tempSettings.value.breakDuration > 0 &&
    tempSettings.value.exerciseInterval > 0 &&
    tempSettings.value.breakMessage.trim() !== '' &&
    tempSettings.value.exerciseMessage.trim() !== ''
  )
}

// Speichert die Einstellungen und schließt den Dialog
const saveSettings = () => {
  if (!validateSettings()) {
    alert('Bitte füllen Sie alle Felder korrekt aus.')
    return
  }

  settings.value = {
    breakDuration: Number(tempSettings.value.breakDuration),
    exerciseInterval: Number(tempSettings.value.exerciseInterval),
    breakMessage: tempSettings.value.breakMessage.trim(),
    exerciseMessage: tempSettings.value.exerciseMessage.trim()
  }

  localStorage.setItem('settings', JSON.stringify(settings.value))
  showSettingsModal.value = false
}

// Öffnet den Einstellungsdialog mit den aktuellen Werten
const openSettings = () => {
  tempSettings.value = { ...settings.value }
  showSettingsModal.value = true
}

// Fügt abgeschlossene Todos zum Archiv hinzu
const archiveCompletedTodos = (todos: TodoItem[]) => {
  const today = new Date().toISOString().split('T')[0] // Heutiges Datum als YYYY-MM-DD

  if (!archivedTodos.value[today]) {
    archivedTodos.value[today] = []
  }

  archivedTodos.value[today].push(...todos)
  localStorage.setItem('archivedTodos', JSON.stringify(archivedTodos.value))
}

// Entfernt ein Todo aus dem Archiv
const removeArchivedTodo = (date: string, index: number) => {
  archivedTodos.value[date].splice(index, 1)

  // Wenn keine Todos mehr für dieses Datum vorhanden sind, entferne das Datum
  if (archivedTodos.value[date].length === 0) {
    delete archivedTodos.value[date]
  }

  localStorage.setItem('archivedTodos', JSON.stringify(archivedTodos.value))
}

// Formatiert ein Datum in ein lesbares Format
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <!--
    HAUPTCONTAINER
    - Beinhaltet den gesamten Inhalt der App
    - Dynamische Klassen und Styles für den Hintergrund
  -->
  <div class="min-h-screen transition-all duration-300"
       :class="{ [selectedBackground]: selectedBackground.startsWith('bg-') }"
       :style="{
         backgroundImage: !selectedBackground.startsWith('bg-') ? `url(${selectedBackground})` : 'none',
         backgroundSize: 'cover',
         backgroundPosition: 'center',
         backgroundAttachment: 'fixed'
       }">

    <!-- Container für den Hauptinhalt mit max-width und Padding -->
    <div class="container mx-auto py-4">

      <!--
        HEADER-BEREICH
        - Beinhaltet Logo und Steuerungselemente
        - Flex-Layout für horizontale Anordnung
      -->
      <div class="flex justify-between items-center px-4 mb-8">
        <!-- Logo und App-Name -->
        <div class="flex items-center space-x-2">
          <span class="text-2xl">⏰</span>
          <h1 class="text-2xl font-bold" :class="{ 'text-white': currentBackground?.lightText }">
            StudyTimer
          </h1>
        </div>

        <!-- Steuerungselemente (Buttons) -->
        <div class="flex items-center space-x-4">
          <!-- Kalender-Button -->
          <button
            @click="showCalendarModal = true"
            class="p-2 rounded-full hover:bg-white/20 transition-colors"
            :class="{ 'text-white': currentBackground?.lightText }"
            title="Aufgabenarchiv öffnen"
          >
            📅
          </button>

          <!-- Einstellungs-Button -->
          <button
            @click="openSettings"
            class="p-2 rounded-full hover:bg-white/20 transition-colors"
            :class="{ 'text-white': currentBackground?.lightText }"
            title="Einstellungen öffnen"
          >
            ⚙️
          </button>

          <!-- Hintergrundauswahl-Button -->
          <button
            @click="showBackgroundSelector = !showBackgroundSelector"
            class="p-2 rounded-full hover:bg-white/20 transition-colors"
            :class="{ 'text-white': currentBackground?.lightText }"
            title="Hintergrund ändern"
          >
            🎨
          </button>
        </div>
      </div> <!-- Ende Header -->

      <!--
        HAUPTINHALT
        - 2-spaltiges Layout auf größeren Bildschirmen
        - Beinhaltet Timer und Todo-Liste
      -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        <!-- Timer-Komponente mit leicht transparentem Hintergrund -->
        <div class="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <Timer :settings="settings" />
        </div>

        <!-- TodoList-Komponente mit gleichem Stil wie Timer -->
        <div class="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <TodoList @archive-completed="archiveCompletedTodos" />
        </div>
      </div>
    </div> <!-- Ende Hauptcontainer -->

    <!--
      KALENDER-MODAL
      - Wird nur angezeigt, wenn showCalendarModal true ist
      - Fixed Positionierung über dem restlichen Inhalt
    -->
    <div v-if="showCalendarModal"
         class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
         @click.self="showCalendarModal = false">
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <!-- Modal-Header mit Titel und Schließen-Button -->
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold">Aufgabenarchiv</h3>
          <button @click="showCalendarModal = false" class="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <!-- Archiv-Inhalt -->
        <div class="space-y-6">
          <!-- Schleife durch alle archivierten Todos, gruppiert nach Datum -->
          <div v-for="(todos, date) in archivedTodos" :key="date" class="border rounded-lg p-4">
            <!-- Datumsüberschrift -->
            <h4 class="font-semibold mb-3">{{ formatDate(date) }}</h4>

            <!-- Liste der Todos für dieses Datum -->
            <ul class="space-y-2">
              <li v-for="(todo, index) in todos" :key="index"
                  class="flex justify-between items-center bg-gray-50 p-2 rounded">
                <!-- Todo-Text -->
                <span>{{ todo.text }}</span>

                <!-- Todo-Metadaten und Löschen-Button -->
                <div class="flex items-center space-x-3">
                  <!-- Fertigstellungszeit -->
                  <span class="text-sm text-gray-500">
                    {{ new Date(todo.completedAt).toLocaleTimeString() }}
                  </span>

                  <!-- Löschen-Button -->
                  <button
                    @click="removeArchivedTodo(date, index)"
                    class="text-red-500 hover:text-red-700"
                    title="Aufgabe löschen"
                  >
                    ×
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Platzhalter, wenn keine archivierten Todos vorhanden sind -->
          <div v-if="Object.keys(archivedTodos).length === 0"
               class="text-center text-gray-500 py-8">
            Noch keine archivierten Aufgaben
          </div>
        </div>
      </div>
    </div>

    <!--
      EINSTELLUNGS-MODAL
      - Ähnliche Struktur wie Kalender-Modal
      - Beinhaltet Formularfelder für die Einstellungen
    -->
    <div v-if="showSettingsModal"
         class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
         @click.self="showSettingsModal = false">
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold">Einstellungen</h3>
          <button @click="showSettingsModal = false" class="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <!-- Einstellungsformular -->
        <div class="space-y-6">
          <!-- Pausendauer -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pausendauer (Minuten)
            </label>
            <input
              v-model.number="tempSettings.breakDuration"
              type="number"
              min="1"
              class="w-full px-3 py-2 border rounded-lg"
            >
          </div>

          <!-- Übungsintervall -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Übungserinnerung (Interval in Minuten)
            </label>
            <input
              v-model.number="tempSettings.exerciseInterval"
              type="number"
              min="1"
              class="w-full px-3 py-2 border rounded-lg"
            >
          </div>

          <!-- Pausennachricht -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pausennachricht
            </label>
            <input
              v-model="tempSettings.breakMessage"
              type="text"
              class="w-full px-3 py-2 border rounded-lg"
            >
          </div>

          <!-- Übungsnachricht -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Übungserinnerungsnachricht
            </label>
            <input
              v-model="tempSettings.exerciseMessage"
              type="text"
              class="w-full px-3 py-2 border rounded-lg"
            >
          </div>

          <!-- Speichern-Button -->
          <button
            @click="saveSettings"
            class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Einstellungen speichern
          </button>
        </div>
      </div>
    </div>

    <!--
      HINTERGRUNDAUSWAHL-MODAL
      - Zeigt alle verfügbaren Hintergrundoptionen an
      - Grid-Layout für die Vorschaubilder
    -->
    <div v-if="showBackgroundSelector"
         class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
         @click.self="showBackgroundSelector = false">
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-semibold">Wähle deine Arbeitsumgebung</h3>
          <button @click="showBackgroundSelector = false" class="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <!-- Grid mit allen Hintergrundoptionen -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <button
            v-for="bg in backgrounds"
            :key="bg.value"
            @click="updateBackground(bg.value)"
            class="relative aspect-square rounded-lg overflow-hidden transition-transform hover:scale-105"
            :class="{ 'ring-2 ring-blue-500': selectedBackground === bg.value }"
            :title="bg.label"
          >
            <!-- Farbhintergründe -->
            <div v-if="bg.type === 'color'"
                 :class="[bg.value, 'w-full h-full flex items-center justify-center']">
              <span class="text-sm text-gray-700">{{ bg.label }}</span>
            </div>

            <!-- Bildhintergründe -->
            <template v-else>
              <img :src="bg.value" :alt="bg.label" class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span class="text-white font-medium text-sm">{{ bg.label }}</span>
              </div>
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
