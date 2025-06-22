<script setup lang="ts">
// Importe der benötigten Vue-Funktionen und Bibliotheken
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from 'vue-toastification'

// Typdefinition für den Timeout (browser-kompatible Lösung)
type Timeout = ReturnType<typeof setTimeout>;

// Toast-Instanz für Benachrichtigungen
const toast = useToast()

// Props-Definition für die übergeordnete Komponente
const props = defineProps<{
  settings: {
    breakDuration: number     // Dauer der Pause in Minuten
    exerciseInterval: number  // Interval für Übungserinnerungen in Minuten
    breakMessage: string     // Nachricht bei Pausenbeginn
    exerciseMessage: string  // Nachricht für Übungserinnerung
  }
}>()

// Reaktive Zustandsvariablen
const timeLeft = ref(50 * 60)          // Verbleibende Zeit in Sekunden (Standard: 50 Minuten)
const isRunning = ref(false)           // Steuert ob der Timer läuft
const customTime = ref(50)             // Benutzerdefinierte Zeit in Minuten
const timer = ref<Timeout | null>(null) // Referenz auf den Timer-Interval
const showExerciseModal = ref(false)    // Steuert die Anzeige des Übungsmodals
const showBreakConfirmation = ref(false) // Steuert die Pausenbestätigung
const showBreakTimer = ref(false)       // Steuert die Anzeige des Pausentimers
const breakTimeLeft = ref(0)           // Verbleibende Pausenzeit in Sekunden
const breakTimer = ref<Timeout | null>(null) // Referenz auf den Pausen-Timer

/*
 * Berechnete Eigenschaften
 */

// Formatiert die verbleibende Zeit als MM:SS
const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Formatiert die verbleibende Pausenzeit als MM:SS
const formattedBreakTime = computed(() => {
  const minutes = Math.floor(breakTimeLeft.value / 60)
  const seconds = breakTimeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

/*
 * Timer-Funktionen
 */

// Startet den Haupttimer
const startTimer = () => {
  if (!isRunning.value) {
    isRunning.value = true
    // Setzt ein Intervall, das jede Sekunde ausgeführt wird
    timer['value'] = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        stopTimer()
        showBreakConfirmation.value = true // Zeigt Pausenbestätigung an
      }
    }, 1000)
  }
}

// Stoppt den Haupttimer
const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  isRunning.value = false
}

// Setzt den Timer auf die ursprüngliche Zeit zurück
const resetTimer = () => {
  stopTimer()
  timeLeft.value = customTime.value * 60
}

// Setzt eine benutzerdefinierte Zeit für den Timer
const setCustomTime = () => {
  timeLeft.value = customTime.value * 60
}

/*
 * Pausen-Funktionen
 */

// Startet die Pause
const startBreak = () => {
  showBreakConfirmation.value = false
  showBreakTimer.value = true
  breakTimeLeft.value = props.settings.breakDuration * 60 // Konvertiert Minuten zu Sekunden

  // Startet den Pausentimer
  breakTimer.value = setInterval(() => {
    if (breakTimeLeft.value > 0) {
      breakTimeLeft.value--
    } else {
      endBreak() // Beendet die Pause automatisch wenn Zeit abgelaufen
    }
  }, 1000)
}

// Überspringt die Pause
const skipBreak = () => {
  showBreakConfirmation.value = false
  resetTimer()
  toast.info("Break skipped. Timer reset!")
}

// Beendet die Pause manuell oder automatisch
const endBreak = () => {
  if (breakTimer.value) {
    clearInterval(breakTimer.value)
    breakTimer.value = null
  }
  showBreakTimer.value = false
  resetTimer()
  toast.success("Break is over! Let's continue studying!")
}

/*
 * Übungserinnerungen
 */
let exerciseInterval: Timeout | null = null

// Richtet die Übungserinnerungen basierend auf den Einstellungen ein
const setupExerciseReminder = () => {
  // Bereinigt vorhandenes Interval falls vorhanden
  if (exerciseInterval) {
    clearInterval(exerciseInterval)
  }

  // Setzt ein neues Interval für die Erinnerungen
  exerciseInterval = setInterval(() => {
    showExerciseModal.value = true
    toast.info(props.settings.exerciseMessage)
  }, props.settings.exerciseInterval * 60 * 1000) // Konvertiert Minuten zu Millisekunden
}

// Beobachtet Änderungen am exerciseInterval und richtet die Erinnerungen neu ein
watch(() => props.settings.exerciseInterval, setupExerciseReminder)

/*
 * Lifecycle Hooks
 */

// Wird beim Einbinden der Komponente ausgeführt
onMounted(() => {
  setupExerciseReminder() // Initialisiert die Übungserinnerungen
})

// Wird beim Entfernen der Komponente ausgeführt
onUnmounted(() => {
  // Bereinigt alle aktiven Intervalle
  if (exerciseInterval) clearInterval(exerciseInterval)
  if (timer.value) clearInterval(timer.value)
  if (breakTimer.value) clearInterval(breakTimer.value)
})
</script>

<template>
  <!-- Hauptansicht des Timers (wenn keine Pause aktiv) -->
  <div v-if="!showBreakTimer" class="flex flex-col items-center space-y-6 p-8">
    <!-- Anzeige der verbleibenden Zeit -->
    <div class="text-6xl font-bold">{{ formattedTime }}</div>

    <!-- Timer-Steuerungsbuttons -->
    <div class="flex space-x-4">
      <button @click="startTimer" :disabled="isRunning"
              class="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50">
        Start
      </button>
      <button @click="stopTimer" :disabled="!isRunning"
              class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50">
        Stop
      </button>
      <button @click="resetTimer"
              class="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition">
        Reset
      </button>
    </div>

    <!-- Benutzerdefinierte Zeiteinstellung -->
    <div class="flex items-center space-x-3 bg-white bg-opacity-80 p-4 rounded-xl shadow-md backdrop-blur-md border border-gray-200">
      <input
        type="number"
        v-model="customTime"
        min="1"
        @keyup.enter="setCustomTime"
        class="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        placeholder="Min"
      >
      <button @click="setCustomTime"
              class="px-5 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition">
        Set Time
      </button>
    </div>

    <!-- Pausenbestätigungs-Modal -->
    <div v-if="showBreakConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg max-w-md text-center">
        <h2 class="text-2xl font-bold mb-4">Time's Up!</h2>
        <p class="mb-6">Would you like to take a {{ props.settings.breakDuration }} minute break?</p>
        <div class="flex justify-center space-x-4">
          <button @click="startBreak" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            Yes, take a break
          </button>
          <button @click="skipBreak" class="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition">
            No, skip break
          </button>
        </div>
      </div>
    </div>

    <!-- Übungs-Modal -->
    <div v-if="showExerciseModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-neutral-100 p-8 rounded-2xl max-w-lg shadow-2xl border-4 border-green-500">
        <h2 class="text-2xl font-bold mb-4">Time for Exercise!</h2>
        <p class="mb-4">Let's do some quick exercises:</p>
        <ul class="list-disc list-inside mb-4">
          <li>Stretch your arms and shoulders</li>
          <li>Stand up and walk around</li>
          <li>Do 10 desk push-ups</li>
          <li>Neck rotations</li>
        </ul>
        <div class="flex justify-center">
          <button
            @click="showExerciseModal = false"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Pausenansicht (wenn Pause aktiv) -->
  <div v-else class="flex flex-col items-center justify-center min-h-[400px] space-y-8 text-center">
    <h2 class="text-3xl font-bold text-gray-800">It's Break Time!</h2>
    <p class="text-lg text-gray-600 max-w-md">
      Take a moment to relax and recharge. Your study session will resume shortly.
    </p>
    <div class="text-6xl font-bold text-blue-600">
      {{ formattedBreakTime }}
    </div>
    <button @click="endBreak" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
      Skip Break
    </button>
  </div>
</template>
