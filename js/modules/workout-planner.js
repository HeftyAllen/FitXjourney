// =============================
// Enhanced Workout Planner Module
// =============================

// API Credentials and Endpoints
const exerciseDBKey = "02e5919d7cmshe07914db7605532p164aa8jsn0cde2d877db5"
const exerciseDBHost = "exercisedb.p.rapidapi.com"

// DOM Elements
const filterButtons = document.querySelectorAll(".filter-btn")
const categoryButtons = document.querySelectorAll(".category-btn")
const equipmentSelect = document.getElementById("equipment")
const generateWorkoutBtn = document.getElementById("generate-workout-btn")
const exerciseGrid = document.getElementById("exercise-grid")
const loadingIndicator = document.getElementById("loading-indicator")
const workoutList = document.getElementById("workout-list")
const generatedWorkout = document.getElementById("generated-workout")
const startWorkoutBtn = document.getElementById("start-workout-btn")
const exerciseSearch = document.getElementById("exercise-search")
const searchBtn = document.getElementById("search-btn")
const prevPageBtn = document.getElementById("prev-page")
const nextPageBtn = document.getElementById("next-page")
const pageIndicator = document.getElementById("page-indicator")
const exerciseModal = document.getElementById("exercise-modal")
const exerciseDetail = document.getElementById("exercise-detail")
const modalCloses = document.querySelectorAll(".modal-close")
const clearWorkoutBtn = document.getElementById("clear-workout-btn")
const saveWorkoutBtn = document.getElementById("save-workout-btn")
const printWorkoutBtn = document.getElementById("print-workout-btn")
const scheduleWorkoutBtn = document.getElementById("schedule-workout-btn")
const exerciseCountElement = document.getElementById("exercise-count")
const totalDurationElement = document.getElementById("total-duration")
const difficultyLevelElement = document.getElementById("difficulty-level")
const workoutCategoryElement = document.getElementById("workout-category")
const themeToggleBtn = document.getElementById("theme-toggle-btn")
const mobileMenuToggle = document.getElementById("mobile-menu-toggle")

// Schedule elements
const scheduleModal = document.getElementById("schedule-modal")
const confirmScheduleBtn = document.getElementById("confirm-schedule-btn")
const cancelScheduleBtn = document.getElementById("cancel-schedule-btn")
const scheduleDaySelect = document.getElementById("schedule-day")
const scheduleTimeSelect = document.getElementById("schedule-time")
const workoutNameInput = document.getElementById("workout-name")
const clearScheduleBtn = document.getElementById("clear-schedule-btn")
const saveScheduleBtn = document.getElementById("save-schedule-btn")
const workoutSlots = document.querySelectorAll(".workout-slot")

// State variables
let currentExercises = []
let selectedExercises = []
let currentPage = 1
let totalPages = 1
const itemsPerPage = 8
let currentFilter = "all"
let currentCategory = "all"
let currentEquipment = ""
let isLightMode = false
let weeklySchedule = {}

// Workout categories mapping
const workoutCategories = {
  strength: ["back", "chest", "shoulders", "upper arms", "lower arms", "upper legs", "lower legs"],
  cardio: ["cardio"],
  flexibility: ["neck", "waist"],
  hiit: ["cardio", "upper legs", "lower legs"],
  yoga: ["neck", "waist", "back"],
  all: ["all"]
}

// Exercise category classification
const exerciseCategories = {
  strength: ["barbell", "dumbbell", "cable", "machine", "kettlebell", "weighted"],
  cardio: ["treadmill", "bike", "elliptical", "rowing", "running"],
  flexibility: ["stretching", "yoga", "mobility"],
  hiit: ["bodyweight", "plyometric", "circuit"]
}

// =============================
// Utility Functions
// =============================

// Get current week dates
function getCurrentWeekDates() {
  const today = new Date()
  const currentDay = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - currentDay + 1)
  
  const weekDates = {}
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  days.forEach((day, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    weekDates[day] = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })
  
  return weekDates
}

// Update calendar dates
function updateCalendarDates() {
  const weekDates = getCurrentWeekDates()
  Object.keys(weekDates).forEach(day => {
    const dateElement = document.getElementById(`${day}-date`)
    if (dateElement) {
      dateElement.textContent = weekDates[day]
    }
  })
}

// Classify exercise by category
function classifyExercise(exercise) {
  const equipment = exercise.equipment.toLowerCase()
  const bodyPart = exercise.bodyPart.toLowerCase()
  
  if (exerciseCategories.strength.some(cat => equipment.includes(cat))) {
    return 'strength'
  } else if (exerciseCategories.cardio.some(cat => equipment.includes(cat)) || bodyPart === 'cardio') {
    return 'cardio'
  } else if (bodyPart === 'neck' || bodyPart === 'waist') {
    return 'flexibility'
  } else {
    return 'strength' // Default to strength
  }
}

// Get exercise icon based on category
function getExerciseIcon(category) {
  const icons = {
    strength: 'sports_martial_arts',
    cardio: 'directions_run',
    flexibility: 'self_improvement',
    hiit: 'whatshot',
    yoga: 'spa'
  }
  return icons[category] || 'fitness_center'
}

// =============================
// API Functions
// =============================

// Fetch all exercises
async function fetchAllExercises() {
  const url = `https://${exerciseDBHost}/exercises?limit=50`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error fetching exercises:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return []
  }
}

// Fetch exercises by body part
async function fetchExercisesByBodyPart(bodyPart) {
  if (bodyPart === "all") {
    return fetchAllExercises()
  }

  const url = `https://${exerciseDBHost}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error fetching exercises by body part:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching exercises by body part:", error)
    return []
  }
}

// Fetch exercises by equipment
async function fetchExercisesByEquipment(equipment) {
  const url = `https://${exerciseDBHost}/exercises/equipment/${encodeURIComponent(equipment)}`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error fetching exercises by equipment:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching exercises by equipment:", error)
    return []
  }
}

// Fetch exercises by name (search)
async function searchExercises(query) {
  const url = `https://${exerciseDBHost}/exercises/name/${encodeURIComponent(query)}`
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": exerciseDBKey,
        "x-rapidapi-host": exerciseDBHost,
      },
    })

    if (!response.ok) {
      console.error("Error searching exercises:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error searching exercises:", error)
    return []
  }
}

// =============================
// UI Functions
// =============================

// Show loading indicator
function showLoading() {
  loadingIndicator.classList.remove("hidden")
  exerciseGrid.innerHTML = ""
}

// Hide loading indicator
function hideLoading() {
  loadingIndicator.classList.add("hidden")
}

// Render exercise cards
function renderExerciseCards(exercises) {
  exerciseGrid.innerHTML = ""

  if (exercises.length === 0) {
    exerciseGrid.innerHTML = `
      <div class="no-results">
        <i class="material-icons">search_off</i>
        <p>No exercises found. Try a different filter or search term.</p>
      </div>
    `
    return
  }

  // Calculate pagination
  totalPages = Math.ceil(exercises.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, exercises.length)
  const paginatedExercises = exercises.slice(startIndex, endIndex)

  // Update pagination controls
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`
  prevPageBtn.disabled = currentPage === 1
  nextPageBtn.disabled = currentPage === totalPages

  // Render exercise cards
  paginatedExercises.forEach((exercise) => {
    const card = document.createElement("div")
    card.className = "exercise-card fadeIn"
    card.dataset.id = exercise.id

    const isSelected = selectedExercises.some((e) => e.id === exercise.id)
    const category = classifyExercise(exercise)
    const categoryIcon = getExerciseIcon(category)

    card.innerHTML = `
      <div class="exercise-category-badge">
        <i class="material-icons">${categoryIcon}</i>
        <span>${category}</span>
      </div>
      <img src="${exercise.gifUrl}" alt="${exercise.name}" class="exercise-image" loading="lazy">
      <div class="exercise-info">
        <h3>${exercise.name}</h3>
        <div class="exercise-meta">
          <span><i class="material-icons">accessibility</i> ${exercise.target}</span>
          <span><i class="material-icons">fitness_center</i> ${exercise.equipment}</span>
        </div>
      </div>
      <div class="exercise-actions">
        <button class="add-btn" title="Add to workout" ${isSelected ? 'style="display:none"' : ""}>
          <i class="material-icons">add</i>
        </button>
        <button class="info-btn" title="View details">
          <i class="material-icons">info</i>
        </button>
        <button class="selected-btn" title="Added to workout" ${isSelected ? "" : 'style="display:none"'}>
          <i class="material-icons">check</i>
        </button>
      </div>
    `

    exerciseGrid.appendChild(card)

    // Add event listeners
    const addBtn = card.querySelector(".add-btn")
    const infoBtn = card.querySelector(".info-btn")
    const selectedBtn = card.querySelector(".selected-btn")

    addBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      addExerciseToWorkout(exercise)
      addBtn.style.display = "none"
      selectedBtn.style.display = "flex"
    })

    infoBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      showExerciseDetails(exercise)
    })

    selectedBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      removeExerciseFromWorkout(exercise.id)
      selectedBtn.style.display = "none"
      addBtn.style.display = "flex"
    })

    // Add click to view details
    card.addEventListener("click", () => {
      showExerciseDetails(exercise)
    })
  })
}

// Render workout list
function renderWorkoutList() {
  workoutList.innerHTML = ""

  if (selectedExercises.length === 0) {
    workoutList.innerHTML = `
      <li class="empty-workout">
        <div class="empty-workout-content">
          <i class="material-icons">fitness_center</i>
          <p>No exercises added to your workout yet.</p>
          <p>Browse and add exercises from the exercise browser above.</p>
        </div>
      </li>
    `
    generatedWorkout.classList.add("hidden")
    return
  }

  selectedExercises.forEach((exercise, index) => {
    const li = document.createElement("li")
    li.className = "workout-item fadeIn"
    li.dataset.id = exercise.id

    const category = classifyExercise(exercise)
    const categoryIcon = getExerciseIcon(category)

    li.innerHTML = `
      <div class="workout-item-number">${index + 1}</div>
      <img src="${exercise.gifUrl}" alt="${exercise.name}" class="workout-item-image" loading="lazy">
      <div class="workout-item-details">
        <h4>${exercise.name}</h4>
        <div class="workout-item-meta">
          <span><i class="material-icons">${categoryIcon}</i> ${category}</span>
          <span><i class="material-icons">fitness_center</i> ${exercise.equipment}</span>
          <span><i class="material-icons">accessibility</i> ${exercise.target}</span>
          <span><i class="material-icons">repeat</i> 3 sets × 12 reps</span>
        </div>
      </div>
      <div class="workout-item-actions">
        <button class="edit-btn" title="Edit sets and reps">
          <i class="material-icons">edit</i>
        </button>
        <button class="move-up-btn" title="Move up" ${index === 0 ? 'disabled' : ''}>
          <i class="material-icons">keyboard_arrow_up</i>
        </button>
        <button class="move-down-btn" title="Move down" ${index === selectedExercises.length - 1 ? 'disabled' : ''}>
          <i class="material-icons">keyboard_arrow_down</i>
        </button>
        <button class="remove-btn" title="Remove from workout">
          <i class="material-icons">delete</i>
        </button>
      </div>
    `

    workoutList.appendChild(li)

    // Add event listeners
    const removeBtn = li.querySelector(".remove-btn")
    const editBtn = li.querySelector(".edit-btn")
    const moveUpBtn = li.querySelector(".move-up-btn")
    const moveDownBtn = li.querySelector(".move-down-btn")

    removeBtn.addEventListener("click", () => {
      removeExerciseFromWorkout(exercise.id)
    })

    editBtn.addEventListener("click", () => {
      editExerciseDetails(exercise, index)
    })

    moveUpBtn.addEventListener("click", () => {
      moveExercise(index, index - 1)
    })

    moveDownBtn.addEventListener("click", () => {
      moveExercise(index, index + 1)
    })
  })

  // Update workout summary
  updateWorkoutSummary()

  // Show generated workout section
  generatedWorkout.classList.remove("hidden")
}

// Update workout summary
function updateWorkoutSummary() {
  exerciseCountElement.textContent = selectedExercises.length
  totalDurationElement.textContent = document.getElementById("session-duration").value
  difficultyLevelElement.textContent = document.getElementById("difficulty").value
  
  // Determine workout category
  const categories = selectedExercises.map(exercise => classifyExercise(exercise))
  const uniqueCategories = [...new Set(categories)]
  
  if (uniqueCategories.length === 1) {
    workoutCategoryElement.textContent = uniqueCategories[0]
  } else if (uniqueCategories.length > 1) {
    workoutCategoryElement.textContent = "Mixed"
  } else {
    workoutCategoryElement.textContent = "Custom"
  }
}

// Show exercise details in modal
function showExerciseDetails(exercise) {
  const category = classifyExercise(exercise)
  const categoryIcon = getExerciseIcon(category)

  exerciseDetail.innerHTML = `
    <div class="exercise-detail">
      <div class="exercise-detail-header">
        <h2>${exercise.name}</h2>
        <div class="exercise-detail-tags">
          <span class="exercise-tag category-${category}">
            <i class="material-icons">${categoryIcon}</i> ${category}
          </span>
          <span class="exercise-tag">
            <i class="material-icons">accessibility</i> ${exercise.target}
          </span>
          <span class="exercise-tag">
            <i class="material-icons">fitness_center</i> ${exercise.equipment}
          </span>
          <span class="exercise-tag">
            <i class="material-icons">category</i> ${exercise.bodyPart}
          </span>
        </div>
      </div>
      
      <div class="exercise-detail-media">
        <img src="${exercise.gifUrl}" alt="${exercise.name}" loading="lazy" />
      </div>
      
      <div class="exercise-detail-info">
        <div class="info-item">
          <span class="info-item-label">Target Muscle</span>
          <span class="info-item-value">${exercise.target}</span>
        </div>
        <div class="info-item">
          <span class="info-item-label">Equipment</span>
          <span class="info-item-value">${exercise.equipment}</span>
        </div>
        <div class="info-item">
          <span class="info-item-label">Body Part</span>
          <span class="info-item-value">${exercise.bodyPart}</span>
        </div>
        <div class="info-item">
          <span class="info-item-label">Category</span>
          <span class="info-item-value">${category}</span>
        </div>
        <div class="info-item">
          <span class="info-item-label">Secondary Muscles</span>
          <span class="info-item-value">${exercise.secondaryMuscles?.join(", ") || "Not specified"}</span>
        </div>
      </div>
      
      <div class="exercise-detail-instructions">
        <h3>Instructions</h3>
        ${
          exercise.instructions
            ? `<div class="instruction-steps">
            ${exercise.instructions
              .map(
                (instruction, index) => `
              <div class="instruction-step">
                <div class="step-number">${index + 1}</div>
                <div class="step-text">${instruction}</div>
              </div>
            `,
              )
              .join("")}
          </div>`
            : `<p>Follow the demonstration in the GIF above for proper form and technique.</p>`
        }
      </div>
      
      <div class="exercise-detail-actions">
        ${
          selectedExercises.some((e) => e.id === exercise.id)
            ? `<button class="btn btn-secondary remove-from-workout-btn">
            <i class="material-icons">remove_circle</i> Remove from Workout
          </button>`
            : `<button class="btn btn-primary add-to-workout-btn">
            <i class="material-icons">add_circle</i> Add to Workout
          </button>`
        }
      </div>
    </div>
  `

  // Add event listeners
  const addToWorkoutBtn = exerciseDetail.querySelector(".add-to-workout-btn")
  if (addToWorkoutBtn) {
    addToWorkoutBtn.addEventListener("click", () => {
      addExerciseToWorkout(exercise)
      exerciseModal.style.display = "none"
    })
  }

  const removeFromWorkoutBtn = exerciseDetail.querySelector(".remove-from-workout-btn")
  if (removeFromWorkoutBtn) {
    removeFromWorkoutBtn.addEventListener("click", () => {
      removeExerciseFromWorkout(exercise.id)
      exerciseModal.style.display = "none"
    })
  }

  exerciseModal.style.display = "block"
}

// =============================
// Schedule Functions
// =============================

// Load schedule from localStorage
function loadSchedule() {
  const savedSchedule = localStorage.getItem("weeklySchedule")
  if (savedSchedule) {
    weeklySchedule = JSON.parse(savedSchedule)
    renderSchedule()
  }
}

// Save schedule to localStorage
function saveSchedule() {
  localStorage.setItem("weeklySchedule", JSON.stringify(weeklySchedule))
}

// Render schedule on calendar
function renderSchedule() {
  workoutSlots.forEach(slot => {
    const day = slot.dataset.day
    const time = slot.dataset.time
    const key = `${day}-${time}`
    
    if (weeklySchedule[key]) {
      const workout = weeklySchedule[key]
      slot.innerHTML = `
        <div class="scheduled-workout">
          <div class="workout-title">${workout.name}</div>
          <div class="workout-info">
            <span><i class="material-icons">timer</i> ${workout.duration}min</span>
            <span><i class="material-icons">fitness_center</i> ${workout.exercises.length}</span>
          </div>
          <button class="remove-scheduled-workout" title="Remove workout">
            <i class="material-icons">close</i>
          </button>
        </div>
      `
      
      slot.classList.add('has-workout')
      
      // Add remove event listener
      const removeBtn = slot.querySelector('.remove-scheduled-workout')
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        removeScheduledWorkout(key)
      })
      
      // Add click to view workout
      slot.addEventListener('click', () => {
        viewScheduledWorkout(workout)
      })
    } else {
      slot.innerHTML = `
        <div class="empty-slot">
          <i class="material-icons">add</i>
          <span>Add Workout</span>
        </div>
      `
      slot.classList.remove('has-workout')
      
      // Add click to schedule workout
      slot.addEventListener('click', () => {
        if (selectedExercises.length > 0) {
          openScheduleModal(day, time)
        } else {
          alert('Please create a workout first before scheduling.')
        }
      })
    }
  })
}

// Open schedule modal
function openScheduleModal(day = null, time = null) {
  if (day) scheduleDaySelect.value = day
  if (time) scheduleTimeSelect.value = time
  
  // Generate default workout name
  const currentCategory = workoutCategoryElement.textContent
  const defaultName = `${currentCategory} Workout - ${new Date().toLocaleDateString()}`
  workoutNameInput.value = defaultName
  
  scheduleModal.style.display = 'block'
}

// Schedule workout
function scheduleWorkout() {
  const day = scheduleDaySelect.value
  const time = scheduleTimeSelect.value
  const name = workoutNameInput.value.trim()
  
  if (!name) {
    alert('Please enter a workout name.')
    return
  }
  
  if (selectedExercises.length === 0) {
    alert('Please add exercises to your workout before scheduling.')
    return
  }
  
  const key = `${day}-${time}`
  
  // Check if slot is already occupied
  if (weeklySchedule[key]) {
    if (!confirm('This time slot already has a workout. Do you want to replace it?')) {
      return
    }
  }
  
  weeklySchedule[key] = {
    name: name,
    exercises: [...selectedExercises],
    duration: document.getElementById("session-duration").value,
    difficulty: document.getElementById("difficulty").value,
    category: workoutCategoryElement.textContent,
    created: new Date().toISOString()
  }
  
  saveSchedule()
  renderSchedule()
  scheduleModal.style.display = 'none'
  
  // Show success message
  showNotification(`Workout "${name}" scheduled for ${day} at ${time}`, 'success')
}

// Remove scheduled workout
function removeScheduledWorkout(key) {
  if (confirm('Are you sure you want to remove this scheduled workout?')) {
    delete weeklySchedule[key]
    saveSchedule()
    renderSchedule()
    showNotification('Workout removed from schedule', 'info')
  }
}

// View scheduled workout
function viewScheduledWorkout(workout) {
  // Load the workout into the current session
  selectedExercises = [...workout.exercises]
  document.getElementById("session-duration").value = workout.duration
  document.getElementById("difficulty").value = workout.difficulty
  
  renderWorkoutList()
  
  // Scroll to workout section
  generatedWorkout.scrollIntoView({ behavior: 'smooth' })
  
  showNotification(`Loaded "${workout.name}" workout`, 'success')
}

// Clear entire schedule
function clearSchedule() {
  if (confirm('Are you sure you want to clear your entire weekly schedule?')) {
    weeklySchedule = {}
    saveSchedule()
    renderSchedule()
    showNotification('Weekly schedule cleared', 'info')
  }
}

// =============================
// FOLDER INTEGRATION: Save Workout to Folder
// =============================

// Utility: Get user ID (for Firebase)
function getCurrentUserId() {
  // Use Firebase Auth if available
  if (window.firebase && window.firebase.auth) {
    const user = window.firebase.auth().currentUser;
    return user ? user.uid : null;
  }
  return null;
}

// Utility: Get folders from localStorage
function getLocalFolders() {
  return JSON.parse(localStorage.getItem("workoutFolders") || "[]");
}

// Utility: Save folders to localStorage
function setLocalFolders(folders) {
  localStorage.setItem("workoutFolders", JSON.stringify(folders));
}

// Utility: Save folders to Firebase (if logged in)
async function setFirebaseFolders(folders) {
  if (!window.firebase || !window.firebase.firestore) return;
  const userId = getCurrentUserId();
  if (!userId) return;
  const db = window.firebase.firestore();
  await db.collection("users").doc(userId).set({ workoutFolders: folders }, { merge: true });
}

// Utility: Get folders from Firebase (if logged in)
async function getFirebaseFolders() {
  if (!window.firebase || !window.firebase.firestore) return null;
  const userId = getCurrentUserId();
  if (!userId) return null;
  const db = window.firebase.firestore();
  const doc = await db.collection("users").doc(userId).get();
  if (doc.exists && doc.data().workoutFolders) {
    return doc.data().workoutFolders;
  }
  return null;
}

// Sync folders: always update both localStorage and Firebase (if logged in)
async function syncFolders(folders) {
  setLocalFolders(folders);
  if (getCurrentUserId()) await setFirebaseFolders(folders);
}

// Save workout to folder if coming from dashboard folder add
async function saveWorkoutToFolderIfNeeded(workout) {
  const folderIdx = sessionStorage.getItem("addWorkoutToFolderIdx");
  if (folderIdx === null) return false;
  let folders = getLocalFolders();
  if (getCurrentUserId()) {
    const fbFolders = await getFirebaseFolders();
    if (fbFolders) folders = fbFolders;
  }
  if (!folders[folderIdx]) return false;
  folders[folderIdx].workouts = folders[folderIdx].workouts || [];
  folders[folderIdx].workouts.push(workout);
  await syncFolders(folders);
  sessionStorage.removeItem("addWorkoutToFolderIdx");
  return true;
}

// Patch saveWorkoutBtn click to support folder save
if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener("click", async () => {
    if (selectedExercises.length === 0) {
      showNotification("Please select at least one exercise to save a workout.", "error");
      return;
    }
    const workoutName = prompt("Enter a name for your workout:", "My Custom Workout");
    if (!workoutName) return;
    const workout = {
      id: Date.now(),
      name: workoutName,
      exercises: selectedExercises,
      duration: document.getElementById("session-duration").value,
      difficulty: document.getElementById("difficulty").value,
      category: workoutCategoryElement.textContent,
      created: new Date().toISOString(),
    };
    // Try to save to folder if needed
    const savedToFolder = await saveWorkoutToFolderIfNeeded(workout);
    if (savedToFolder) {
      showNotification(`Workout "${workoutName}" saved to folder!`, 'success');
      return;
    }
    // Fallback: save to flat savedWorkouts
    const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]");
    savedWorkouts.push(workout);
    localStorage.setItem("savedWorkouts", JSON.stringify(savedWorkouts));
    showNotification(`Workout "${workoutName}" saved successfully!`, 'success');
  });
}

// =============================
// Utility Functions (continued)
// =============================

// Show notification
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification')
  existingNotifications.forEach(notification => notification.remove())

  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="material-icons">${icons[type] || 'info'}</i>
      <span>${message}</span>
    </div>
    <button class="notification-close">
      <i class="material-icons">close</i>
    </button>
  `
  
  document.body.appendChild(notification)
  
  // Show notification
  setTimeout(() => notification.classList.add('show'), 100)
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show')
    setTimeout(() => notification.remove(), 300)
  }, 5000)
  
  // Close button
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.remove('show')
    setTimeout(() => notification.remove(), 300)
  })
}

// =============================
// Event Handlers
// =============================

// Add exercise to workout
function addExerciseToWorkout(exercise) {
  if (!selectedExercises.some((e) => e.id === exercise.id)) {
    selectedExercises.push(exercise)
    renderWorkoutList()

    // Update UI for all instances of this exercise in the grid
    const cards = exerciseGrid.querySelectorAll(`.exercise-card[data-id="${exercise.id}"]`)
    cards.forEach((card) => {
      card.querySelector(".add-btn").style.display = "none"
      card.querySelector(".selected-btn").style.display = "flex"
    })
    
    showNotification(`Added "${exercise.name}" to workout`, 'success')
  }
}

// Remove exercise from workout
function removeExerciseFromWorkout(exerciseId) {
  const exercise = selectedExercises.find(e => e.id === exerciseId)
  selectedExercises = selectedExercises.filter((e) => e.id !== exerciseId)
  renderWorkoutList()

  // Update UI for all instances of this exercise in the grid
  const cards = exerciseGrid.querySelectorAll(`.exercise-card[data-id="${exerciseId}"]`)
  cards.forEach((card) => {
    card.querySelector(".add-btn").style.display = "flex"
    card.querySelector(".selected-btn").style.display = "none"
  })
  
  if (exercise) {
    showNotification(`Removed "${exercise.name}" from workout`, 'info')
  }
}

// Move exercise in workout list
function moveExercise(fromIndex, toIndex) {
  if (toIndex >= 0 && toIndex < selectedExercises.length) {
    const exercise = selectedExercises.splice(fromIndex, 1)[0]
    selectedExercises.splice(toIndex, 0, exercise)
    renderWorkoutList()
  }
}

// Edit exercise details
function editExerciseDetails(exercise, index) {
  const sets = prompt('Enter number of sets:', '3')
  const reps = prompt('Enter number of reps:', '12')
  
  if (sets && reps) {
    // Store custom sets/reps (you could extend the exercise object)
    exercise.customSets = sets
    exercise.customReps = reps
    renderWorkoutList()
    showNotification(`Updated "${exercise.name}" to ${sets} sets × ${reps} reps`, 'success')
  }
}

// Load exercises based on current filter and equipment
async function loadExercises() {
  showLoading()

  let exercises = []

  try {
    if (currentCategory !== "all") {
      // Load exercises based on category
      const bodyParts = workoutCategories[currentCategory] || [currentFilter]
      const promises = bodyParts.map(bodyPart => 
        bodyPart === "all" ? fetchAllExercises() : fetchExercisesByBodyPart(bodyPart)
      )
      const results = await Promise.all(promises)
      exercises = results.flat()
      
      // Filter by category if not "all"
      if (currentCategory !== "all") {
        exercises = exercises.filter(exercise => {
          const category = classifyExercise(exercise)
          return category === currentCategory
        })
      }
    } else if (currentFilter === "all" && !currentEquipment) {
      exercises = await fetchAllExercises()
    } else if (currentEquipment && currentFilter === "all") {
      exercises = await fetchExercisesByEquipment(currentEquipment)
    } else if (currentEquipment && currentFilter !== "all") {
      const bodyPartExercises = await fetchExercisesByBodyPart(currentFilter)
      exercises = bodyPartExercises.filter((e) => e.equipment === currentEquipment)
    } else {
      exercises = await fetchExercisesByBodyPart(currentFilter)
    }

    // Apply equipment filter if selected
    if (currentEquipment) {
      exercises = exercises.filter(e => e.equipment === currentEquipment)
    }

    currentExercises = exercises
    currentPage = 1

    hideLoading()
    renderExerciseCards(exercises)
  } catch (error) {
    hideLoading()
    console.error('Error loading exercises:', error)
    showNotification('Error loading exercises. Please try again.', 'error')
  }
}

// Generate AI workout
async function generateAIWorkout() {
  showLoading()

  try {
    const isCustomWorkout = document.getElementById("custom-workout").checked
    const difficulty = document.getElementById("difficulty").value
    const sessionDuration = Number.parseInt(document.getElementById("session-duration").value)

    // Calculate number of exercises based on session duration and category
    let exerciseCount = Math.floor(sessionDuration / 8) // More exercises for longer sessions
    
    if (currentCategory === 'hiit') {
      exerciseCount = Math.floor(sessionDuration / 5) // More exercises for HIIT
    } else if (currentCategory === 'yoga' || currentCategory === 'flexibility') {
      exerciseCount = Math.floor(sessionDuration / 12) // Fewer exercises for flexibility
    }

    let exercises = []

    if (isCustomWorkout) {
      // For AI workout, create a balanced routine
      let bodyParts = []
      
      if (currentCategory === 'strength') {
        bodyParts = ["chest", "back", "shoulders", "upper arms", "upper legs"]
      } else if (currentCategory === 'cardio') {
        bodyParts = ["cardio"]
      } else if (currentCategory === 'flexibility') {
        bodyParts = ["neck", "waist", "back"]
      } else if (currentCategory === 'hiit') {
        bodyParts = ["upper legs", "lower legs", "chest", "back"]
      } else {
        bodyParts = ["back", "chest", "shoulders", "upper arms", "upper legs", "lower legs", "waist"]
      }

      // Fetch exercises for each body part
      const promises = bodyParts.map((bodyPart) => fetchExercisesByBodyPart(bodyPart))
      const results = await Promise.all(promises)

      // Flatten and shuffle the results
      const allExercises = results.flat()
      const shuffled = allExercises.sort(() => 0.5 - Math.random())

      // Filter by equipment if selected
      let filtered = shuffled
      if (currentEquipment) {
        filtered = shuffled.filter((e) => e.equipment === currentEquipment)
      }

      // Filter by category
      if (currentCategory !== 'all') {
        filtered = filtered.filter(exercise => {
          const category = classifyExercise(exercise)
          return category === currentCategory
        })
      }

      // Select the required number of exercises
      exercises = filtered.slice(0, exerciseCount)
    } else {
      // For manual workout, use the current filter
      if (currentExercises.length === 0) {
        await loadExercises()
      }

      // Shuffle and select the required number of exercises
      const shuffled = [...currentExercises].sort(() => 0.5 - Math.random())
      exercises = shuffled.slice(0, exerciseCount)
    }

    // Clear previous selection and add new exercises
    selectedExercises = []
    exercises.forEach((exercise) => {
      addExerciseToWorkout(exercise)
    })

    hideLoading()
    
    if (exercises.length > 0) {
      showNotification(`Generated ${exercises.length} exercise workout!`, 'success')
    } else {
      showNotification('No exercises found for the selected criteria. Try adjusting your filters.', 'warning')
    }
  } catch (error) {
    hideLoading()
    console.error('Error generating workout:', error)
    showNotification('Error generating workout. Please try again.', 'error')
  }
}

// Save workout to localStorage
function saveWorkout() {
  if (selectedExercises.length === 0) {
    alert("Please add exercises to your workout before saving.")
    return
  }

  const workoutName = prompt("Enter a name for your workout:", "My Custom Workout")

  if (!workoutName) return

  const workout = {
    id: Date.now(),
    name: workoutName,
    exercises: selectedExercises,
    duration: document.getElementById("session-duration").value,
    difficulty: document.getElementById("difficulty").value,
    category: workoutCategoryElement.textContent,
    created: new Date().toISOString(),
  }

  // Get existing workouts from localStorage
  const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]")
  savedWorkouts.push(workout)

  // Save to localStorage
  localStorage.setItem("savedWorkouts", JSON.stringify(savedWorkouts))

  showNotification(`Workout "${workoutName}" saved successfully!`, 'success')
}

// Print workout
function printWorkout() {
  if (selectedExercises.length === 0) {
    alert("Please add exercises to your workout before printing.")
    return
  }

  const printWindow = window.open("", "_blank")

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>FitJourney Workout Plan</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          text-align: center;
          color: #8e44ad;
          margin-bottom: 20px;
        }
        .workout-summary {
          display: flex;
          justify-content: space-around;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 1.2rem;
          font-weight: bold;
          color: #8e44ad;
        }
        .exercise-list {
          list-style: none;
          padding: 0;
        }
        .exercise-item {
          display: flex;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        .exercise-number {
          width: 30px;
          height: 30px;
          background-color: #8e44ad;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-weight: bold;
        }
        .exercise-image {
          width: 100px;
          margin-right: 15px;
          border-radius: 8px;
        }
        .exercise-details {
          flex: 1;
        }
        .exercise-name {
          font-weight: bold;
          margin-bottom: 5px;
          font-size: 1.1rem;
        }
        .exercise-meta {
          color: #666;
          font-size: 0.9rem;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 0.8rem;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <h1>FitJourney Workout Plan</h1>
      
      <div class="workout-summary">
        <div class="summary-item">
          <div class="summary-value">${document.getElementById("total-duration").textContent}</div>
          <div>Minutes</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${document.getElementById("exercise-count").textContent}</div>
          <div>Exercises</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${document.getElementById("difficulty-level").textContent}</div>
          <div>Difficulty</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${workoutCategoryElement.textContent}</div>
          <div>Category</div>
        </div>
      </div>
      
      <h2>Exercise List</h2>
      <ul class="exercise-list">
        ${selectedExercises
          .map(
            (exercise, index) => `
          <li class="exercise-item">
            <div class="exercise-number">${index + 1}</div>
            <img src="${exercise.gifUrl}" alt="${exercise.name}" class="exercise-image">
            <div class="exercise-details">
              <div class="exercise-name">${exercise.name}</div>
              <div class="exercise-meta">
                <div><strong>Target:</strong> ${exercise.target}</div>
                <div><strong>Equipment:</strong> ${exercise.equipment}</div>
                <div><strong>Category:</strong> ${classifyExercise(exercise)}</div>
                <div><strong>Sets:</strong> ${exercise.customSets || '3'} × <strong>Reps:</strong> ${exercise.customReps || '12'}</div>
              </div>
            </div>
          </li>
        `,
          )
          .join("")}
      </ul>
      
      <div class="footer">
        <p>Generated by FitJourney on ${new Date().toLocaleDateString()}</p>
        <p>Remember to warm up before exercising and cool down afterwards!</p>
      </div>
    </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  // Print after images have loaded
  setTimeout(() => {
    printWindow.print()
  }, 1000)
}

// Start workout session
function startWorkoutSession() {
  if (selectedExercises.length === 0) {
    alert("Please add exercises to your workout before starting a session.")
    return
  }

  // Save current workout to localStorage for the session page
  const currentWorkout = {
    exercises: selectedExercises,
    duration: document.getElementById("session-duration").value,
    difficulty: document.getElementById("difficulty").value,
    category: workoutCategoryElement.textContent,
    restTime: document.getElementById("rest-timer").value,
    transitionTime: document.getElementById("transition-timer").value,
  }

  localStorage.setItem("currentWorkout", JSON.stringify(currentWorkout))

  // Redirect to workout session page
  window.location.href = "workout-session.html"
}

// =============================
// Event Listeners
// =============================

// Category buttons
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    categoryButtons.forEach((btn) => btn.classList.remove("active"))

    // Add active class to clicked button
    button.classList.add("active")

    // Update current category
    currentCategory = button.dataset.category

    // Load exercises with new category
    loadExercises()
  })
})

// Filter buttons
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    filterButtons.forEach((btn) => btn.classList.remove("active"))

    // Add active class to clicked button
    button.classList.add("active")

    // Update current filter
    currentFilter = button.dataset.filter

    // Load exercises with new filter
    loadExercises()
  })
})

// Equipment select
if (equipmentSelect) {
  equipmentSelect.addEventListener("change", () => {
    currentEquipment = equipmentSelect.value
    loadExercises()
  })
}

// Generate workout button
if (generateWorkoutBtn) {
  generateWorkoutBtn.addEventListener("click", () => {
    generateAIWorkout()
  })
}

// Start workout button
if (startWorkoutBtn) {
  startWorkoutBtn.addEventListener("click", () => {
    startWorkoutSession()
  })
}

// Schedule workout button
if (scheduleWorkoutBtn) {
  scheduleWorkoutBtn.addEventListener("click", () => {
    openScheduleModal()
  })
}

// Schedule modal buttons
if (confirmScheduleBtn) {
  confirmScheduleBtn.addEventListener("click", () => {
    scheduleWorkout()
  })
}

if (cancelScheduleBtn) {
  cancelScheduleBtn.addEventListener("click", () => {
    scheduleModal.style.display = 'none'
  })
}

// Schedule management buttons
if (clearScheduleBtn) {
  clearScheduleBtn.addEventListener("click", () => {
    clearSchedule()
  })
}

if (saveScheduleBtn) {
  saveScheduleBtn.addEventListener("click", () => {
    saveSchedule()
    showNotification('Schedule saved successfully!', 'success')
  })
}

// Search button
if (searchBtn) {
  searchBtn.addEventListener("click", async () => {
    const query = exerciseSearch.value.trim()

    if (!query) {
      alert("Please enter a search term.")
      return
    }

    showLoading()

    try {
      const results = await searchExercises(query)
      currentExercises = results
      currentPage = 1

      hideLoading()
      renderExerciseCards(results)
      
      if (results.length === 0) {
        showNotification('No exercises found for your search.', 'warning')
      }
    } catch (error) {
      hideLoading()
      showNotification('Error searching exercises. Please try again.', 'error')
    }
  })
}

// Search input (search on Enter key)
if (exerciseSearch) {
  exerciseSearch.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchBtn.click()
    }
  })
}

// Pagination buttons
if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--
      renderExerciseCards(currentExercises)
    }
  })
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++
      renderExerciseCards(currentExercises)
    }
  })
}

// Modal close buttons
modalCloses.forEach(closeBtn => {
  closeBtn.addEventListener("click", () => {
    exerciseModal.style.display = "none"
    scheduleModal.style.display = "none"
  })
})

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === exerciseModal) {
    exerciseModal.style.display = "none"
  }
  if (e.target === scheduleModal) {
    scheduleModal.style.display = "none"
  }
})

// Clear workout button
if (clearWorkoutBtn) {
  clearWorkoutBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your workout?")) {
      selectedExercises = []
      renderWorkoutList()

      // Update UI for all exercise cards
      const addBtns = exerciseGrid.querySelectorAll(".add-btn")
      const selectedBtns = exerciseGrid.querySelectorAll(".selected-btn")

      addBtns.forEach((btn) => {
        btn.style.display = "flex"
      })

      selectedBtns.forEach((btn) => {
        btn.style.display = "none"
      })
      
      showNotification('Workout cleared', 'info')
    }
  })
}

// Save workout button
if (saveWorkoutBtn) {
  saveWorkoutBtn.addEventListener("click", async () => {
    if (selectedExercises.length === 0) {
      showNotification("Please select at least one exercise to save a workout.", "error");
      return;
    }
    const workoutName = prompt("Enter a name for your workout:", "My Custom Workout");
    if (!workoutName) return;
    const workout = {
      id: Date.now(),
      name: workoutName,
      exercises: selectedExercises,
      duration: document.getElementById("session-duration").value,
      difficulty: document.getElementById("difficulty").value,
      category: workoutCategoryElement.textContent,
      created: new Date().toISOString(),
    };
    // Try to save to folder if needed
    const savedToFolder = await saveWorkoutToFolderIfNeeded(workout);
    if (savedToFolder) {
      showNotification(`Workout "${workoutName}" saved to folder!`, 'success');
      return;
    }
    // Fallback: save to flat savedWorkouts
    const savedWorkouts = JSON.parse(localStorage.getItem("savedWorkouts") || "[]");
    savedWorkouts.push(workout);
    localStorage.setItem("savedWorkouts", JSON.stringify(savedWorkouts));
    showNotification(`Workout "${workoutName}" saved successfully!`, 'success');
  });
}

// Print workout button
if (printWorkoutBtn) {
  printWorkoutBtn.addEventListener("click", () => {
    printWorkout()
  })
}

// Theme toggle
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode")
    isLightMode = document.body.classList.contains("light-mode")

    const icon = themeToggleBtn.querySelector("i")
    icon.textContent = isLightMode ? "light_mode" : "dark_mode"

    // Save preference to localStorage
    localStorage.setItem("theme", isLightMode ? "light" : "dark")
  })

  // Check for saved theme preference
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "light") {
    themeToggleBtn.click()
  }
}

// Mobile menu toggle
if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener("click", () => {
    const nav = document.querySelector(".workout-nav")
    nav.classList.toggle("mobile-open")
  })
}

// User profile dropdown logic (nutrition dashboard match)
function toggleUserDropdown() {
  const profile = document.getElementById("userProfile");
  const dropdown = document.getElementById("userDropdown");
  profile?.classList.toggle("active");
  dropdown?.classList.toggle("active");
}

function closeUserDropdown() {
  document.getElementById("userProfile")?.classList.remove("active");
  document.getElementById("userDropdown")?.classList.remove("active");
}

document.getElementById("userProfile")?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleUserDropdown();
});
document.addEventListener("click", () => {
  closeUserDropdown();
});

// =============================
// Initialize
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Update calendar dates
  updateCalendarDates()
  
  // Load schedule
  loadSchedule()
  
  // Load initial exercises
  loadExercises()
  
  // Initialize mobile responsiveness
  handleMobileResize()
})

// Handle mobile resize
function handleMobileResize() {
  const handleResize = () => {
    const isMobile = window.innerWidth <= 768
    
    if (isMobile) {
      // Adjust for mobile
      document.body.classList.add('mobile-view')
    } else {
      // Desktop view
      document.body.classList.remove('mobile-view')
      const nav = document.querySelector(".workout-nav")
      nav.classList.remove("mobile-open")
    }
  }
  
  window.addEventListener('resize', handleResize)
  handleResize() // Initial call
}