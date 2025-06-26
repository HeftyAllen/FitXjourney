// =============================
// Workout Session Module
// =============================

// Global Variables
let workoutExercises = []
let currentExerciseIndex = 0
let assistanceMode = "voice" // default mode
const isPremiumUser = true // Toggle premium features

// Timer variables
let activeTimerInterval = null // Active exercise timer (counts up)
let activeTime = 0 // Active exercise time in seconds
let restTimerInterval = null // Rest timer (counts down)
let totalWorkoutTimerInterval = null // Total workout timer (counts up)
let totalWorkoutTime = 0 // Total workout time in seconds

// Set recording
let recordedSets = 0

// Rest time and calories tracking
let totalRestTime = 0 // Total rest time (in seconds)
let restCount = 0 // Number of rest intervals taken

// Array to hold per-exercise summary data
let exerciseSummaries = []

// User feedback
let workoutRating = 0

// DOM Elements
const domElements = {
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
}

// =============================
// Utility Functions
// =============================

// Get voice volume from input
function getVoiceVolume() {
  return domElements.voiceVolume ? Number.parseInt(domElements.voiceVolume.value, 10) / 100 : 0.7
}

// Update progress bar
function updateProgressBar() {
  if (!workoutExercises.length) return

  const percent = ((currentExerciseIndex + 1) / workoutExercises.length) * 100
  domElements.progressFill.style.width = `${percent}%`
  domElements.progressPercentage.textContent = `${Math.floor(percent)}%`
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

// Show notification using SweetAlert2 if available
function showNotification(title, message, type = "success", timer = 3000) {
  if (window.Swal) {
    Swal.fire({
      title: title,
      text: message,
      icon: type,
      timer: timer,
      timerProgressBar: true,
      showConfirmButton: false,
    })
  } else {
    alert(`${title}: ${message}`)
  }
}

// =============================
// Load Workout Plan from Storage
// =============================
function loadWorkoutPlanFromStorage() {
  // Try to load from localStorage
  const currentWorkout = localStorage.getItem("currentWorkout")

  if (currentWorkout) {
    // Parse the JSON data
    try {
      const workoutData = JSON.parse(currentWorkout)
      workoutExercises = workoutData.exercises || []

      // Set workout metadata
      if (domElements.workoutName) {
        domElements.workoutName.textContent = workoutData.name || "Current Workout"
      }

      if (domElements.totalExercises) {
        domElements.totalExercises.textContent = workoutExercises.length
      }

      if (domElements.difficultyLevel) {
        domElements.difficultyLevel.textContent = workoutData.difficulty || "Intermediate"
      }

      console.log("Loaded workout data:", workoutData)
    } catch (error) {
      console.error("Error parsing workout data:", error)
      fallbackToLegacyLoading()
      return
    }
  } else {
    fallbackToLegacyLoading()
  }

  // Initialize exercise summaries
  exerciseSummaries = workoutExercises.map((ex) => ({
    name: ex.name,
    setsCompleted: 0,
    repsRecorded: 0,
    timeSpent: 0,
  }))

  // If no exercises were loaded, redirect to planner
  if (workoutExercises.length === 0) {
    showNotification("No Workout Found", "Please create a workout plan first.", "warning")
    setTimeout(() => {
      window.location.href = "workout-planner.html"
    }, 2000)
  }
}

// Fallback to legacy workout plan loading
function fallbackToLegacyLoading() {
  console.log("Falling back to legacy workout loading method")

  const savedPlanHTML = localStorage.getItem("workoutPlan")
  if (!savedPlanHTML) {
    console.error("No workout plan found in localStorage.")
    return
  }

  const tempContainer = document.createElement("div")
  tempContainer.innerHTML = `<ul id="temp-list">${savedPlanHTML}</ul>`
  const liElements = tempContainer.querySelectorAll("li")
  const exercises = []

  liElements.forEach((li) => {
    if (li.querySelector("button")) {
      const text = li.firstChild.textContent.trim()
      const parts = text.split("—").map((p) => p.trim())
      const name = parts[0] || "Unnamed Exercise"
      const description = parts.slice(1).join(". ") || "No description provided."

      exercises.push({
        name,
        description,
        sets: 3,
        reps: 12,
        rest: 60,
        video: li.getAttribute("data-video") || "",
        gifUrl: li.getAttribute("data-gifurl") || "",
        target: "Multiple muscles",
        equipment: "Various",
      })
    }
  })

  workoutExercises = exercises

  // Update UI with workout info
  if (domElements.totalExercises) {
    domElements.totalExercises.textContent = workoutExercises.length
  }
}

// =============================
// Display Current Exercise
// =============================
function displayExercise(index) {
  if (!workoutExercises || index < 0 || index >= workoutExercises.length) return

  const exercise = workoutExercises[index]

  // Update exercise details
  domElements.exerciseTitle.textContent = exercise.name
  domElements.exerciseDescription.textContent =
    exercise.description || "Follow the demonstration and maintain proper form."

  // Update target and equipment tags
  domElements.exerciseTarget.innerHTML = `<i class="material-icons">accessibility</i> ${exercise.target || "Multiple muscles"}`
  domElements.exerciseEquipment.innerHTML = `<i class="material-icons">fitness_center</i> ${exercise.equipment || "Various"}`

  // Update exercise stats
  domElements.exerciseSets.textContent = exercise.sets || 3
  domElements.exerciseReps.textContent = exercise.reps || 12
  domElements.exerciseRest.textContent = `${exercise.rest || 60}s`

  // Update media: prefer gifUrl if available
  if (exercise.gifUrl) {
    domElements.exerciseMedia.src = exercise.gifUrl
    domElements.exerciseMedia.classList.remove("hidden")
    domElements.exerciseVideo.classList.add("hidden")
  } else if (exercise.video) {
    if (exercise.video.toLowerCase().endsWith(".gif")) {
      domElements.exerciseMedia.src = exercise.video
      domElements.exerciseMedia.classList.remove("hidden")
      domElements.exerciseVideo.classList.add("hidden")
    } else {
      domElements.exerciseVideo.classList.remove("hidden")
      domElements.exerciseMedia.classList.add("hidden")
      const sourceEl = domElements.exerciseVideo.querySelector("source")
      sourceEl.src = exercise.video
      domElements.exerciseVideo.load()
    }
  } else {
    domElements.exerciseMedia.src = "/placeholder.svg?height=300&width=400"
    domElements.exerciseVideo.classList.add("hidden")
    domElements.exerciseMedia.classList.remove("hidden")
  }

  // Reset set recording
  recordedSets = 0
  domElements.customSets.value = recordedSets

  // Reset active timer
  resetActiveTimer()

  // Update navigation button states
  domElements.prevButton.disabled = index === 0
  domElements.nextButton.disabled = index === workoutExercises.length - 1

  // Update workout progress bar
  updateProgressBar()

  // Update upcoming exercises list
  updateUpcomingExercises()

  // Speak exercise details if voice assistance is enabled
  if (assistanceMode === "voice" && domElements.assistanceToggle.checked) {
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

  // Show the next 3 exercises (or fewer if near the end)
  for (let i = currentExerciseIndex + 1; i < Math.min(currentExerciseIndex + 6, workoutExercises.length); i++) {
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
// Timer Functions
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
  domElements.totalTimer.textContent = formatTime(totalWorkoutTime)
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

  console.log("Active exercise timer started")
}

function pauseExerciseTimer() {
  if (activeTimerInterval) {
    clearInterval(activeTimerInterval)
    activeTimerInterval = null
    console.log("Active exercise timer paused")
  }
}

function resetExerciseTimer() {
  pauseExerciseTimer()
  activeTime = 0
  updateActiveTimerDisplay()
  console.log("Active exercise timer reset")
}

function updateActiveTimerDisplay() {
  domElements.timerMinutes.textContent = String(Math.floor(activeTime / 60)).padStart(2, "0")
  domElements.timerSeconds.textContent = String(activeTime % 60).padStart(2, "0")
}

function resetActiveTimer() {
  pauseExerciseTimer()
  activeTime = 0
  updateActiveTimerDisplay()
}

// Rest Timer (counting down)
function startRestTimer() {
  // Get rest time from settings
  let restTime = Number.parseInt(domElements.restTimerInput.value, 10)
  if (isNaN(restTime) || restTime <= 0) restTime = 60

  // Update UI to show we're in rest mode
  domElements.exerciseTitle.textContent = "Rest Time"
  domElements.exerciseDescription.textContent = "Take a moment to recover before the next exercise."

  // Update timer display
  domElements.timerMinutes.textContent = String(Math.floor(restTime / 60)).padStart(2, "0")
  domElements.timerSeconds.textContent = String(restTime % 60).padStart(2, "0")

  // Clear any existing interval
  if (restTimerInterval) clearInterval(restTimerInterval)
  if (activeTimerInterval) clearInterval(activeTimerInterval)

  // Speak rest time if voice assistance is enabled
  if (assistanceMode === "voice" && domElements.assistanceToggle.checked) {
    const utterance = new SpeechSynthesisUtterance(`Rest time. ${restTime} seconds until the next exercise.`)
    utterance.volume = getVoiceVolume()
    speechSynthesis.speak(utterance)
  }

  // Start countdown
  restTimerInterval = setInterval(() => {
    restTime--

    // Update display
    domElements.timerMinutes.textContent = String(Math.floor(restTime / 60)).padStart(2, "0")
    domElements.timerSeconds.textContent = String(restTime % 60).padStart(2, "0")

    // Speak countdown for last 5 seconds
    if (restTime <= 5 && restTime > 0 && assistanceMode === "voice" && domElements.assistanceToggle.checked) {
      const utterance = new SpeechSynthesisUtterance(String(restTime))
      utterance.volume = getVoiceVolume()
      speechSynthesis.speak(utterance)
    }

    // End of rest period
    if (restTime <= 0) {
      clearInterval(restTimerInterval)
      restTimerInterval = null

      // Record rest time for statistics
      totalRestTime += Number.parseInt(domElements.restTimerInput.value, 10)
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
      if (assistanceMode === "voice" && domElements.assistanceToggle.checked) {
        const utterance = new SpeechSynthesisUtterance("Rest time complete. Starting next exercise.")
        utterance.volume = getVoiceVolume()
        speechSynthesis.speak(utterance)
      }
    }
  }, 1000)
}

// =============================
// Voice Guidance
// =============================
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
  domElements.voiceStatus.textContent = "Speaking exercise instructions..."
  setTimeout(() => {
    domElements.voiceStatus.textContent = "Ready to guide you through your workout"
  }, 3000)
}

// Activate voice command manually
function activateVoiceCommand() {
  const currentExercise = workoutExercises[currentExerciseIndex]
  if (!currentExercise) return

  speakExerciseDetails(currentExercise)
}

// =============================
// Set Recording
// =============================
function recordSet() {
  recordedSets++
  domElements.customSets.value = recordedSets

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
  if (assistanceMode === "voice" && domElements.assistanceToggle.checked) {
    const utterance = new SpeechSynthesisUtterance(`Set ${recordedSets} recorded.`)
    utterance.volume = getVoiceVolume()
    speechSynthesis.speak(utterance)
  }
}

// Increase sets count
function increaseSets() {
  if (recordedSets < 10) {
    recordedSets++
    domElements.customSets.value = recordedSets
  }
}

// Decrease sets count
function decreaseSets() {
  if (recordedSets > 0) {
    recordedSets--
    domElements.customSets.value = recordedSets
  }
}

// =============================
// Exercise Navigation
// =============================
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
  if (window.Swal) {
    Swal.fire({
      title: "Skip Exercise?",
      text: "Are you sure you want to skip this exercise?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#e67e22",
      cancelButtonColor: "#8e44ad",
      confirmButtonText: "Yes, skip it",
    }).then((result) => {
      if (result.isConfirmed) {
        performSkip()
      }
    })
  } else {
    if (confirm("Are you sure you want to skip this exercise?")) {
      performSkip()
    }
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

// =============================
// Workout Completion
// =============================
function completeWorkout() {
  // Pause timers
  pauseExerciseTimer()
  pauseTotalWorkoutTimer()

  // Update summary for the current exercise
  updateExerciseSummary(currentExerciseIndex)

  // Hide main workout interface
  document.querySelector(".workout-session-layout").classList.add("hidden")

  // Show completion interface
  domElements.workoutCompletion.classList.remove("hidden")

  // Update summary statistics
  domElements.finalTotalTimer.textContent = formatTime(totalWorkoutTime)
  domElements.exercisesCompleted.textContent = workoutExercises.length

  const totalSets = exerciseSummaries.reduce((sum, summary) => sum + summary.setsCompleted, 0)
  domElements.totalSets.textContent = totalSets

  // Calculate average rest time
  const averageRestTime = restCount > 0 ? Math.round(totalRestTime / restCount) : 0
  domElements.avgRestTime.textContent = `${averageRestTime}s`

  // Calculate calories burned (simple estimation)
  const caloriesBurned = Math.floor((totalWorkoutTime / 60) * 8) // Approx 8 calories per minute
  domElements.caloriesBurned.textContent = caloriesBurned

  // Populate exercise summary table
  populateExerciseSummaryTable()

  // Provide voice feedback
  if (assistanceMode === "voice" && domElements.assistanceToggle.checked) {
    const utterance = new SpeechSynthesisUtterance("Congratulations! You have completed your workout session.")
    utterance.volume = getVoiceVolume()
    speechSynthesis.speak(utterance)
  }

  // Show completion notification
  if (window.Swal) {
    Swal.fire({
      title: "Workout Complete!",
      text: "Congratulations on finishing your workout!",
      icon: "success",
      confirmButtonColor: "#e67e22",
    })
  }
}

// Populate exercise summary table
function populateExerciseSummaryTable() {
  const tableBody = domElements.exerciseSummaryTable
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

// =============================
// Save and Share Functions
// =============================
function saveWorkout() {
  const workoutName = domElements.workoutNameInput.value || "Workout " + new Date().toLocaleDateString()
  const feedback = domElements.workoutFeedbackText.value || ""

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
    calories: Number.parseInt(domElements.caloriesBurned.textContent, 10),
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
    Calories: ${domElements.caloriesBurned.textContent}
    
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

  // Redirect to workout planner
  window.location.href = "workout-planner.html"
}

// =============================
// Modal Functions
// =============================
function openTimerSettings() {
  domElements.timerSettingsModal.classList.remove("hidden")
}

function closeTimerSettings() {
  domElements.timerSettingsModal.classList.add("hidden")
}

function saveTimerSettings() {
  // Close modal
  closeTimerSettings()

  // Show confirmation
  showNotification("Settings Saved", "Timer settings have been updated.", "success", 1500)
}

// =============================
// Media Toggle
// =============================
function toggleVideoDemo() {
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

// =============================
// Theme Toggle
// =============================
function toggleTheme() {
  document.body.classList.toggle("light-mode")
  const isLightMode = document.body.classList.contains("light-mode")

  // Update icon
  domElements.themeToggleBtn.innerHTML = isLightMode
    ? '<i class="material-icons">dark_mode</i>'
    : '<i class="material-icons">light_mode</i>'

  // Save preference
  localStorage.setItem("theme", isLightMode ? "light" : "dark")
}

// =============================
// Event Listeners
// =============================
function setupEventListeners() {
  // Timer Controls
  domElements.startButton.addEventListener("click", startExerciseTimer)
  domElements.pauseButton.addEventListener("click", pauseExerciseTimer)
  domElements.resetButton.addEventListener("click", resetExerciseTimer)
  domElements.restButton.addEventListener("click", startRestTimer)
  domElements.settingsButton.addEventListener("click", openTimerSettings)

  // Navigation
  domElements.prevButton.addEventListener("click", previousExercise)
  domElements.nextButton.addEventListener("click", nextExercise)
  domElements.skipButton.addEventListener("click", skipExercise)
  domElements.finishButton.addEventListener("click", completeWorkout)

  // Set Tracking
  domElements.customSets.addEventListener("change", () => {
    recordedSets = Number.parseInt(domElements.customSets.value, 10)
  })

  document.getElementById("btn-record-set").addEventListener("click", recordSet)
  document.getElementById("btn-increase-sets").addEventListener("click", increaseSets)
  document.getElementById("btn-decrease-sets").addEventListener("click", decreaseSets)

  // Voice Assistance
  domElements.voiceButton.addEventListener("click", activateVoiceCommand)
  domElements.assistanceToggle.addEventListener("change", () => {
    assistanceMode = domElements.assistanceToggle.checked ? "voice" : "text"
  })

  // Modal
  document.getElementById("modal-close").addEventListener("click", closeTimerSettings)
  document.getElementById("btn-cancel-settings").addEventListener("click", closeTimerSettings)
  document.getElementById("btn-save-settings").addEventListener("click", saveTimerSettings)

  // Media Toggle
  domElements.videoToggleButton.addEventListener("click", toggleVideoDemo)

  // Completion Actions
  domElements.saveWorkoutButton.addEventListener("click", saveWorkout)
  domElements.shareWorkoutButton.addEventListener("click", shareWorkout)
  domElements.newWorkoutButton.addEventListener("click", startNewWorkout)
  domElements.dashboardButton.addEventListener("click", () => {
    window.location.href = "dashboard.html"
  })

  // Rating Buttons
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

  // Theme Toggle
  domElements.themeToggleBtn.addEventListener("click", toggleTheme)

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "light" && !document.body.classList.contains("light-mode")) {
    toggleTheme()
  }
}

// =============================
// Initialize
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Load workout plan
  loadWorkoutPlanFromStorage();
  
  // Setup event listeners
  setupEventListeners();
  
    toggleTheme();
  }
)


// =============================
// Initialize
// =============================
document.addEventListener("DOMContentLoaded", () =>
{
  // Load workout plan
  loadWorkoutPlanFromStorage()

  // Setup event listeners
  setupEventListeners()

  // Display first exercise
  if (workoutExercises.length > 0) {
    displayExercise(currentExerciseIndex)
  } else {
    // No exercises found, show message
    domElements.exerciseTitle.textContent = "No Workout Found"
    domElements.exerciseDescription.textContent = "Please create a workout plan first."
  }
}

)