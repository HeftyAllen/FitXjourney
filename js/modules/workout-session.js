// =============================
// Enhanced Workout Session Module with Planner Integration
// =============================

// Global Variables
let workoutExercises = []
let currentExerciseIndex = 0
let assistanceMode = "voice"
let currentWorkoutData = null
const isPremiumUser = true

// Timer variables
let activeTimerInterval = null
let activeTime = 0
let restTimerInterval = null
let totalWorkoutTimerInterval = null
let totalWorkoutTime = 0

// Set recording
let recordedSets = 0

// Rest time and calories tracking
let totalRestTime = 0
let restCount = 0

// Array to hold per-exercise summary data
let exerciseSummaries = []

// User feedback
let workoutRating = 0

// DOM Elements (keeping all original elements + adding new ones)
const domElements = {
  // NEW: Workout Selection Elements
  workoutSelectionSection: document.getElementById("workout-selection-section"),
  workoutDate: document.getElementById("workout-date"),
  scheduledWorkoutsList: document.getElementById("scheduled-workouts-list"),
  recentWorkoutsList: document.getElementById("recent-workouts-list"),
  btnRefreshWorkouts: document.getElementById("btn-refresh-workouts"),
  btnToday: document.getElementById("btn-today"),
  btnCustomWorkout: document.getElementById("btn-custom-workout"),
  btnFreeSession: document.getElementById("btn-free-session"),
  btnRepeatLast: document.getElementById("btn-repeat-last"),

  // EXISTING: All original DOM elements
  // Timers
  totalTimer: document.getElementById("total-timer"),
  exerciseTimer: document.getElementById("exercise-timer"),
  timerMinutes: document.getElementById("timer-minutes"),
  timerSeconds: document.getElementById("timer-seconds"),

  // Progress
  progressBar: document.getElementById("progress-bar"),
  progressFill: document.querySelector(".progress-fill"),
  progressPercentage: document.getElementById("progress-percentage"),

  // Exercise Display
  exerciseTitle: document.getElementById("exercise-title"),
  exerciseDescription: document.getElementById("exercise-description"),
  exerciseTarget: document.getElementById("exercise-target"),
  exerciseEquipment: document.getElementById("exercise-equipment"),
  exerciseSets: document.getElementById("exercise-sets"),
  exerciseReps: document.getElementById("exercise-reps"),
  exerciseRest: document.getElementById("exercise-rest"),
  exerciseMedia: document.getElementById("exercise-media"),
  exerciseVideo: document.getElementById("exercise-video"),

  // Set Tracking
  customSets: document.getElementById("custom-sets"),

  // Navigation Buttons
  prevButton: document.getElementById("btn-prev"),
  nextButton: document.getElementById("btn-next"),
  skipButton: document.getElementById("btn-skip"),
  finishButton: document.getElementById("btn-finish"),

  // Timer Controls
  startButton: document.getElementById("btn-start"),
  pauseButton: document.getElementById("btn-pause"),
  resetButton: document.getElementById("btn-reset"),
  restButton: document.getElementById("btn-rest"),
  settingsButton: document.getElementById("btn-settings"),

  // Voice Assistance
  voiceButton: document.getElementById("btn-voice"),
  assistanceToggle: document.getElementById("assistance-toggle"),
  voiceVolume: document.getElementById("voice-volume"),
  voiceStatus: document.getElementById("voice-status"),

  // Upcoming Exercises
  upcomingExercisesList: document.getElementById("upcoming-exercises-list"),

  // Workout Info
  workoutName: document.getElementById("workout-name"),
  totalExercises: document.getElementById("total-exercises"),
  difficultyLevel: document.getElementById("difficulty-level"),

  // Completion Screen
  workoutCompletion: document.getElementById("workout-completion"),
  finalTotalTimer: document.getElementById("final-total-timer"),
  exercisesCompleted: document.getElementById("exercises-completed"),
  totalSets: document.getElementById("total-sets"),
  avgRestTime: document.getElementById("avg-rest-time"),
  caloriesBurned: document.getElementById("calories-burned"),
  exerciseSummaryTable: document.getElementById("exercise-summary-table"),
  workoutFeedbackText: document.getElementById("workout-feedback-text"),
  workoutNameInput: document.getElementById("workout-name-input"),

  // Modal
  timerSettingsModal: document.getElementById("timer-settings-modal"),
  exerciseTimerInput: document.getElementById("exercise-timer-input"),
  restTimerInput: document.getElementById("rest-timer-input"),
  transitionTimerInput: document.getElementById("transition-timer-input"),

  // Media Toggle
  videoToggleButton: document.getElementById("btn-video-toggle"),

  // Rating Buttons
  ratingButtons: document.querySelectorAll(".rating-btn"),

  // Completion Action Buttons
  saveWorkoutButton: document.getElementById("btn-save-workout"),
  shareWorkoutButton: document.getElementById("btn-share-workout"),
  newWorkoutButton: document.getElementById("btn-new-workout"),
  dashboardButton: document.getElementById("btn-dashboard"),

  // Theme Toggle
  themeToggleBtn: document.getElementById("theme-toggle-btn"),

  // Mobile Menu
  mobileMenuToggle: document.getElementById("mobile-menu-toggle"),
  workoutNav: document.querySelector(".workout-nav"),

  // Chat
  chatToggle: document.getElementById("chat-toggle"),
  aiChatbot: document.getElementById("ai-chatbot"),
  closeChatBtn: document.getElementById("close-chat"),
  chatInput: document.getElementById("chat-input"),
  sendChatBtn: document.getElementById("send-chat"),
  chatBody: document.getElementById("chat-body"),

  // Workout Session Layout
  workoutSessionLayout: document.querySelector(".workout-session-layout"),
}

// =============================
// NEW: Workout Selection Functions
// =============================
function showWorkoutSelection() {
  if (domElements.workoutSelectionSection) {
    domElements.workoutSelectionSection.style.display = "block"
  }
  if (domElements.workoutSessionLayout) {
    domElements.workoutSessionLayout.style.display = "none"
  }
  if (domElements.workoutCompletion) {
    domElements.workoutCompletion.classList.add("hidden")
  }
}

function hideWorkoutSelection() {
  if (domElements.workoutSelectionSection) {
    domElements.workoutSelectionSection.style.display = "none"
  }
  if (domElements.workoutSessionLayout) {
    domElements.workoutSessionLayout.style.display = "grid"
  }
}

function setTodayDate() {
  if (domElements.workoutDate) {
    const today = new Date().toISOString().split("T")[0]
    domElements.workoutDate.value = today
    loadScheduledWorkouts()
  }
}

function loadScheduledWorkouts() {
  if (!domElements.scheduledWorkoutsList || !domElements.workoutDate) return

  const selectedDate = domElements.workoutDate.value
  const workoutsList = domElements.scheduledWorkoutsList

  // Show loading state
  workoutsList.innerHTML = `
    <div class="loading-placeholder">
      <i class="material-icons loading">refresh</i>
      <p>Loading scheduled workouts...</p>
    </div>
  `

  // Get scheduled workouts from localStorage (from workout planner)
  const scheduledWorkouts = getScheduledWorkoutsForDate(selectedDate)

  setTimeout(() => {
    if (scheduledWorkouts.length === 0) {
      workoutsList.innerHTML = `
        <div class="no-workouts">
          <i class="material-icons">event_busy</i>
          <p>No workouts scheduled for this date</p>
          <button class="btn btn-outline" onclick="redirectToPlanner()">
            <i class="material-icons">add</i>
            Schedule Workout
          </button>
        </div>
      `
    } else {
      workoutsList.innerHTML = scheduledWorkouts
        .map(
          (workout) => `
        <div class="scheduled-workout-item" onclick="selectScheduledWorkout('${workout.id}', '${selectedDate}')">
          <div class="workout-info">
            <h4>${workout.name}</h4>
            <div class="workout-details">
              <span><i class="material-icons">schedule</i> ${workout.duration} min</span>
              <span><i class="material-icons">fitness_center</i> ${workout.exercises.length} exercises</span>
              <span><i class="material-icons">local_fire_department</i> ${workout.estimatedCalories} cal</span>
            </div>
            <div class="workout-time">
              <i class="material-icons">access_time</i>
              ${workout.scheduledTime || "Anytime"}
            </div>
          </div>
          <div class="workout-actions">
            <button class="btn-icon" onclick="event.stopPropagation(); previewWorkout('${workout.id}')" title="Preview">
              <i class="material-icons">visibility</i>
            </button>
            <button class="btn-icon" onclick="event.stopPropagation(); editWorkout('${workout.id}')" title="Edit">
              <i class="material-icons">edit</i>
            </button>
          </div>
        </div>
      `,
        )
        .join("")
    }
  }, 500)
}

function getScheduledWorkoutsForDate(date) {
  try {
    const workoutPlans = JSON.parse(localStorage.getItem("workoutPlans") || "{}")
    const dayPlans = workoutPlans[date] || []

    return dayPlans.map((plan) => ({
      id: plan.id || generateId(),
      name: plan.name || "Unnamed Workout",
      duration: plan.duration || calculateWorkoutDuration(plan.exercises),
      exercises: plan.exercises || [],
      estimatedCalories: plan.estimatedCalories || calculateEstimatedCalories(plan.exercises),
      scheduledTime: plan.time,
      difficulty: plan.difficulty || "Medium",
      category: plan.category || "General",
    }))
  } catch (error) {
    console.error("Error loading scheduled workouts:", error)
    return []
  }
}

function loadRecentWorkouts() {
  if (!domElements.recentWorkoutsList) return

  const recentWorkoutsList = domElements.recentWorkoutsList
  const recentWorkouts = getRecentWorkouts()

  if (recentWorkouts.length === 0) {
    recentWorkoutsList.innerHTML = `
      <div class="no-recent-workouts">
        <i class="material-icons">history</i>
        <p>No recent workouts found</p>
      </div>
    `
  } else {
    recentWorkoutsList.innerHTML = recentWorkouts
      .map(
        (workout) => `
      <div class="recent-workout-item" onclick="selectRecentWorkout('${workout.id}')">
        <div class="workout-info">
          <h4>${workout.name}</h4>
          <div class="workout-meta">
            <span>${workout.date}</span>
            <span>${workout.duration}</span>
            <span>${workout.exercises.length} exercises</span>
          </div>
        </div>
        <div class="workout-rating">
          ${generateStarRating(workout.rating)}
        </div>
      </div>
    `,
      )
      .join("")
  }
}

function getRecentWorkouts() {
  try {
    const workoutHistory = JSON.parse(localStorage.getItem("workoutHistory") || "[]")
    return workoutHistory.slice(0, 5) // Get last 5 workouts
  } catch (error) {
    console.error("Error loading recent workouts:", error)
    return []
  }
}

// NEW: Workout Selection Handlers
function selectScheduledWorkout(workoutId, date) {
  const scheduledWorkouts = getScheduledWorkoutsForDate(date)
  const selectedWorkout = scheduledWorkouts.find((w) => w.id === workoutId)

  if (selectedWorkout) {
    loadWorkout(selectedWorkout)
    showNotification("Workout Loaded", "Workout loaded successfully!", "success")
  } else {
    showNotification("Error", "Workout not found", "error")
  }
}

function selectRecentWorkout(workoutId) {
  const recentWorkouts = getRecentWorkouts()
  const selectedWorkout = recentWorkouts.find((w) => w.id === workoutId)

  if (selectedWorkout) {
    loadWorkout(selectedWorkout)
    showNotification("Workout Loaded", "Previous workout loaded!", "success")
  } else {
    showNotification("Error", "Workout not found", "error")
  }
}

function startCustomWorkout() {
  const customWorkout = {
    id: generateId(),
    name: "Custom Workout",
    exercises: [],
    duration: 0,
    estimatedCalories: 0,
    isCustom: true,
  }

  loadWorkout(customWorkout)
  showNotification("Custom Workout", "Custom workout started! Add exercises as you go.", "info")
}

function startFreeSession() {
  const freeSession = {
    id: generateId(),
    name: "Free Session",
    exercises: [
      {
        id: "free-session",
        name: "Free Training",
        description: "Track your time and add exercises as needed",
        sets: 0,
        reps: 0,
        rest: 60,
        category: "General",
      },
    ],
    duration: 0,
    estimatedCalories: 0,
    isFreeSession: true,
  }

  loadWorkout(freeSession)
  showNotification("Free Session", "Free session started!", "success")
}

function repeatLastWorkout() {
  const recentWorkouts = getRecentWorkouts()
  if (recentWorkouts.length > 0) {
    selectRecentWorkout(recentWorkouts[0].id)
  } else {
    showNotification("No Recent Workouts", "No recent workouts found", "warning")
  }
}

// NEW: Enhanced workout loading
function loadWorkout(workout) {
  currentWorkoutData = workout
  workoutExercises = workout.exercises || []
  currentExerciseIndex = 0
  recordedSets = 0

  // Update workout info
  if (domElements.workoutName) {
    domElements.workoutName.textContent = workout.name
  }
  if (domElements.totalExercises) {
    domElements.totalExercises.textContent = workoutExercises.length
  }
  if (domElements.difficultyLevel) {
    domElements.difficultyLevel.textContent = workout.difficulty || "Medium"
  }

  // Initialize exercise summaries
  exerciseSummaries = workoutExercises.map((ex) => ({
    name: ex.name,
    setsCompleted: 0,
    repsRecorded: 0,
    timeSpent: 0,
  }))

  // Load first exercise or show empty state
  if (workoutExercises.length > 0) {
    displayExercise(0)
    updateUpcomingExercises()
  } else {
    showEmptyExerciseState()
  }

  // Hide selection and show workout
  hideWorkoutSelection()

  // Reset timers
  resetAllTimers()

  // Update progress
  updateProgressBar()
}

function showEmptyExerciseState() {
  if (domElements.exerciseTitle) {
    domElements.exerciseTitle.textContent = "No exercises planned"
  }
  if (domElements.exerciseDescription) {
    domElements.exerciseDescription.textContent = "Add exercises to your workout or start a custom session"
  }
  if (domElements.exerciseSets) {
    domElements.exerciseSets.textContent = "0"
  }
  if (domElements.exerciseReps) {
    domElements.exerciseReps.textContent = "0"
  }
  if (domElements.exerciseRest) {
    domElements.exerciseRest.textContent = "0s"
  }
}

// NEW: Utility functions
function generateId() {
  return "workout_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
}

function calculateWorkoutDuration(exercises) {
  if (!exercises || exercises.length === 0) return 0

  return exercises.reduce((total, exercise) => {
    const exerciseTime = (exercise.sets || 1) * ((exercise.reps || 10) * 3 + (exercise.rest || 60))
    return total + Math.ceil(exerciseTime / 60)
  }, 0)
}

function calculateEstimatedCalories(exercises) {
  if (!exercises || exercises.length === 0) return 0

  return exercises.reduce((total, exercise) => {
    const caloriesPerSet = 8 // Rough estimate
    return total + (exercise.sets || 1) * caloriesPerSet
  }, 0)
}

function generateStarRating(rating) {
  let stars = ""
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="material-icons star-filled">star</i>'
    } else {
      stars += '<i class="material-icons star-empty">star_border</i>'
    }
  }
  return stars
}

function redirectToPlanner() {
  window.location.href = "workout-planner.html"
}

function previewWorkout(workoutId) {
  showNotification("Preview", "Workout preview feature coming soon!", "info")
}

function editWorkout(workoutId) {
  window.location.href = `workout-planner.html?edit=${workoutId}`
}

function resetAllTimers() {
  pauseExerciseTimer()
  pauseTotalWorkoutTimer()
  activeTime = 0
  totalWorkoutTime = 0
  updateActiveTimerDisplay()
  updateTotalWorkoutTimerDisplay()

  // Reset button state
  if (domElements.startButton) {
    domElements.startButton.innerHTML = '<i class="material-icons">play_arrow</i> Start'
    domElements.startButton.onclick = startExerciseTimer
  }
}

// =============================
// EXISTING: All original utility functions (keeping them intact)
// =============================

// Get voice volume from input
function getVoiceVolume() {
  return domElements.voiceVolume ? Number.parseInt(domElements.voiceVolume.value, 10) / 100 : 0.7
}

// Update progress bar
function updateProgressBar() {
  if (!workoutExercises.length) return

  const percent = ((currentExerciseIndex + 1) / workoutExercises.length) * 100
  if (domElements.progressFill) {
    domElements.progressFill.style.width = `${percent}%`
  }
  if (domElements.progressPercentage) {
    domElements.progressPercentage.textContent = `${Math.floor(percent)}%`
  }
}

// Format time (seconds to HH:MM:SS or MM:SS)
function formatTime(seconds, includeHours = true) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (includeHours) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  } else {
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }
}

// Show notification
function showNotification(title, message, type = "success", timer = 3000) {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type} show`

  const icons = {
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  }

  notification.innerHTML = `
    <div class="notification-content">
      <i class="material-icons">${icons[type] || "info"}</i>
      <span>${message}</span>
    </div>
    <button class="notification-close">
      <i class="material-icons">close</i>
    </button>
  `

  // Add to container
  const container = document.getElementById("notification-container") || document.body
  container.appendChild(notification)

  // Auto hide after timer
  setTimeout(() => {
    notification.classList.remove("show")
    setTimeout(() => notification.remove(), 300)
  }, timer)

  // Close button
  notification.querySelector(".notification-close").addEventListener("click", () => {
    notification.classList.remove("show")
    setTimeout(() => notification.remove(), 300)
  })
}

// =============================
// EXISTING: Load Workout Plan from Storage (enhanced)
// =============================
function loadWorkoutPlanFromStorage() {
  const currentWorkout = localStorage.getItem("currentWorkout")

  if (currentWorkout) {
    try {
      const workoutData = JSON.parse(currentWorkout)
      loadWorkout(workoutData)
      return
    } catch (error) {
      console.error("Error parsing workout data:", error)
    }
  }

  // Check URL parameters for direct workout loading
  const urlParams = new URLSearchParams(window.location.search)
  const workoutId = urlParams.get("workout")
  const date = urlParams.get("date")

  if (workoutId && date) {
    const scheduledWorkouts = getScheduledWorkoutsForDate(date)
    const workout = scheduledWorkouts.find((w) => w.id === workoutId)
    if (workout) {
      loadWorkout(workout)
      return
    }
  }

  // Show workout selection if no workout found
  showWorkoutSelection()
  loadScheduledWorkouts()
  loadRecentWorkouts()
  setTodayDate()
}

// Fallback to legacy workout plan loading (keeping original logic)
function fallbackToLegacyLoading() {
  console.log("Falling back to legacy workout loading method")

  // Create sample workout if none exists
  workoutExercises = [
    {
      name: "Push-ups",
      description: "Classic bodyweight exercise for chest, shoulders, and triceps.",
      sets: 3,
      reps: 12,
      rest: 60,
      gifUrl: "/placeholder.svg?height=300&width=400",
      target: "Chest",
      equipment: "Bodyweight",
    },
    {
      name: "Squats",
      description: "Fundamental lower body exercise targeting quads, glutes, and hamstrings.",
      sets: 3,
      reps: 15,
      rest: 60,
      gifUrl: "/placeholder.svg?height=300&width=400",
      target: "Legs",
      equipment: "Bodyweight",
    },
    {
      name: "Plank",
      description: "Core strengthening exercise that engages the entire core.",
      sets: 3,
      reps: 30,
      rest: 45,
      gifUrl: "/placeholder.svg?height=300&width=400",
      target: "Core",
      equipment: "Bodyweight",
    },
  ]

  // Update UI with workout info
  if (domElements.totalExercises) {
    domElements.totalExercises.textContent = workoutExercises.length
  }
}

// =============================
// EXISTING: All original functions (keeping them exactly as they were)
// =============================

// Display Current Exercise
function displayExercise(index) {
  if (!workoutExercises || index < 0 || index >= workoutExercises.length) return

  const exercise = workoutExercises[index]

  // Update exercise details
  if (domElements.exerciseTitle) {
    domElements.exerciseTitle.textContent = exercise.name
  }
  if (domElements.exerciseDescription) {
    domElements.exerciseDescription.textContent =
      exercise.description || "Follow the demonstration and maintain proper form."
  }

  // Update target and equipment tags
  if (domElements.exerciseTarget) {
    domElements.exerciseTarget.innerHTML = `<i class="material-icons">accessibility</i> ${exercise.target || "Multiple muscles"}`
  }
  if (domElements.exerciseEquipment) {
    domElements.exerciseEquipment.innerHTML = `<i class="material-icons">fitness_center</i> ${exercise.equipment || "Various"}`
  }

  // Update exercise stats
  if (domElements.exerciseSets) {
    domElements.exerciseSets.textContent = exercise.sets || 3
  }
  if (domElements.exerciseReps) {
    domElements.exerciseReps.textContent = exercise.reps || 12
  }
  if (domElements.exerciseRest) {
    domElements.exerciseRest.textContent = `${exercise.rest || 60}s`
  }

  // Update media
  if (domElements.exerciseMedia) {
    if (exercise.gifUrl) {
      domElements.exerciseMedia.src = exercise.gifUrl
      domElements.exerciseMedia.classList.remove("hidden")
      if (domElements.exerciseVideo) {
        domElements.exerciseVideo.classList.add("hidden")
      }
    } else {
      domElements.exerciseMedia.src = "/placeholder.svg?height=300&width=400"
      if (domElements.exerciseVideo) {
        domElements.exerciseVideo.classList.add("hidden")
      }
      domElements.exerciseMedia.classList.remove("hidden")
    }
  }

  // Reset set recording
  recordedSets = 0
  if (domElements.customSets) {
    domElements.customSets.value = recordedSets
  }

  // Reset active timer
  resetActiveTimer()

  // Update navigation button states
  if (domElements.prevButton) {
    domElements.prevButton.disabled = index === 0
  }
  if (domElements.nextButton) {
    domElements.nextButton.disabled = index === workoutExercises.length - 1
  }

  // Update workout progress bar
  updateProgressBar()

  // Update upcoming exercises list
  updateUpcomingExercises()

  // Speak exercise details if voice assistance is enabled
  if (assistanceMode === "voice" && domElements.assistanceToggle && domElements.assistanceToggle.checked) {
    speakExerciseDetails(exercise)
  }
}

// Update upcoming exercises list
function updateUpcomingExercises() {
  const upcomingList = domElements.upcomingExercisesList
  if (!upcomingList) return

  upcomingList.innerHTML = ""

  if (currentExerciseIndex >= workoutExercises.length - 1) {
    const li = document.createElement("li")
    li.textContent = "No more exercises in this workout."
    li.classList.add("placeholder-item")
    upcomingList.appendChild(li)
    return
  }

  // Show the next 3 exercises
  for (let i = currentExerciseIndex + 1; i < Math.min(currentExerciseIndex + 4, workoutExercises.length); i++) {
    const exercise = workoutExercises[i]
    const li = document.createElement("li")
    li.innerHTML = `
      <strong>${i - currentExerciseIndex}. ${exercise.name}</strong>
      <div>${exercise.sets || 3} sets × ${exercise.reps || 12} reps</div>
    `
    upcomingList.appendChild(li)
  }
}

// =============================
// EXISTING: Timer Functions (keeping all original logic)
// =============================

// Total Workout Timer (counting up)
function startTotalWorkoutTimer() {
  if (totalWorkoutTimerInterval) return

  totalWorkoutTimerInterval = setInterval(() => {
    totalWorkoutTime++
    updateTotalWorkoutTimerDisplay()
  }, 1000)

  console.log("Total workout timer started")
}

function pauseTotalWorkoutTimer() {
  if (totalWorkoutTimerInterval) {
    clearInterval(totalWorkoutTimerInterval)
    totalWorkoutTimerInterval = null
    console.log("Total workout timer paused")
  }
}

function updateTotalWorkoutTimerDisplay() {
  if (domElements.totalTimer) {
    domElements.totalTimer.textContent = formatTime(totalWorkoutTime)
  }
}

// Active Exercise Timer (counting up)
function startExerciseTimer() {
  if (activeTimerInterval) return

  // Start total workout timer if not already running
  if (!totalWorkoutTimerInterval) startTotalWorkoutTimer()

  activeTimerInterval = setInterval(() => {
    activeTime++
    updateActiveTimerDisplay()
  }, 1000)

  // Update button states
  if (domElements.startButton) {
    domElements.startButton.innerHTML = '<i class="material-icons">pause</i> Pause'
    domElements.startButton.onclick = pauseExerciseTimer
  }

  console.log("Active exercise timer started")
}

function pauseExerciseTimer() {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval)
    activeTimerInterval = null

    // Update button states
    if (domElements.startButton) {
      domElements.startButton.innerHTML = '<i class="material-icons">play_arrow</i> Start'
      domElements.startButton.onclick = startExerciseTimer
    }

    console.log("Active exercise timer paused")
  }
}

function resetExerciseTimer() {
  pauseExerciseTimer()
  activeTime = 0
  updateActiveTimerDisplay()

  // Reset button state
  if (domElements.startButton) {
    domElements.startButton.innerHTML = '<i class="material-icons">play_arrow</i> Start'
    domElements.startButton.onclick = startExerciseTimer
  }

  console.log("Active exercise timer reset")
}

function updateActiveTimerDisplay() {
  if (domElements.timerMinutes) {
    domElements.timerMinutes.textContent = String(Math.floor(activeTime / 60)).padStart(2, "0")
  }
  if (domElements.timerSeconds) {
    domElements.timerSeconds.textContent = String(activeTime % 60).padStart(2, "0")
  }
}

function resetActiveTimer() {
  pauseExerciseTimer()
  activeTime = 0
  updateActiveTimerDisplay()
}

// Rest Timer (counting down)
function startRestTimer() {
  let restTime = Number.parseInt(domElements.restTimerInput?.value || "60", 10)
  if (isNaN(restTime) || restTime <= 0) restTime = 60

  // Update UI to show we're in rest mode
  if (domElements.exerciseTitle) {
    domElements.exerciseTitle.textContent = "Rest Time"
  }
  if (domElements.exerciseDescription) {
    domElements.exerciseDescription.textContent = "Take a moment to recover before the next exercise."
  }

  // Update timer display
  if (domElements.timerMinutes) {
    domElements.timerMinutes.textContent = String(Math.floor(restTime / 60)).padStart(2, "0")
  }
  if (domElements.timerSeconds) {
    domElements.timerSeconds.textContent = String(restTime % 60).padStart(2, "0")
  }

  // Clear any existing interval
  if (restTimerInterval) clearInterval(restTimerInterval)
  if (activeTimerInterval) clearInterval(activeTimerInterval)

  // Speak rest time if voice assistance is enabled
  if (assistanceMode === "voice" && domElements.assistanceToggle && domElements.assistanceToggle.checked) {
    const utterance = new SpeechSynthesisUtterance(`Rest time. ${restTime} seconds until the next exercise.`)
    utterance.volume = getVoiceVolume()
    speechSynthesis.speak(utterance)
  }

  // Start countdown
  restTimerInterval = setInterval(() => {
    restTime--

    // Update display
    if (domElements.timerMinutes) {
      domElements.timerMinutes.textContent = String(Math.floor(restTime / 60)).padStart(2, "0")
    }
    if (domElements.timerSeconds) {
      domElements.timerSeconds.textContent = String(restTime % 60).padStart(2, "0")
    }

    // Speak countdown for last 5 seconds
    if (
      restTime <= 5 &&
      restTime > 0 &&
      assistanceMode === "voice" &&
      domElements.assistanceToggle &&
      domElements.assistanceToggle.checked
    ) {
      const utterance = new SpeechSynthesisUtterance(String(restTime))
      utterance.volume = getVoiceVolume()
      speechSynthesis.speak(utterance)
    }

    // End of rest period
    if (restTime <= 0) {
      clearInterval(restTimerInterval)
      restTimerInterval = null

      // Record rest time for statistics
      totalRestTime += Number.parseInt(domElements.restTimerInput?.value || "60", 10)
      restCount++

      // Move to next exercise if not at the end
      if (currentExerciseIndex < workoutExercises.length - 1) {
        currentExerciseIndex++
        displayExercise(currentExerciseIndex)
      } else {
        // If at the end, just reset the timer
        resetActiveTimer()
        displayExercise(currentExerciseIndex)
      }

      // Announce end of rest if voice assistance is enabled
      if (assistanceMode === "voice" && domElements.assistanceToggle && domElements.assistanceToggle.checked) {
        const utterance = new SpeechSynthesisUtterance("Rest time complete. Starting next exercise.")
        utterance.volume = getVoiceVolume()
        speechSynthesis.speak(utterance)
      }
    }
  }, 1000)
}

// =============================
// EXISTING: All other original functions (Voice, Set Recording, Navigation, etc.)
// =============================

// Voice Guidance
function speakExerciseDetails(exercise) {
  if (!("speechSynthesis" in window)) return

  let message = `Exercise: ${exercise.name}. ${exercise.description}. Do ${exercise.sets} sets of ${exercise.reps} reps. Rest for ${exercise.rest} seconds between sets.`

  // Add motivational message for premium users
  if (isPremiumUser) {
    const motivationalPhrases = [
      "Keep pushing—you're doing great!",
      "Stay focused and maintain proper form.",
      "You've got this! Every rep counts.",
      "Breathe and focus on the muscle you're working.",
      "Great progress! Keep up the good work.",
    ]

    const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)]
    message += ` ${randomPhrase}`
  }

  const utterance = new SpeechSynthesisUtterance(message)
  utterance.volume = getVoiceVolume()
  speechSynthesis.speak(utterance)

  // Update voice status
  if (domElements.voiceStatus) {
    domElements.voiceStatus.textContent = "Speaking exercise instructions..."
    setTimeout(() => {
      if (domElements.voiceStatus) {
        domElements.voiceStatus.textContent = "Ready to guide you through your workout"
      }
    }, 3000)
  }
}

// Activate voice command manually
function activateVoiceCommand() {
  const currentExercise = workoutExercises[currentExerciseIndex]
  if (!currentExercise) return

  speakExerciseDetails(currentExercise)
}

// Set Recording
function recordSet() {
  recordedSets++
  if (domElements.customSets) {
    domElements.customSets.value = recordedSets
  }

  // Update the exercise summary for the current exercise
  if (currentExerciseIndex >= 0 && currentExerciseIndex < exerciseSummaries.length) {
    exerciseSummaries[currentExerciseIndex].setsCompleted++

    // Record reps
    const exercise = workoutExercises[currentExerciseIndex]
    exerciseSummaries[currentExerciseIndex].repsRecorded += exercise.reps || 12
  }

  // Show confirmation
  showNotification("Set Recorded", `Set ${recordedSets} completed!`, "success", 1500)

  // Speak confirmation if voice assistance is enabled
  if (assistanceMode === "voice" && domElements.assistanceToggle && domElements.assistanceToggle.checked) {
    const utterance = new SpeechSynthesisUtterance(`Set ${recordedSets} recorded.`)
    utterance.volume = getVoiceVolume()
    speechSynthesis.speak(utterance)
  }
}

// Increase sets count
function increaseSets() {
  if (recordedSets < 10) {
    recordedSets++
    if (domElements.customSets) {
      domElements.customSets.value = recordedSets
    }
  }
}

// Decrease sets count
function decreaseSets() {
  if (recordedSets > 0) {
    recordedSets--
    if (domElements.customSets) {
      domElements.customSets.value = recordedSets
    }
  }
}

// Exercise Navigation
function nextExercise() {
  // Update exercise summary for current exercise
  updateExerciseSummary(currentExerciseIndex)

  // Check if we're at the end
  if (currentExerciseIndex >= workoutExercises.length - 1) {
    completeWorkout()
    return
  }

  // Start rest timer
  startRestTimer()
}

function previousExercise() {
  // Update exercise summary for current exercise
  updateExerciseSummary(currentExerciseIndex)

  // Check if we're at the beginning
  if (currentExerciseIndex <= 0) return

  // Move to previous exercise
  currentExerciseIndex--
  displayExercise(currentExerciseIndex)
}

function skipExercise() {
  // Confirm skip
  if (confirm("Are you sure you want to skip this exercise?")) {
    performSkip()
  }
}

function performSkip() {
  // Update exercise summary for current exercise
  updateExerciseSummary(currentExerciseIndex)

  // Check if we're at the end
  if (currentExerciseIndex >= workoutExercises.length - 1) {
    completeWorkout()
    return
  }

  // Move to next exercise
  currentExerciseIndex++
  displayExercise(currentExerciseIndex)
}

// Update exercise summary for current exercise
function updateExerciseSummary(index) {
  if (index >= 0 && index < exerciseSummaries.length) {
    // Accumulate active exercise time
    exerciseSummaries[index].timeSpent += activeTime
  }
}

// Workout Completion
function completeWorkout() {
  // Pause timers
  pauseExerciseTimer()
  pauseTotalWorkoutTimer()

  // Update summary for the current exercise
  updateExerciseSummary(currentExerciseIndex)

  // Hide main workout interface
  if (domElements.workoutSessionLayout) {
    domElements.workoutSessionLayout.classList.add("hidden")
  }

  // Show completion interface
  if (domElements.workoutCompletion) {
    domElements.workoutCompletion.classList.remove("hidden")
  }

  // Update summary statistics
  if (domElements.finalTotalTimer) {
    domElements.finalTotalTimer.textContent = formatTime(totalWorkoutTime)
  }
  if (domElements.exercisesCompleted) {
    domElements.exercisesCompleted.textContent = workoutExercises.length
  }

  const totalSets = exerciseSummaries.reduce((sum, summary) => sum + summary.setsCompleted, 0)
  if (domElements.totalSets) {
    domElements.totalSets.textContent = totalSets
  }

  // Calculate average rest time
  const averageRestTime = restCount > 0 ? Math.round(totalRestTime / restCount) : 0
  if (domElements.avgRestTime) {
    domElements.avgRestTime.textContent = `${averageRestTime}s`
  }

  // Calculate calories burned (simple estimation)
  const caloriesBurned = Math.floor((totalWorkoutTime / 60) * 8) // Approx 8 calories per minute
  if (domElements.caloriesBurned) {
    domElements.caloriesBurned.textContent = caloriesBurned
  }

  // Populate exercise summary table
  populateExerciseSummaryTable()

  // Provide voice feedback
  if (assistanceMode === "voice" && domElements.assistanceToggle && domElements.assistanceToggle.checked) {
    const utterance = new SpeechSynthesisUtterance("Congratulations! You have completed your workout session.")
    utterance.volume = getVoiceVolume()
    speechSynthesis.speak(utterance)
  }

  // Show completion notification
  showNotification("Workout Complete!", "Congratulations on finishing your workout!", "success")
}

// Populate exercise summary table
function populateExerciseSummaryTable() {
  const tableBody = domElements.exerciseSummaryTable
  if (!tableBody) return

  tableBody.innerHTML = ""

  exerciseSummaries.forEach((summary, index) => {
    const row = document.createElement("tr")

    const nameCell = document.createElement("td")
    nameCell.textContent = summary.name

    const setsCell = document.createElement("td")
    setsCell.textContent = summary.setsCompleted

    const repsCell = document.createElement("td")
    repsCell.textContent = summary.repsRecorded

    const timeCell = document.createElement("td")
    timeCell.textContent = formatTime(summary.timeSpent, false)

    row.appendChild(nameCell)
    row.appendChild(setsCell)
    row.appendChild(repsCell)
    row.appendChild(timeCell)

    tableBody.appendChild(row)
  })
}

// Save and Share Functions
function saveWorkout() {
  const workoutName = domElements.workoutNameInput?.value || "Workout " + new Date().toLocaleDateString()
  const feedback = domElements.workoutFeedbackText?.value || ""

  const workoutData = {
    name: workoutName,
    date: new Date().toISOString(),
    duration: totalWorkoutTime,
    exercises: workoutExercises.map((ex, index) => ({
      name: ex.name,
      sets: exerciseSummaries[index].setsCompleted,
      reps: exerciseSummaries[index].repsRecorded,
      time: exerciseSummaries[index].timeSpent,
    })),
    totalSets: exerciseSummaries.reduce((sum, summary) => sum + summary.setsCompleted, 0),
    rating: workoutRating,
    feedback: feedback,
    calories: Number.parseInt(domElements.caloriesBurned?.textContent || "0", 10),
  }

  // Get existing saved workouts
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")
  savedWorkouts.push(workoutData)

  // Save to localStorage
  localStorage.setItem("savedWorkouts", JSON.stringify(savedWorkouts))

  // Clear current workout
  localStorage.removeItem("currentWorkout")

  // Show confirmation
  showNotification("Workout Saved", "Your workout has been saved successfully!", "success")

  // Redirect to dashboard after a delay
  setTimeout(() => {
    window.location.href = "dashboard.html"
  }, 2000)
}

function shareWorkout() {
  const workoutSummary = `
    I just completed a workout on FitJourney!
    
    Duration: ${formatTime(totalWorkoutTime)}
    Exercises: ${workoutExercises.length}
    Sets: ${exerciseSummaries.reduce((sum, summary) => sum + summary.setsCompleted, 0)}
    Calories: ${domElements.caloriesBurned?.textContent || "0"}
    
    #FitJourney #Fitness
  `

  if (navigator.share) {
    navigator
      .share({
        title: "My Workout Summary",
        text: workoutSummary,
        url: window.location.href,
      })
      .then(() => {
        console.log("Workout shared successfully!")
      })
      .catch((error) => {
        console.error("Error sharing workout:", error)
        fallbackShare(workoutSummary)
      })
  } else {
    fallbackShare(workoutSummary)
  }
}

function fallbackShare(text) {
  // Create a temporary textarea element
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.style.position = "fixed"
  document.body.appendChild(textarea)

  // Select and copy the text
  textarea.select()
  document.execCommand("copy")

  // Remove the textarea
  document.body.removeChild(textarea)

  // Show confirmation
  showNotification(
    "Copied to Clipboard",
    "Workout summary copied to clipboard. You can now paste it anywhere!",
    "success",
  )
}

function startNewWorkout() {
  // Clear current workout
  localStorage.removeItem("currentWorkout")

  // Show workout selection again
  showWorkoutSelection()
  loadScheduledWorkouts()
  loadRecentWorkouts()
  setTodayDate()
}

// Modal Functions
function openTimerSettings() {
  if (domElements.timerSettingsModal) {
    domElements.timerSettingsModal.classList.remove("hidden")
  }
}

function closeTimerSettings() {
  if (domElements.timerSettingsModal) {
    domElements.timerSettingsModal.classList.add("hidden")
  }
}

function saveTimerSettings() {
  // Close modal
  closeTimerSettings()

  // Show confirmation
  showNotification("Settings Saved", "Timer settings have been updated.", "success", 1500)
}

// Media Toggle
function toggleVideoDemo() {
  if (domElements.exerciseVideo && domElements.exerciseMedia && domElements.videoToggleButton) {
    if (domElements.exerciseVideo.classList.contains("hidden")) {
      domElements.exerciseVideo.classList.remove("hidden")
      domElements.exerciseMedia.classList.add("hidden")
      domElements.videoToggleButton.innerHTML = '<i class="material-icons">image</i> Show Image'
    } else {
      domElements.exerciseVideo.classList.add("hidden")
      domElements.exerciseMedia.classList.remove("hidden")
      domElements.videoToggleButton.innerHTML = '<i class="material-icons">play_circle</i> Watch Video'
    }
  }
}

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle("light-mode")
  const isLightMode = document.body.classList.contains("light-mode")

  // Update icon
  if (domElements.themeToggleBtn) {
    domElements.themeToggleBtn.innerHTML = isLightMode
      ? '<i class="material-icons">dark_mode</i>'
      : '<i class="material-icons">light_mode</i>'
  }

  // Save preference
  localStorage.setItem("theme", isLightMode ? "light" : "dark")
}

// Mobile Menu Toggle
function toggleMobileMenu() {
  if (domElements.workoutNav) {
    domElements.workoutNav.classList.toggle("mobile-open")
  }
}

// Chat Functions
function toggleChat() {
  if (domElements.aiChatbot) {
    domElements.aiChatbot.classList.toggle("hidden")
  }
}

function closeChat() {
  if (domElements.aiChatbot) {
    domElements.aiChatbot.classList.add("hidden")
  }
}

function sendChatMessage() {
  if (!domElements.chatInput || !domElements.chatBody) return

  const message = domElements.chatInput.value.trim()
  if (!message) return

  // Add user message
  const userMessage = document.createElement("div")
  userMessage.className = "chat-message user"
  userMessage.textContent = message
  domElements.chatBody.appendChild(userMessage)

  // Clear input
  domElements.chatInput.value = ""

  // Add bot response (simple responses for demo)
  setTimeout(() => {
    const botMessage = document.createElement("div")
    botMessage.className = "chat-message bot"

    const responses = [
      "Great question! Keep focusing on your form and breathing.",
      "You're doing amazing! Remember to stay hydrated.",
      "That's a good point. Listen to your body and adjust as needed.",
      "Excellent progress! Keep up the great work.",
      "I'm here to help! Feel free to ask anything about your workout.",
    ]

    botMessage.textContent = responses[Math.floor(Math.random() * responses.length)]
    domElements.chatBody.appendChild(botMessage)

    // Scroll to bottom
    domElements.chatBody.scrollTop = domElements.chatBody.scrollHeight
  }, 1000)

  // Scroll to bottom
  domElements.chatBody.scrollTop = domElements.chatBody.scrollHeight
}

// =============================
// Event Listeners (enhanced with new selection events)
// =============================
function setupEventListeners() {
  // NEW: Workout Selection Events
  if (domElements.btnRefreshWorkouts) {
    domElements.btnRefreshWorkouts.addEventListener("click", loadScheduledWorkouts)
  }

  if (domElements.btnToday) {
    domElements.btnToday.addEventListener("click", setTodayDate)
  }

  if (domElements.workoutDate) {
    domElements.workoutDate.addEventListener("change", loadScheduledWorkouts)
  }

  if (domElements.btnCustomWorkout) {
    domElements.btnCustomWorkout.addEventListener("click", startCustomWorkout)
  }

  if (domElements.btnFreeSession) {
    domElements.btnFreeSession.addEventListener("click", startFreeSession)
  }

  if (domElements.btnRepeatLast) {
    domElements.btnRepeatLast.addEventListener("click", repeatLastWorkout)
  }

  // EXISTING: All original event listeners
  // Timer Controls
  if (domElements.startButton) {
    domElements.startButton.addEventListener("click", startExerciseTimer)
  }
  if (domElements.pauseButton) {
    domElements.pauseButton.addEventListener("click", pauseExerciseTimer)
  }
  if (domElements.resetButton) {
    domElements.resetButton.addEventListener("click", resetExerciseTimer)
  }
  if (domElements.restButton) {
    domElements.restButton.addEventListener("click", startRestTimer)
  }
  if (domElements.settingsButton) {
    domElements.settingsButton.addEventListener("click", openTimerSettings)
  }

  // Navigation
  if (domElements.prevButton) {
    domElements.prevButton.addEventListener("click", previousExercise)
  }
  if (domElements.nextButton) {
    domElements.nextButton.addEventListener("click", nextExercise)
  }
  if (domElements.skipButton) {
    domElements.skipButton.addEventListener("click", skipExercise)
  }
  if (domElements.finishButton) {
    domElements.finishButton.addEventListener("click", completeWorkout)
  }

  // Set Tracking
  if (domElements.customSets) {
    domElements.customSets.addEventListener("change", () => {
      recordedSets = Number.parseInt(domElements.customSets.value, 10)
    })
  }

  const recordSetBtn = document.getElementById("btn-record-set")
  if (recordSetBtn) {
    recordSetBtn.addEventListener("click", recordSet)
  }
  const increaseSetBtn = document.getElementById("btn-increase-sets")
  if (increaseSetBtn) {
    increaseSetBtn.addEventListener("click", increaseSets)
  }
  const decreaseSetBtn = document.getElementById("btn-decrease-sets")
  if (decreaseSetBtn) {
    decreaseSetBtn.addEventListener("click", decreaseSets)
  }

  // Voice Assistance
  if (domElements.voiceButton) {
    domElements.voiceButton.addEventListener("click", activateVoiceCommand)
  }
  if (domElements.assistanceToggle) {
    domElements.assistanceToggle.addEventListener("change", () => {
      assistanceMode = domElements.assistanceToggle.checked ? "voice" : "text"
    })
  }

  // Modal
  const modalClose = document.getElementById("modal-close")
  if (modalClose) {
    modalClose.addEventListener("click", closeTimerSettings)
  }
  const cancelSettings = document.getElementById("btn-cancel-settings")
  if (cancelSettings) {
    cancelSettings.addEventListener("click", closeTimerSettings)
  }
  const saveSettings = document.getElementById("btn-save-settings")
  if (saveSettings) {
    saveSettings.addEventListener("click", saveTimerSettings)
  }

  // Media Toggle
  if (domElements.videoToggleButton) {
    domElements.videoToggleButton.addEventListener("click", toggleVideoDemo)
  }

  // Completion Actions
  if (domElements.saveWorkoutButton) {
    domElements.saveWorkoutButton.addEventListener("click", saveWorkout)
  }
  if (domElements.shareWorkoutButton) {
    domElements.shareWorkoutButton.addEventListener("click", shareWorkout)
  }
  if (domElements.newWorkoutButton) {
    domElements.newWorkoutButton.addEventListener("click", startNewWorkout)
  }
  if (domElements.dashboardButton) {
    domElements.dashboardButton.addEventListener("click", () => {
      window.location.href = "dashboard.html"
    })
  }

  // Rating Buttons
  if (domElements.ratingButtons) {
    domElements.ratingButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons
        domElements.ratingButtons.forEach((btn) => btn.classList.remove("active"))

        // Add active class to clicked button
        button.classList.add("active")

        // Store rating
        workoutRating = Number.parseInt(button.dataset.rating, 10)
      })
    })
  }

  // Theme Toggle
  if (domElements.themeToggleBtn) {
    domElements.themeToggleBtn.addEventListener("click", toggleTheme)
  }

  // Mobile Menu Toggle
  if (domElements.mobileMenuToggle) {
    domElements.mobileMenuToggle.addEventListener("click", toggleMobileMenu)
  }

  // Chat Functions
  if (domElements.chatToggle) {
    domElements.chatToggle.addEventListener("click", toggleChat)
  }
  if (domElements.closeChatBtn) {
    domElements.closeChatBtn.addEventListener("click", closeChat)
  }
  if (domElements.sendChatBtn) {
    domElements.sendChatBtn.addEventListener("click", sendChatMessage)
  }
  if (domElements.chatInput) {
    domElements.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendChatMessage()
      }
    })
  }

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "light" && !document.body.classList.contains("light-mode")) {
    toggleTheme()
  }

  // Handle mobile resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && domElements.workoutNav) {
      domElements.workoutNav.classList.remove("mobile-open")
    }
  })

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".workout-nav") && !e.target.closest(".mobile-menu-toggle") && domElements.workoutNav) {
      domElements.workoutNav.classList.remove("mobile-open")
    }
  })
}

// =============================
// Global Functions (for inline onclick handlers)
// =============================
window.selectScheduledWorkout = selectScheduledWorkout
window.selectRecentWorkout = selectRecentWorkout
window.previewWorkout = previewWorkout
window.editWorkout = editWorkout
window.redirectToPlanner = redirectToPlanner

// =============================
// Initialize (enhanced)
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Setup event listeners first
  setupEventListeners()

  // Load workout plan or show selection
  loadWorkoutPlanFromStorage()

  // Display first exercise if we have exercises
  if (workoutExercises.length > 0) {
    displayExercise(currentExerciseIndex)
  }
})
